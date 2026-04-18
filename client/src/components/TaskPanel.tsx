import { useState, useEffect, useRef } from "react";
import { getTasks, deleteAllTasks } from "@api/tasks";
import { Button, Card, Modal, Skeleton, useOverlayState } from "@heroui/react";
import { CreateTask, TaskItem } from "@components/index";
import { TrashBin } from "@icons";

import { Task } from "@/types";
import { greetings } from "@/consts/greetings";

interface TaskPanelProps {
  projects: any[];
  projectId: number;
}

export default function TaskPanel({ projects, projectId }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const greeting = useRef(
    greetings[Math.floor(Math.random() * greetings.length)],
  );

  const deleteAllTasksState = useOverlayState();

  // useIsMobile removed — replaced with a standard hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");

    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const refreshTasks = async () => {
    try {
      const allTasks = await getTasks();

      setTasks(allTasks);
    } catch (err) {
      alert(`Failed to fetch tasks: ${err}`);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);

  const filteredTasks = tasks
    .filter((t) => t.project_id === projectId)
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayTasks(filteredTasks);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [tasks, projectId]);

  const handleDeleteAll = async () => {
    try {
      await deleteAllTasks();
      setTasks([]);
    } catch (err) {
      alert(`Failed to delete all tasks: ${err}`);
    }
    deleteAllTasksState.close();
  };

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="hidden md:block text-3xl font-bold mb-4 md:text-left tracking-[-0.04em]">
          {greeting.current}
        </h2>
        <Card className="flex flex-row grow p-2 shadow-none rounded-3xl">
          <Card.Content>
            <div className="flex flex-col-reverse md:flex-row gap-2">
              <CreateTask
                activeProject={projectId}
                projects={projects}
                onCreated={refreshTasks}
              />
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="flex flex-col mt-16 space-y-2">
        <div className="flex justify-between items-baseline">
          <h1 className="text-2xl font-bold mb-4 pl-2 tracking-tight">Tasks</h1>
          <Button
            className="rounded-full [&_svg]:size-4 gap-2"
            size={isMobile ? "md" : "lg"}
            variant="danger-soft"
            onPress={() => deleteAllTasksState.open()}
          >
            Delete all
            <TrashBin size={isMobile ? 22 : 24} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-3 shadow-none">
                <Card.Content className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </Card.Content>
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

      {/* Delete modal */}
      <Modal state={deleteAllTasksState}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading>
                      Are you sure you want to delete all tasks from all
                      projects?
                    </Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Footer>
                    <Button variant="tertiary" onPress={close}>
                      Cancel
                    </Button>
                    <Button variant="danger" onPress={handleDeleteAll}>
                      Delete
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
