import { useEffect, useState } from "react";
import { Card } from "@heroui/react";
import { TaskCalendar } from "@components/index";
import { getTasks } from "@api/tasks";
import { getProjects } from "@api/projects";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const data = await getTasks();

      setTasks(data);
    }
    fetchTasks();
  }, []);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    getProjects().then((p) => {
      setProjects(p);
    });
  }, []);

  return (
    <div className="md:flex w-full p-2 md:p-6">
      <Card className="h-[calc(100dvh-7rem)] p-0 w-full shadow-none">
        <Card.Content>
          <TaskCalendar projects={projects} tasks={tasks} />
        </Card.Content>
      </Card>
    </div>
  );
}
