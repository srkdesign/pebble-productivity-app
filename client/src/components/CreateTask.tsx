import { useEffect, useRef, useState } from "react";
import { createTask } from "@api/tasks";
import { parseDate, CalendarDate } from "@internationalized/date";
import {
  Form,
  TextField,
  Select,
  ListBox,
  DatePicker,
  DateField,
  Calendar,
  NumberField,
  Button,
  TextArea,
  toast,
} from "@heroui/react";
import { Plus } from "@icons";

import { useUiStore } from "@/stores/uiStore";

const toCalendarDate = (str: string) => (str ? parseDate(str) : null);
const fromCalendarDate = (d: CalendarDate | null) => (d ? d.toString() : "");

export default function CreateTask({
  projects,
  activeProject,
  onCreated,
}: any) {
  const [formKey, setFormKey] = useState(0);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(activeProject);
  const [dueDate, setDueDate] = useState<string>("");
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [interval, setInterval] = useState<number>(1);
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<number[]>([]);

  useEffect(() => {
    setProjectId(activeProject);
  }, [activeProject]);

  const ref = useRef<HTMLDivElement>(null);
  const setTargetRef = useUiStore((s) => s.setTargetRef);

  useEffect(() => {
    setTargetRef(ref);
  }, []);

  const resetFields = () => {
    setTitle("");
    setProjectId(activeProject);
    setDueDate("");
    setRecurrence(null);
    setInterval(1);
    setEndDate("");
    setDays([]);
    setFormKey((k) => k + 1);
  };

  const submit = async () => {
    if (!title.trim()) return;

    const todayTimestamp = Math.floor(Date.now() / 1000);

    // Use picked date if set.
    // If recurring with no date picked, default start to today.
    // Plain task with no date → no timestamp.
    const timestamp: number | undefined = dueDate
      ? Math.floor(new Date(dueDate + "T00:00:00").getTime() / 1000)
      : recurrence
        ? todayTimestamp
        : undefined;

    let recurring_rule: any = null;

    if (recurrence) {
      recurring_rule = {
        title,
        project_id: projectId,
        pattern: recurrence,
        interval,
        ...(days.length > 0 && { days: days.join(",") }),
        start_date: timestamp ?? todayTimestamp,
        ...(endDate && {
          end_date: Math.floor(new Date(endDate).getTime() / 1000),
        }),
      };
    }

    try {
      const task = await createTask(
        title,
        projectId,
        timestamp,
        recurring_rule,
      );

      onCreated(task);
      toast.success(`Task "${task.title}" created`, { timeout: 3000 });
      resetFields();
    } catch (err) {
      toast(`Failed to create task: ${err}`, {
        variant: "danger",
        timeout: 3000,
      });
    }
  };

  return (
    <Form
      key={formKey}
      className="w-full flex flex-col md:flex-row items-center justify-between gap-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div ref={ref} className="w-full flex flex-col gap-3">
        <TextField
          aria-label="Task Title"
          className="[&_textarea]:text-base [&_textarea]:shadow-none"
          value={title}
          onChange={(v) => setTitle(v)}
        >
          <TextArea
            placeholder="Enter a Task Title..."
            style={{ resize: "none" }}
          />
        </TextField>

        <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
          <div className="w-full md:w-auto flex flex-col md:flex-row *:w-full md:*:w-auto flex-wrap gap-2 items-center">
            {/* PROJECT SELECTOR */}
            <Select
              className="[&_button]:h-11 [&_button]:items-center"
              placeholder="Project"
              value={String(projectId)}
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

            {/* DATE PICKER */}
            <DatePicker
              aria-label="Due Date"
              className="[&_div]:h-11"
              value={toCalendarDate(dueDate)}
              onChange={(d) => setDueDate(fromCalendarDate(d))}
            >
              <DateField.Group variant="secondary">
                <DateField.Input>
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger>
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              <DatePicker.Popover
                style={{ "--trigger-width": "320px" } as React.CSSProperties}
              >
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
                        <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
              </DatePicker.Popover>
            </DatePicker>

            {/* REPEAT */}
            <Select
              aria-label="Repeat"
              className="[&_button]:h-11 [&_button]:items-center"
              value={recurrence ?? ""}
              variant="secondary"
              onChange={(v) => setRecurrence((v as string) || null)}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item
                    aria-label="No repeat"
                    id=""
                    textValue="No repeat"
                  >
                    No repeat
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item aria-label="Daily" id="daily" textValue="Daily">
                    Daily
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item
                    aria-label="Weekly"
                    id="weekly"
                    textValue="Weekly"
                  >
                    Weekly
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item
                    aria-label="Monthly"
                    id="monthly"
                    textValue="Monthly"
                  >
                    Monthly
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            {/* INTERVAL — only visible when a recurrence is selected */}
            {recurrence && (
              <NumberField
                aria-label="Repeat every"
                className="[&_div]:h-11 md:w-36!"
                minValue={1}
                value={interval}
                variant="secondary"
                onChange={(v: number) => setInterval(v)}
              >
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input
                    aria-label="Repeat every"
                    className="text-center"
                  />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
            )}
          </div>

          <Button
            isIconOnly
            className="[&_svg]:size-6 shrink-0 w-full md:w-max min-h-11 aspect-square"
            type="submit"
            variant="primary"
          >
            <Plus color="currentColor" size={32} />
            <p className="block md:hidden font-normal">Add Task</p>
          </Button>
        </div>
      </div>
    </Form>
  );
}
