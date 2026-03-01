import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button, ButtonGroup } from "@heroui/button";
import { Checkbox } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Task, Project } from "@api/types";
import {
  toggleComplete,
  deleteTask,
  startTimer,
  stopTimer,
  updateTask,
} from "@api/tasks";
import formatRecurring from "@utils/recurring";

import TrashBin from "../icons/TrashBin";
import PlayButton from "../icons/PlayButton";
import Pause from "../icons/Pause";
import RepeatIcon from "../icons/Repeat";
import EditIcon from "../icons/Edit";

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onUpdate: () => void;
}

export default function TaskItem({
  task: initialTask,
  projects = [],
  onUpdate,
}: TaskItemProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [title, setTitle] = useState(initialTask.title);
  const [editingTitle, setEditingTitle] = useState(false);

  const [projectId, setProjectId] = useState(initialTask.project_id);
  const [editingProject, setEditingProject] = useState(false);

  const [dueDate, setDueDate] = useState(
    initialTask.due_date
      ? new Date(initialTask.due_date * 1000).toISOString().substring(0, 10)
      : "",
  );
  const [editingDue, setEditingDue] = useState(false);

  const [timeSpent, setTimeSpent] = useState(initialTask.time_spent ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Live timer effect ---
  useEffect(() => {
    setTask(initialTask);
    setTitle(initialTask.title);
    setProjectId(initialTask.project_id);
    setDueDate(
      initialTask.due_date
        ? new Date(initialTask.due_date * 1000).toISOString().substring(0, 10)
        : "",
    );
    setTimeSpent(initialTask.time_spent ?? 0);

    if (intervalRef.current) clearInterval(intervalRef.current);

    if (initialTask.is_running) {
      const startTime = initialTask.last_start
        ? initialTask.last_start * 1000
        : Date.now();

      intervalRef.current = setInterval(() => {
        const base = initialTask.time_spent ?? 0;

        setTimeSpent(base + Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialTask]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${h}:${m}:${s}`;
  };

  // --- Handlers ---
  const handleToggleComplete = async () => {
    const updated = await toggleComplete(task.id);

    setTask(updated);
    onUpdate();
  };

  const handleToggleTimer = async () => {
    const updated = task.is_running
      ? await stopTimer(task.id)
      : await startTimer(task.id);

    setTask(updated);
    onUpdate();
  };

  const handleDelete = async () => {
    if (confirm("Delete this task?")) {
      await deleteTask(task.id);
      onUpdate();
    }
  };

  const handleSaveTitle = async () => {
    if (title.trim() && title !== task.title) {
      const updated = await updateTask(task.id, { title });

      setTask(updated);
      onUpdate();
    }
    setEditingTitle(false);
  };

  const handleSaveProject = async () => {
    if (projectId !== task.project_id) {
      const updated = await updateTask(task.id, { project_id: projectId });

      setTask(updated);
      onUpdate();
    }
    setEditingProject(false);
  };

  const handleSaveDueDate = async () => {
    const timestamp = dueDate
      ? Math.floor(new Date(dueDate).getTime() / 1000)
      : undefined;

    if (timestamp !== task.due_date) {
      const updated = await updateTask(task.id, { due_date: timestamp });

      setTask(updated);
      onUpdate();
    }
    setEditingDue(false);
  };

  const handleSave = async (onClose?: () => void) => {
    await handleSaveTitle();
    await handleSaveProject();
    await handleSaveDueDate();
    onClose?.();
  };

  return (
    <Card shadow="none">
      <CardBody>
        {" "}
        <div className="flex md:flex-row flex-col md:items-center justify-between p-2 gap-4 group">
          <div className="flex flex-col gap-2 md:gap-1">
            {/* Title */}
            <div className="flex items-center gap-2 text-md md:mb-0">
              {/* <input
                checked={task.completed}
                type="checkbox"
                onChange={handleToggleComplete}
              /> */}
              <Checkbox
                classNames={{
                  wrapper: "after:bg-[var(--project-color)]",
                }}
                isSelected={task.completed}
                radius="full"
                style={
                  {
                    "--project-color": projects.find((p) => p.id === projectId)
                      ?.color,
                  } as React.CSSProperties
                }
                onChange={handleToggleComplete}
              >
                {editingTitle ? (
                  <input
                    autoFocus
                    className="p-1 rounded"
                    value={title}
                    onBlur={handleSaveTitle}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  />
                ) : (
                  <span
                    className={`cursor-pointer text-md ${task.completed ? "line-through" : ""}`}
                    onDoubleClick={() => setEditingTitle(true)}
                  >
                    {task.title}
                  </span>
                )}
              </Checkbox>
            </div>
            <div className="flex gap-4 text-sm text-neutral-500 items-center justify-between md:justify-start">
              {/* Project */}
              <div className="flex gap-1 items-center">
                <span>Project:</span>
                {editingProject ? (
                  <select
                    autoFocus
                    value={projectId}
                    onBlur={handleSaveProject}
                    onChange={(e) => setProjectId(Number(e.target.value))}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="cursor-pointer underline"
                    onDoubleClick={() => setEditingProject(true)}
                  >
                    {projects.find((p) => p.id === projectId)?.name || "None"}
                  </span>
                )}
              </div>
              {/* Due date - only for non-recurring tasks */}
              {!task.recurring_rule && (
                <div className="flex gap-1 items-center">
                  <span>Due:</span>
                  {editingDue ? (
                    <input
                      autoFocus
                      type="date"
                      value={dueDate}
                      onBlur={handleSaveDueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  ) : (
                    <span
                      className="cursor-pointer underline"
                      onDoubleClick={() => setEditingDue(true)}
                    >
                      {dueDate || "None"}
                    </span>
                  )}
                </div>
              )}

              {/* Time spent */}
              <span>
                <span className="hidden md:inline-block mr-1">
                  Time Spent:{" "}
                </span>
                {formatTime(timeSpent)}
              </span>

              {task.recurring_rule && (
                <div className="flex items-center gap-2">
                  <RepeatIcon color="currentColor" size={16} />
                  <p className="capitalize md:normal-case">
                    <span className="hidden md:inline">Repeats </span>
                    {formatRecurring(
                      task.recurring_rule.pattern,
                      task.recurring_rule.interval,
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timer & Delete */}
          <div className="flex gap-2">
            <ButtonGroup className="w-full *:w-full md:opacity-0 md:group-hover:opacity-100">
              <Button
                isIconOnly
                color="default"
                size="md"
                variant="flat"
                onPress={handleToggleTimer}
              >
                {task.is_running ? (
                  <Pause size={20} />
                ) : (
                  <PlayButton size={22} />
                )}
              </Button>
              <Button
                isIconOnly
                color="default"
                variant="flat"
                onPress={onOpen}
              >
                <EditIcon color="currentColor" size={22} />
              </Button>
              <Button
                isIconOnly
                color="danger"
                variant="flat"
                onPress={handleDelete}
              >
                <TrashBin color="#ec003f" size={20} />
              </Button>
            </ButtonGroup>
          </div>
        </div>
        {/* Edit Modal */}
        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Edit Task</ModalHeader>
                <ModalBody>
                  <Input
                    autoFocus
                    label="Title"
                    value={title}
                    onValueChange={setTitle}
                    onKeyDown={(e) => e.key === "Enter" && handleSave(onClose)}
                  />
                  <Select
                    label="Project"
                    selectedKeys={projectId ? [String(projectId)] : []}
                    onSelectionChange={(keys) =>
                      setProjectId(Number(Array.from(keys)[0]))
                    }
                  >
                    {projects.map((p) => (
                      <SelectItem key={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </Select>
                  {!task.recurring_rule && (
                    <Input
                      label="Due Date"
                      type="date"
                      value={dueDate}
                      onValueChange={setDueDate}
                    />
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" onPress={() => handleSave(onClose)}>
                    Save
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
}
