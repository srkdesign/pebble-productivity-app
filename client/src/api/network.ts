import axios from "axios";

const API = axios.create({ baseURL: "/api" });

export async function isServerOnline(): Promise<boolean> {
  try {
    await API.get("/health", { timeout: 3000 });

    return true;
  } catch {
    return false;
  }
}
