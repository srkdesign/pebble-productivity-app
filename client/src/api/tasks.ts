// api/tasks.ts
import axios from "axios";
import localforage from "localforage";

import { isServerOnline } from "./network";
import { syncProjects } from "./projects";

import { Task } from "@/types";

const API = axios.create({ baseURL: `/api` });
const store = localforage.createInstance({ name: "tasks" });

function notifyTasksUpdated() {
  window.dispatchEvent(new CustomEvent("tasks-updated"));
}

if (navigator.storage?.persist) {
  navigator.storage.persist();
}

// ─── Sync dirty records to Flask ──────────────────────────────────────────────
export async function syncTasks() {
  if (!(await isServerOnline())) return; // don't attempt if server unreachable

  await syncProjects();

  const dirty: Task[] = [];

  await store.iterate<Task, void>((value) => {
    if (value?._dirty) dirty.push(value);
  });

  await Promise.all(
    dirty.map(async (task) => {
      // ✅ Strip _dirty before sending to Flask
      const { _dirty, ...payload } = task;

      try {
        if (task.id < 0) {
          // ✅ Temp negative ID = new task, use POST not PATCH
          const res = await API.post(`/tasks`, payload);

          // ✅ Remove old temp record, store with real ID from Flask
          await store.removeItem(String(task.id));
          await store.setItem(String(res.data.id), {
            ...res.data,
            _dirty: false,
          });
        } else {
          // ✅ Existing task, use PATCH
          const res = await API.patch(`/tasks/${task.id}`, payload);

          await store.setItem(String(task.id), { ...res.data, _dirty: false });
        }
      } catch {
        // leave dirty if sync fails, will retry next time
      }
    }),
  );
}

// ✅ Multiple triggers — online event unreliable on mobile
window.addEventListener("online", syncTasks);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncTasks(); // fires when user switches back to app
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function cacheTask(task: Task) {
  await store.setItem(String(task.id), { ...task, _dirty: false });

  return task;
}

async function markDirty(task: Task) {
  await store.setItem(String(task.id), { ...task, _dirty: true });

  return task;
}

// ─── API calls — identical signatures, components unchanged ───────────────────
export const getTasks = async (projectId?: number): Promise<Task[]> => {
  if (!(await isServerOnline())) {
    const tasks: Task[] = [];

    await store.iterate<Task, void>((value) => {
      if (!projectId || value.project_id === projectId) tasks.push(value);
    });

    return tasks;
  }

  await syncTasks(); // ✅ sync first, then fetch

  const params = projectId ? { project_id: projectId } : {};
  const res = await API.get("/tasks", { params });

  await Promise.all(res.data.map(cacheTask));

  return res.data;
};

export const createTask = async (
  title: string,
  projectId?: number,
  dueDate?: number,
  recurring_rule?: {
    title: string;
    project_id: number;
    pattern: string;
    interval?: number;
    days?: string;
    start_date?: number;
    end_date?: number;
  },
): Promise<Task> => {
  const payload: any = { title, project_id: projectId, due_date: dueDate };

  if (recurring_rule) payload.recurring_rule = recurring_rule;

  if (!(await isServerOnline())) {
    const tempTask: Task = { ...payload, id: -Date.now(), _dirty: true };

    await markDirty(tempTask);

    return tempTask;
  }

  const res = await API.post("/tasks", payload);

  return cacheTask(res.data);
};

export const toggleComplete = async (id: number): Promise<Task> => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Task>(String(id));
    const updated = { ...cached!, completed: !cached?.completed, _dirty: true };

    notifyTasksUpdated();

    return markDirty(updated);
  }
  const res = await API.put(`/tasks/${id}/complete`);

  notifyTasksUpdated();

  return cacheTask(res.data);
};

export const deleteTask = async (id: number): Promise<void> => {
  await store.removeItem(String(id));
  if (await isServerOnline()) await API.delete(`/tasks/${id}/delete`);
};

export const startTimer = async (id: number): Promise<Task> => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Task>(String(id));

    notifyTasksUpdated();

    return markDirty({
      ...cached!,
      is_running: true,
      last_start: Math.floor(Date.now() / 1000),
    });
  }
  const res = await API.post(`/tasks/${id}/start`);

  notifyTasksUpdated();

  return cacheTask(res.data);
};

export const stopTimer = async (id: number): Promise<Task> => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Task>(String(id));
    const now = Math.floor(Date.now() / 1000);
    const elapsed =
      (cached?.time_spent ?? 0) + (now - (cached?.last_start ?? now));

    notifyTasksUpdated();

    return markDirty({
      ...cached!,
      is_running: false,
      last_start: undefined,
      time_spent: elapsed,
    });
  }
  const res = await API.post(`/tasks/${id}/stop`);

  notifyTasksUpdated();

  return cacheTask(res.data);
};

export const updateTask = async (
  id: number,
  data: Partial<{
    title: string;
    completed: boolean;
    project_id: number;
    due_date: number;
    time_spent: number;
  }>,
): Promise<Task> => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Task>(String(id));

    notifyTasksUpdated();

    return markDirty({ ...cached!, ...data });
  }
  const res = await API.patch(`/tasks/${id}`, data);

  notifyTasksUpdated();

  return cacheTask(res.data);
};

export const deleteAllTasks = async (): Promise<void> => {
  await store.clear();
  if (await isServerOnline()) await API.delete("/tasks/delete_all");
};
