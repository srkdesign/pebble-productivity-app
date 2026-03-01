import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";

import WindRose from "@/components/WindRose";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { getTasks } from "@/api/tasks";
import { getProjects } from "@/api/projects";
import { Task, Project } from "@/api/types";
import ProjectPieChart from "@/components/PieChart";
import CompletionRate from "@/components/CompletionRate";

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

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="md:flex bg-zinc-100 dark:bg-zinc-950">
      <div className="grid grid-cols-4 gap-4 grid-rows-3 w-full h-[calc(100dvh-7rem)] m-6">
        {" "}
        <Card className="p-4 col-span-2 row-span-3" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <CompletionRate projects={projects} tasks={tasks} />
            )}
          </CardBody>
        </Card>
        <Card className="p-4 col-span-1 row-span-2" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {projects.length > 0 && (
              <WindRose projects={projects} tasks={tasks} />
            )}
          </CardBody>
        </Card>
        <Card className="p-4 col-span-1 row-span-2" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <ProjectPieChart
                projects={projects}
                tasks={tasks.filter((t) => t.completed)}
              />
            )}
          </CardBody>
        </Card>
        <Card className="p-4 col-span-2 row-span-1" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <ActivityHeatmap tasks={tasks.filter((t) => t.completed)} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
