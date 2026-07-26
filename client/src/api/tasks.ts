import axios from "axios";
import localforage from "localforage";
import { isServerOnline } from "./network";
import { syncProjects } from "./projects";
import { Task } from "@/types";

const API = axios.create({ baseURL: `/api` });
const store = localforage.createInstance({ name: "tasks" });

export type SmartView = "today" | "upcoming" | "overdue";

function notifyTasksUpdated() {
  window.dispatchEvent(new CustomEvent("tasks-updated"));
}

if (navigator.storage?.persist) {
  navigator.storage.persist();
}

// ─── Debounce helper ──────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────
export async function syncTasks() {
  if (!(await isServerOnline())) return;
  await syncProjects();

  const dirty: Task[] = [];
  await store.iterate<Task, void>((value) => {
    if (value?._dirty) dirty.push(value);
  });

  await Promise.all(
    dirty.map(async (task) => {
      const { _dirty, ...payload } = task;
      try {
        if (task.id < 0) {
          const res = await API.post(`/tasks`, payload);
          await store.removeItem(String(task.id));
          await store.setItem(String(res.data.id), {
            ...res.data,
            _dirty: false,
          });
        } else {
          const res = await API.patch(`/tasks/${task.id}`, payload);
          await store.setItem(String(task.id), { ...res.data, _dirty: false });
        }
      } catch {
        // leave dirty, retry next time
      }
    }),
  );
}

// ─── Debounced sync listeners — prevents sync storms on mobile ────────────────
const debouncedSync = debounce(syncTasks, 2000);

window.addEventListener("online", debouncedSync);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) debouncedSync();
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

// ─── Single cache read — shared by getTasks and getViewTasks ──────────────────
async function getAllCached(): Promise<Task[]> {
  const tasks: Task[] = [];

  await store.iterate<Task, void>((value) => {
    tasks.push(value);
  });

  return tasks;
}

// ─── View filter — mirrors backend logic exactly, used when offline ───────────
function filterByView(tasks: Task[], view: SmartView): Task[] {
  const now = new Date();

  const todayStart =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

  const todayEnd = todayStart + 86399;
  const upcomingEnd = todayStart + 3 * 86400 + 86399;

  switch (view) {
    case "today":
      return tasks.filter(
        (task) =>
          !task.completed &&
          task.due_date != null &&
          task.due_date >= todayStart &&
          task.due_date <= todayEnd,
      );

    case "upcoming":
      return tasks.filter(
        (task) =>
          !task.completed &&
          task.due_date != null &&
          task.due_date >= todayStart &&
          task.due_date <= upcomingEnd,
      );

    case "overdue":
      return tasks.filter(
        (task) =>
          !task.completed &&
          task.due_date != null &&
          task.due_date < todayStart,
      );
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getTasks = async (projectId?: number): Promise<Task[]> => {
  if (!(await isServerOnline())) {
    const tasks = await getAllCached();

    return projectId !== undefined
      ? tasks.filter((task) => task.project_id === projectId)
      : tasks;
  }

  await syncTasks();

  const params = projectId !== undefined ? { project_id: projectId } : {};

  const res = await API.get("/tasks", { params });

  const tasks: Task[] = res?.data?.data ?? [];

  if (!Array.isArray(tasks)) return [];

  await Promise.all(tasks.map(cacheTask));

  return tasks;
};

export const getViewTasks = async (view: SmartView): Promise<Task[]> => {
  if (!(await isServerOnline())) {
    return filterByView(await getAllCached(), view);
  }

  const res = await API.get(`/views/${view}/tasks`);
  const tasks: Task[] = res?.data?.data ?? [];

  if (!Array.isArray(tasks)) return [];

  await Promise.all(tasks.map(cacheTask));

  return tasks;
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
    const now = Math.floor(Date.now() / 1000);
    const base =
      cached?.is_running && cached?.last_start != null
        ? (cached.time_spent ?? 0) + (now - cached.last_start)
        : (cached?.time_spent ?? 0);
    const updated: Task = {
      ...cached!,
      is_running: true,
      last_start: now,
      time_spent: base,
    };
    await markDirty(updated);
    notifyTasksUpdated();
    return updated;
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
      cached?.last_start != null
        ? (cached.time_spent ?? 0) + (now - cached.last_start)
        : (cached?.time_spent ?? 0);
    const updated: Task = {
      ...cached!,
      is_running: false,
      last_start: undefined,
      time_spent: elapsed,
    };
    await markDirty(updated);
    notifyTasksUpdated();
    return updated;
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
