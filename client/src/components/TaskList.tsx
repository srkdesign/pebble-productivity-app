import { useEffect, useState } from "react";
import axios from "axios";
import { Task, Project } from "@api/types";

import TaskItem from "./TaskItem";

interface TaskTabsProps {
  tasks: Task[];
  projects: Project[];
}

export default function TaskTabs({
  tasks: initialTasks,
  projects,
}: TaskTabsProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const refreshTasks = async () => {
    const res = await axios.get("/api/tasks");

    setTasks(res.data);
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          projects={projects}
          task={task}
          onUpdate={refreshTasks}
        />
      ))}
    </div>
  );
}
