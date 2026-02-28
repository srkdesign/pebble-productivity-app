import axios from "axios";

import { Project } from "./types";

import { HOST, PORT } from "@/config/env";

const API = axios.create({ baseURL: `http://${HOST}:${PORT}` });

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
  const res = await API.post("/projects", { name, color });

  return res.data;
};

export const updateProject = async (
  id: number,
  data: { name?: string; color?: string },
) => {
  const res = await API.patch(`/projects/${id}`, data);

  return res.data;
};
