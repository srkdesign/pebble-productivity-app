import { useState, useEffect } from "react";
import { Task } from "@api/types";
import { getTasks, deleteAllTasks } from "@api/tasks";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/react";
import { useIsMobile } from "@heroui/use-is-mobile";

import TrashBin from "../icons/TrashBin";

import TaskItem from "./TaskItem";
import CreateTask from "./CreateTask";

interface TaskPanelProps {
  projects: any[];
  projectId: number;
}

export default function TaskPanel({ projects, projectId }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useIsMobile();

  const refreshTasks = async () => {
    try {
      const allTasks = await getTasks();

      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);

  // Always filter from array
  const filteredTasks = tasks
    .filter((t) => t.project_id === projectId)
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayTasks(filteredTasks);
      setIsLoading(false);
    }, 600); // match your animation duration

    return () => clearTimeout(timeout);
  }, [tasks, projectId]);

  // ✅ Delete all tasks handler
  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all tasks?")) return;

    try {
      await deleteAllTasks();
      setTasks([]); // ✅ clear local state
    } catch (err) {
      console.error("Failed to delete all tasks", err);
    }
  };

  return (
    <div className="flex-1 md:p-6 p-2">
      <div className="flex justify-between items-center gap-2 mb-4">
        <Card className="flex flex-row grow p-2" shadow="none">
          <CardBody>
            <div className="flex flex-col-reverse md:flex-row gap-2">
              <CreateTask
                activeProject={projectId}
                projects={projects}
                onCreated={refreshTasks}
              />
              <div className="flex items-center justify-between mb-4 md:mb-0">
                <h2 className=" block opacity-100 md:hidden md:opaicty-0 text-xl md:text-lg font-bold">
                  Create task
                </h2>
                {/* Delete All Button */}
                <Button
                  isIconOnly
                  color="danger"
                  radius="md"
                  size={isMobile ? "md" : "lg"}
                  variant="flat"
                  onPress={handleDeleteAll}
                >
                  <TrashBin color="#ec003f" size={isMobile ? 22 : 24} />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col mt-16 space-y-2">
        <h1 className="text-2xl font-bold mb-4 text-center md:text-left">
          Tasks
        </h1>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-3" shadow="none">
                <CardBody className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          displayTasks.map((task) => (
            <TaskItem
              key={task.id}
              projects={projects}
              task={task}
              onUpdate={refreshTasks}
            />
          ))
        )}
      </div>
    </div>
  );
}
