import { useEffect, useState } from "react";
import { getTasks } from "@api/tasks";
import { getProjects } from "@api/projects";
import { Card } from "@heroui/react";
import {
  ProjectPieChart,
  CompletionRate,
  ActivityHeatmap,
  WindRose,
} from "@components/index";

import { Task, Project } from "@/types";

export default function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        getTasks(),
        getProjects(),
      ]);

      setTasks(fetchedTasks || []);
      setProjects(fetchedProjects || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading analytics...
      </div>
    );

  return (
    <div className="md:flex h-full">
      <div className="flex flex-col md:grid grid-cols-4 md:gap-4 gap-2 grid-rows-3 w-full md:p-6 p-2 md:h-full">
        {" "}
        <Card className="p-4 col-span-2 row-span-3 shadow-none">
          <Card.Content className="flex flex-col items-center justify-start gap-8">
            {tasks.length > 0 && (
              <CompletionRate projects={projects} tasks={tasks} />
            )}
          </Card.Content>
        </Card>
        <Card className="p-4 md:col-span-1 row-span-2 shadow-none">
          <Card.Content className="flex flex-col items-center justify-center gap-8">
            {projects.length > 0 && (
              <WindRose projects={projects} tasks={tasks} />
            )}
          </Card.Content>
        </Card>
        <Card className="p-4 col-span-1 row-span-2 shadow-none">
          <Card.Content className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <ProjectPieChart
                projects={projects}
                tasks={tasks.filter((t) => t.completed)}
              />
            )}
          </Card.Content>
        </Card>
        <Card className="p-4 col-span-2 row-span-1 shadow-none">
          <Card.Content className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <ActivityHeatmap tasks={tasks.filter((t) => t.completed)} />
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
