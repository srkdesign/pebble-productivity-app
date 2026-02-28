import { useState, useEffect } from "react";
import { Task } from "@api/types";
import { getTasks, deleteAllTasks } from "@api/tasks";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/react";

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
      setIsInitialLoad(false);
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
        <Card className="flex flex-row grow" shadow="none">
          <CardBody className="md:p-4 p-2">
            <div className="flex flex-col md:flex-row gap-2">
              <CreateTask
                activeProject={projectId}
                projects={projects}
                onCreated={refreshTasks}
              />
              {/* Delete All Button */}
              <Button
                isIconOnly
                color="danger"
                radius="md"
                size="lg"
                variant="flat"
                onPress={handleDeleteAll}
              >
                <TrashBin color="#ec003f" size={24} />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col mt-16 space-y-2">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>

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
