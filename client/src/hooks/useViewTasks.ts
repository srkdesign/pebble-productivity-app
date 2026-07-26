import { useEffect } from "react";
import { getViewTasks, SmartView } from "@/api/tasks";
import { Task } from "@/types";
import { useAsync } from "./useAsync";

export function useViewTasks(view: SmartView, inboxProjectId?: number) {
  const result = useAsync<Task[]>(
    () => getViewTasks(view),
    [view, inboxProjectId],
  );

  useEffect(() => {
    window.addEventListener("tasks-updated", result.refetch);
    return () => window.removeEventListener("tasks-updated", result.refetch);
  }, [result.refetch]);

  return result;
}
