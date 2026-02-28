import { useEffect, useState } from "react";
import axios from "axios";
import TaskItem from "./TaskItem";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  is_running: boolean;
  time_spent: number;
  project_id: number;
}

interface TaskTabsProps {
  tasks: Task[];
}

export default function TaskTabs({ tasks: initialTasks }: TaskTabsProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const refreshTasks = async () => {
    const res = await axios.get("/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdate={refreshTasks} />
      ))}
    </div>
  );
}
