import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";

import TaskCalendar from "@components/TaskCalendar";
import { getTasks } from "../api/tasks";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const data = await getTasks();
      setTasks(data);
    }
    fetchTasks();
  }, []);

  return (
    <div className="md:flex w-full bg-zinc-100 dark:bg-zinc-950">
      <Card shadow="none" className="h-[calc(100dvh-7rem)] m-6 w-full">
        <CardBody>
          <TaskCalendar tasks={tasks} />
        </CardBody>
      </Card>
    </div>
  );
}
