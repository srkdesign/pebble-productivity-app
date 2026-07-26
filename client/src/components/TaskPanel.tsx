import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getTasks, getViewTasks, deleteAllTasks, SmartView } from "@api/tasks";
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
import { Task, Project } from "@/types";
import { greetings } from "@/consts/greetings";

const VIEW_LABELS: Record<SmartView, string> = {
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
};

interface TaskPanelProps {
  projects: Project[];
  projectId?: number;
  view?: SmartView;
  inboxProjectId?: number;
}

export default function TaskPanel({
  projects,
  projectId,
  view,
  inboxProjectId,
}: TaskPanelProps) {
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
      let allTasks: Task[];

      if (view) {
        allTasks = await getViewTasks(view);
      } else {
        allTasks = await getTasks(projectId);
      }

      setTasks(allTasks);
      setIsLoading(false);
    } catch (err: any) {
      // replace alert with toast if available in your UI lib
      console.error("Failed to fetch tasks:", err?.message ?? err);
      setIsLoading(false);
    }
  }, [projectId, view, inboxProjectId]);

  useEffect(() => {
    setIsLoading(true);
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    window.addEventListener("tasks-updated", refreshTasks);
    return () => window.removeEventListener("tasks-updated", refreshTasks);
  }, [refreshTasks]);

  // ✅ No project filter needed — data is already filtered upstream
  // Fix useMemo — add explicit return type
  const { activeTasks, completedTasks } = useMemo((): {
    activeTasks: Task[];
    completedTasks: Task[];
  } => {
    const active: Task[] = [];
    const completed: Task[] = [];

    for (const t of tasks) {
      // when a project is selected, filter by project — views are pre-filtered by API
      if (!view && t.project_id !== projectId) continue;
      (t.completed ? completed : active).push(t);
    }

    return { activeTasks: active, completedTasks: completed };
  }, [tasks, projectId, view]);

  const handleDeleteAll = async () => {
    try {
      await deleteAllTasks();
      setTasks([]);
    } catch (err: any) {
      console.error("Failed to delete tasks:", err?.message ?? err);
    }
    deleteAllTasksState.close();
  };

  return (
    <div className="flex-1">
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

      <div className="flex flex-col mt-12 space-y-3 grow">
        <div className="flex justify-between items-baseline">
          <h1 className="text-2xl font-bold pl-2">
            {view ? VIEW_LABELS[view] : "Tasks"}
          </h1>

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

        <div className="flex flex-col gap-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-3 shadow-none">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
              </Card>
            ))
          ) : activeTasks.length > 0 ? (
            // Fix map callbacks — task is already Task[] so just annotate
            activeTasks.map((task: Task) => (
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
                    {completedTasks.map((task: Task) => (
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
