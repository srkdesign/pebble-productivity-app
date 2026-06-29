import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getTasks, deleteAllTasks } from "@api/tasks";
import {
  Button,
  Card,
  Modal,
  Skeleton,
  useOverlayState,
  Accordion,
} from "@heroui/react";
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const allTasks = await getTasks(projectId);
      setTasks(allTasks);
      setIsLoading(false);
    } catch (err) {
      alert(`Failed to fetch tasks: ${err}`);
    }
  }, [projectId]);

  useEffect(() => {
    setIsLoading(true);
    refreshTasks();
  }, [refreshTasks]);

  const { activeTasks, completedTasks } = useMemo(() => {
    const active: Task[] = [];
    const completed: Task[] = [];

    for (const t of tasks) {
      if (t.project_id !== projectId) continue;
      (t.completed ? completed : active).push(t);
    }

    return {
      activeTasks: active,
      completedTasks: completed,
    };
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
      {/* HEADER */}
      <div className="flex flex-col gap-6 mb-4">
        <h2 className="hidden md:block text-3xl font-bold tracking-[-0.04em]">
          {greeting.current}
        </h2>

        <Card className="flex flex-row grow p-2 shadow-none rounded-3xl">
          <Card.Content>
            <CreateTask
              activeProject={projectId}
              projects={projects}
              onCreated={refreshTasks}
            />
          </Card.Content>
        </Card>
      </div>

      {/* TASK AREA */}
      <div className="flex flex-col mt-12 space-y-3 grow">
        {/* HEADER ROW */}
        <div className="flex justify-between items-baseline">
          <h1 className="text-2xl font-bold pl-2">Tasks</h1>

          <Button
            className="rounded-full gap-2"
            size={isMobile ? "md" : "lg"}
            variant="danger-soft"
            onPress={() => deleteAllTasksState.open()}
          >
            Delete all
            <TrashBin size={isMobile ? 22 : 24} />
          </Button>
        </div>

        {/* ACTIVE TASKS (PRIMARY FOCUS) */}
        <div className="flex flex-col gap-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-3 shadow-none">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
              </Card>
            ))
          ) : activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                projects={projects}
                task={task}
                onUpdate={refreshTasks}
              />
            ))
          ) : (
            <p className="text-sm text-muted px-2 mb-6">No active tasks</p>
          )}
        </div>

        {/* COMPLETED (LOW PRIORITY DISCLOSURE) */}
        {completedTasks.length > 0 && (
          <div className="flex w-full p-0">
            <Accordion
              className="w-full rounded-lg"
              allowsMultipleExpanded={false}
            >
              <Accordion.Item key="completed">
                <Accordion.Heading>
                  <Accordion.Trigger className="px-0 rounded-2xl mt-8">
                    <h2 className="text-2xl font-bold pl-2.5">
                      Done ({completedTasks.length})
                    </h2>
                    <Accordion.Indicator className="mr-3.5" />
                  </Accordion.Trigger>
                </Accordion.Heading>

                <Accordion.Panel>
                  <Accordion.Body className="flex flex-col gap-2 mt-2 opacity-70 p-0 m-0 pt-2">
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        projects={projects}
                        task={task}
                        onUpdate={refreshTasks}
                      />
                    ))}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      <Modal state={deleteAllTasksState}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading>
                      Delete all tasks from all projects?
                    </Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>

                  <Modal.Footer className="flex *:w-full md:*:w-auto">
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
