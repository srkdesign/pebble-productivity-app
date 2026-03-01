import axios from "axios";

import { Project } from "./types";

const API = axios.create({ baseURL: `/api` });

export const getProjects = async (): Promise<Project[]> => {
  try {
    const res = await API.get("/projects");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch projects", err);
    return [];
  }
};

export const createProject = async (
  name: string,
  color: string,
): Promise<Project> => {
  try {
    const res = await API.post("/projects", { name, color });
    return res.data;
  } catch (err) {
    console.error("Failed to create project", err);
    throw err;
  }
};

export const updateProject = async (
  id: number,
  data: { name?: string; color?: string },
) => {
  try {
    const res = await API.patch(`/projects/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update project", err);
    throw err;
  }
};

export const deleteProject = async (id: number) => {
  try {
    const res = await API.delete(`/projects/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to delete project", err);
    throw err;
  }
};
