// api/tasks.ts
import axios from "axios";

import { Task } from "./types";

const API = axios.create({ baseURL: `/api` });

export const getTasks = async (projectId?: number): Promise<Task[]> => {
  const params = projectId ? { project_id: projectId } : {};
  const res = await API.get("/tasks", { params });

  return res.data;
};

// --- Fixed createTask ---
export const createTask = async (
  title: string,
  projectId?: number,
  dueDate?: number,
  recurring_rule?: {
    title: string;
    project_id: number;
    pattern: string; // "daily" | "weekly" | "monthly"
    interval?: number;
    days?: string; // for weekly recurrence: "0,2,4"
    start_date?: number;
    end_date?: number;
  },
): Promise<Task> => {
  const payload: any = {
    title,
    project_id: projectId,
    due_date: dueDate,
  };

  if (recurring_rule) {
    payload.recurring_rule = recurring_rule;
  }

  const res = await API.post("/tasks", payload);

  return res.data;
};

export const toggleComplete = async (id: number): Promise<Task> => {
  const res = await API.put(`/tasks/${id}/complete`);

  return res.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await API.delete(`/tasks/${id}/delete`);
};

export const startTimer = async (id: number): Promise<Task> => {
  const res = await API.post(`/tasks/${id}/start`);

  return res.data;
};

export const stopTimer = async (id: number): Promise<Task> => {
  const res = await API.post(`/tasks/${id}/stop`);

  return res.data;
};

export const updateTask = async (
  id: number,
  data: Partial<{
    title: string;
    completed: boolean;
    project_id: number;
    due_date: number;
  }>,
): Promise<Task> => {
  const res = await API.patch(`/tasks/${id}`, data);

  return res.data;
};

export const deleteAllTasks = async (): Promise<void> => {
  await API.delete("/tasks/delete_all");
};
