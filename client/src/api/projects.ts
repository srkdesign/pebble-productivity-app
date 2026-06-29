// api/projects.ts
import axios from "axios";
import localforage from "localforage";
import { isServerOnline } from "./network";
import { Project } from "@/types";

const API = axios.create({ baseURL: `/api` });

const store = localforage.createInstance({ name: "projects" });
const taskStore = localforage.createInstance({ name: "tasks" });

if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  navigator.storage.persist();
}

/* ─────────────────────────────────────────────
   SYNC PROJECTS
───────────────────────────────────────────── */
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

          const res = await API.post("/projects", {
            name: project.name,
            color: project.color,
          });

          const created = res.data;
          const realId = created.id;

          await store.removeItem(String(tempId));
          await store.setItem(String(realId), {
            ...created,
            _dirty: false,
          });

          // update tasks referencing temp project
          const updates: Array<{ key: string; task: any }> = [];

          await taskStore.iterate((value: any, key: string) => {
            if (value?.project_id === tempId) {
              updates.push({ key, task: value });
            }
          });

          await Promise.all(
            updates.map(({ key, task }) =>
              taskStore.setItem(key, {
                ...task,
                project_id: realId,
                _dirty: true,
              }),
            ),
          );
        } else {
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
        // keep dirty for retry
      }
    }),
  );
}

/* ─────────────────────────────────────────────
   EVENTS
───────────────────────────────────────────── */
window.addEventListener("online", syncProjects);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncProjects();
});

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
async function cacheProject(project: Project) {
  await store.setItem(String(project.id), { ...project, _dirty: false });
  return project;
}

async function markDirty(project: Project) {
  await store.setItem(String(project.id), { ...project, _dirty: true });
  return project;
}

/* ─────────────────────────────────────────────
   GET PROJECTS (FIXED - NO .map CRASH)
───────────────────────────────────────────── */
export const getProjects = async (): Promise<Project[]> => {
  if (!(await isServerOnline())) {
    const projects: Project[] = [];

    await store.iterate<Project, void>((value) => {
      projects.push(value);
    });

    return projects;
  }

  await syncProjects();

  try {
    const res = await API.get("/projects");

    const raw = res?.data;

    const projects: Project[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.projects)
          ? raw.projects
          : [];

    await Promise.all(projects.map(cacheProject));

    return projects;
  } catch (err) {
    alert(`Failed to fetch projects: ${err}`);
    return [];
  }
};

/* ─────────────────────────────────────────────
   CREATE PROJECT
───────────────────────────────────────────── */
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

  const res = await API.post("/projects", { name, color });

  return cacheProject(res.data);
};

/* ─────────────────────────────────────────────
   UPDATE PROJECT
───────────────────────────────────────────── */
export const updateProject = async (
  id: number,
  data: { name?: string; color?: string },
) => {
  if (!(await isServerOnline())) {
    const cached = await store.getItem<Project>(String(id));
    return markDirty({ ...cached!, ...data });
  }

  const res = await API.patch(`/projects/${id}`, data);
  return cacheProject(res.data);
};

/* ─────────────────────────────────────────────
   DELETE PROJECT
───────────────────────────────────────────── */
export const deleteProject = async (id: number) => {
  await store.removeItem(String(id));

  if (!(await isServerOnline())) return;

  await API.delete(`/projects/${id}`);
};
