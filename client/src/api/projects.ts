// api/projects.ts
import axios from "axios";
import localforage from "localforage";
import { isServerOnline } from "./network";
import { Project } from "@/types";

const API = axios.create({ baseURL: `/api` });
const store = localforage.createInstance({ name: "projects" });
const taskStore = localforage.createInstance({ name: "tasks" }); // ✅ access task store

if (navigator.storage?.persist) {
  navigator.storage.persist();
}

// ─── Sync ─────────────────────────────────────────────────────────────────────
export async function syncProjects() {
  if (!(await isServerOnline())) return;

  const dirty: Project[] = [];
  await store.iterate<Project, void>((value) => {
    if (value?._dirty) dirty.push(value);
  });

  await Promise.all(
    dirty.map(async (project) => {
      try {
        if (project.id < 0) {
          const tempId = project.id;

          // ✅ only send what Flask expects
          const res = await API.post(`/projects`, {
            name: project.name,
            color: project.color,
          });
          const realId = res.data.id;

          // ✅ remove temp project, store with real ID
          await store.removeItem(String(tempId));
          await store.setItem(String(realId), {
            ...res.data,
            _dirty: false,
          });

          // ✅ find all tasks referencing the temp project ID
          const tasksToUpdate: Array<{ key: string; task: any }> = [];
          await taskStore.iterate((value: any, key: string) => {
            if (value?.project_id === tempId) {
              tasksToUpdate.push({ key, task: value });
            }
          });

          // ✅ update those tasks with real project ID, keep dirty for syncTasks
          await Promise.all(
            tasksToUpdate.map(({ key, task }) =>
              taskStore.setItem(key, {
                ...task,
                project_id: realId,
                _dirty: true,
              }),
            ),
          );
        } else {
          // ✅ existing project — only send name and color
          const res = await API.patch(`/projects/${project.id}`, {
            name: project.name,
            color: project.color,
          });
          await store.setItem(String(project.id), {
            ...res.data,
            _dirty: false,
          });
        }
      } catch {
        // leave dirty, retry next sync
      }
    }),
  );
}

// ✅ multiple triggers — online event unreliable on mobile
window.addEventListener("online", syncProjects);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncProjects();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function cacheProject(project: Project) {
  await store.setItem(String(project.id), { ...project, _dirty: false });
  return project;
}

async function markDirty(project: Project) {
  await store.setItem(String(project.id), { ...project, _dirty: true });
  return project;
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getProjects = async (): Promise<Project[]> => {
  if (!(await isServerOnline())) {
    const projects: Project[] = [];
    await store.iterate<Project, void>((value) => projects.push(value));
    return projects;
  }

  await syncProjects(); // ✅ sync first, then fetch

  try {
    const res = await API.get("/projects");
    await Promise.all(res.data.map(cacheProject));
    return res.data;
  } catch (err) {
    alert(`Failed to fetch projects: ${err}`);
    return [];
  }
};

export const createProject = async (
  name: string,
  color: string,
): Promise<Project> => {
  if (!(await isServerOnline())) {
    const tempProject: Project = {
      id: -Date.now(),
      name,
      color,
      is_default: false,
      is_archived: false,
      created_at: Date.now(),
      updated_at: Date.now(),
      _dirty: true,
    };
    await markDirty(tempProject);
    return tempProject;
  }

  try {
    const res = await API.post("/projects", { name, color });
    return cacheProject(res.data);
  } catch (err) {
    alert(`Failed to create project: ${err}`);
    throw err;
  }
};

export const updateProject = async (
  id: number,
  data: { name?: string; color?: string },
) => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Project>(String(id));
    return markDirty({ ...cached!, ...data });
  }

  try {
    const res = await API.patch(`/projects/${id}`, data);
    return cacheProject(res.data);
  } catch (err) {
    alert(`Failed to update project: ${err}`);
    throw err;
  }
};

export const deleteProject = async (id: number) => {
  await store.removeItem(String(id));
  if (!(await isServerOnline())) return;

  try {
    const res = await API.delete(`/projects/${id}`);
    return res.data;
  } catch (err) {
    alert(`Failed to delete project: ${err}`);
    throw err;
  }
};
