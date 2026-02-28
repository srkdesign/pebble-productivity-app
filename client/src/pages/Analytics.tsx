import React, { useEffect, useState } from "react";
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
              <CompletionRate tasks={tasks} projects={projects} />
            )}
          </CardBody>
        </Card>
        <Card className="p-4 col-span-1 row-span-2" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {projects.length > 0 && (
              <WindRose tasks={tasks} projects={projects} />
            )}
          </CardBody>
        </Card>
        <Card className="p-4 col-span-1 row-span-2" shadow="none">
          <CardBody className="flex flex-col items-center justify-center gap-8">
            {tasks.length > 0 && (
              <ProjectPieChart
                tasks={tasks.filter((t) => t.completed)}
                projects={projects}
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
    // <div className="p-6 space-y-8">
    //   <h2 className="text-xl font-bold">Task Activity Wind Rose</h2>
    //   {projects.length > 0 && <WindRose tasks={tasks} projects={projects} />}

    //   <h2 className="text-xl font-bold">Task Completion Heatmap</h2>
    //   {tasks.length > 0 && (
    //     <ActivityHeatmap tasks={tasks.filter((t) => t.completed)} />
    //   )}
    // </div>
  );
}
