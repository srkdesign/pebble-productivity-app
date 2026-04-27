/* eslint-disable jsx-a11y/no-autofocus */
import { useState, useEffect, useRef } from "react";
import {
  toggleComplete,
  deleteTask,
  startTimer,
  stopTimer,
  updateTask,
} from "@api/tasks";
import { parseDate, CalendarDate } from "@internationalized/date";
import formatRecurring from "@utils/recurring";
import {
  Calendar,
  Card,
  DateField,
  DatePicker,
  Button,
  ButtonGroup,
  Checkbox,
  Modal,
  Select,
  ListBox,
  TextField,
  Input,
  useOverlayState,
} from "@heroui/react";
import {
  TrashBin,
  PlayButton,
  Pause,
  RepeatIcon,
  EditIcon,
  Folder,
  CalendarIcon,
  TimerIcon,
} from "@icons";

import { Task, Project } from "@/types";
import { useSoundStore } from "@/stores/soundStore";
import { formatDate } from "@/utils/date";

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
  const [isActive, setIsActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const editState = useOverlayState();
  const deleteState = useOverlayState();
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

  const { play } = useSoundStore();

  // Dismiss active state when clicking outside the card
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isActive]);

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

  const toCalendarDate = (str: string) => (str ? parseDate(str) : null);
  const fromCalendarDate = (d: CalendarDate | null) => (d ? d.toString() : "");

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

  const handleToggleComplete = async () => {
    play("/sounds/completed.mp3");
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
    deleteTask(task.id);
    onUpdate();
    deleteState.close();
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

  const handleSave = async (close?: () => void) => {
    await handleSaveTitle();
    await handleSaveProject();
    await handleSaveDueDate();
    close?.();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if the user clicked a button, input, or interactive element
    const target = e.target as HTMLElement;
    const isInteractive = target.closest("button, input, select, a, label");

    if (!isInteractive) {
      setIsActive((v) => !v);
    }
  };

  return (
    <div ref={cardRef}>
      <Card className="shadow-none rounded-3xl" onClick={handleCardClick}>
        <Card.Content>
          <div className="flex md:items-center justify-between p-1 gap-4 group">
            <div className="w-full flex flex-col gap-2 md:gap-1">
              {/* Title row with Checkbox */}
              <div className="flex items-center gap-2 text-md md:mb-0">
                <Checkbox
                  isSelected={task.completed}
                  style={
                    {
                      "--accent": projects.find((p) => p.id === projectId)
                        ?.color,
                    } as React.CSSProperties
                  }
                  onChange={handleToggleComplete}
                >
                  <Checkbox.Control className="size-5 rounded-full shadow-none  dark:bg-zinc-800 bg-zinc-100">
                    <Checkbox.Indicator />
                  </Checkbox.Control>

                  <Checkbox.Content>
                    {editingTitle ? (
                      <input
                        autoFocus
                        className="p-1 rounded"
                        value={title}
                        onBlur={handleSaveTitle}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveTitle()
                        }
                      />
                    ) : (
                      <span
                        className={`cursor-pointer text-md ${task.completed ? "line-through " : ""}`}
                        onDoubleClick={() => setEditingTitle(true)}
                      >
                        {task.title}
                      </span>
                    )}
                  </Checkbox.Content>
                </Checkbox>
              </div>

              {/* Metadata row */}
              <div className="ml-7 w-auto flex gap-4 text-sm text-neutral-500 items-center justify-start overflow-x-scroll md:overflow-x-hidden *:whitespace-nowrap">
                {/* Inline project editor */}
                <div className="flex gap-1.5 items-center">
                  <Folder color="currentColor" size={16} />
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

                {/* Inline due date editor */}
                {!task.recurring_rule && task.due_date !== null && (
                  <div className="flex gap-1.5 items-center">
                    <CalendarIcon color="currentColor" size={18} />
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
                        {formatDate(dueDate) || "None"}
                      </span>
                    )}
                  </div>
                )}

                {/* Time spent */}
                <span className="flex gap-1 items-center">
                  <TimerIcon color="currentColor" size={19} />
                  {formatTime(timeSpent)}
                </span>

                {/* Recurring label */}
                {task.recurring_rule && (
                  <div className="flex items-center gap-1.5">
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

            {/* Action buttons — hover on desktop, tap-to-reveal on mobile */}
            <div
              className={`md:flex gap-2 absolute right-0 top-1/2 -translate-y-1/2 pr-4 ${isActive ? " bg-linear-to-r from-transparent via-white to-white dark:via-zinc-900 dark:to-zinc-900 p-36" : ""}`}
            >
              <ButtonGroup
                className={`[&_button]:rounded-full gap-2 transition-opacity
                  ${isActive ? "opacity-100" : "opacity-0"}
                  md:opacity-0 md:group-hover:opacity-100`}
              >
                <Button
                  isIconOnly
                  variant="secondary"
                  onPress={handleToggleTimer}
                >
                  {task.is_running ? (
                    <Pause size={20} />
                  ) : (
                    <PlayButton size={22} />
                  )}
                </Button>
                <Button isIconOnly variant="secondary" onPress={editState.open}>
                  <EditIcon color="currentColor" size={22} />
                </Button>
                <Button
                  isIconOnly
                  variant="danger-soft"
                  onPress={deleteState.open}
                >
                  <TrashBin color="#ec003f" size={20} />
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Edit Modal — v3 compound pattern */}
          <Modal state={editState}>
            <Modal.Backdrop>
              <Modal.Container placement="center">
                <Modal.Dialog>
                  {({ close }) => (
                    <>
                      <Modal.Header className="pr-8">
                        <Modal.Heading>Edit Task</Modal.Heading>
                        <Modal.CloseTrigger />
                      </Modal.Header>
                      <Modal.Body className="flex flex-col gap-2 overflow-visible pt-4">
                        <TextField
                          autoFocus
                          aria-label="Project name"
                          className="gap-2 [&_input]:h-11"
                          value={title}
                          variant="secondary"
                          onChange={setTitle}
                        >
                          <Input placeholder="Project name" />
                        </TextField>

                        <Select
                          className="[&_button]:h-11 [&_button]:items-center"
                          placeholder="Project"
                          value={projectId ? String(projectId) : ""}
                          variant="secondary"
                          onChange={(v) => setProjectId(Number(v))}
                        >
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {projects.map((p: any) => (
                                <ListBox.Item
                                  key={String(p.id)}
                                  id={String(p.id)}
                                  textValue={p.name}
                                >
                                  {p.name}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>

                        {!task.recurring_rule && (
                          <DatePicker
                            aria-label="Due Date"
                            className="[&_div]:h-11"
                            value={toCalendarDate(dueDate)}
                            onChange={(d) => setDueDate(fromCalendarDate(d))}
                          >
                            <DateField.Group variant="secondary">
                              <DateField.Input>
                                {(segment) => (
                                  <DateField.Segment segment={segment} />
                                )}
                              </DateField.Input>
                              <DateField.Suffix>
                                <DatePicker.Trigger>
                                  <DatePicker.TriggerIndicator />
                                </DatePicker.Trigger>
                              </DateField.Suffix>
                            </DateField.Group>
                            <DatePicker.Popover>
                              <Calendar aria-label="Choose due date">
                                <Calendar.Header>
                                  <Calendar.NavButton slot="previous" />
                                  <Calendar.YearPickerTrigger>
                                    <Calendar.YearPickerTriggerHeading />
                                  </Calendar.YearPickerTrigger>
                                  <Calendar.NavButton slot="next" />
                                </Calendar.Header>
                                <Calendar.Grid>
                                  <Calendar.GridHeader>
                                    {(day) => (
                                      <Calendar.HeaderCell>
                                        {day}
                                      </Calendar.HeaderCell>
                                    )}
                                  </Calendar.GridHeader>
                                  <Calendar.GridBody>
                                    {(date) => <Calendar.Cell date={date} />}
                                  </Calendar.GridBody>
                                </Calendar.Grid>
                              </Calendar>
                            </DatePicker.Popover>
                          </DatePicker>
                        )}
                      </Modal.Body>
                      <Modal.Footer className="flex *:w-full md:*:w-auto">
                        <Button variant="secondary" onPress={close}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onPress={() => handleSave(close)}
                        >
                          Save
                        </Button>
                      </Modal.Footer>
                    </>
                  )}
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          {/* Delete Modal — v3 compound pattern */}
          <Modal state={deleteState}>
            <Modal.Backdrop>
              <Modal.Container placement="center">
                <Modal.Dialog>
                  {({ close }) => (
                    <>
                      <Modal.Header>
                        <Modal.Heading className="pr-8">
                          Are you sure you want to delete &quot;{title}&quot;?
                        </Modal.Heading>
                        <Modal.CloseTrigger />
                      </Modal.Header>
                      <Modal.Footer className="flex *:w-full md:*:w-auto">
                        <Button variant="secondary" onPress={close}>
                          Cancel
                        </Button>
                        <Button variant="danger" onPress={() => handleDelete()}>
                          Delete
                        </Button>
                      </Modal.Footer>
                    </>
                  )}
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </Card.Content>
      </Card>
    </div>
  );
}
