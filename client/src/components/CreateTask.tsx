import { useState } from "react";
import { addToast } from "@heroui/toast";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { NumberInput } from "@heroui/react";
import { parseDate, CalendarDate } from "@internationalized/date";

import { createTask } from "../api/tasks";

const toCalendarDate = (str: string) => (str ? parseDate(str) : null);
const fromCalendarDate = (d: CalendarDate | null) => (d ? d.toString() : "");

export default function CreateTask({
  projects,
  activeProject,
  onCreated,
}: any) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(activeProject);
  const [dueDate, setDueDate] = useState<string>("");

  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [interval, setInterval] = useState<number>(1);
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<number[]>([]);

  const submit = async () => {
    if (!title.trim()) return;

    const timestamp = dueDate
      ? Math.floor(new Date(dueDate).getTime() / 1000)
      : undefined;

    let recurring_rule: any = null;

    if (recurrence) {
      recurring_rule = {
        title,
        project_id: projectId,
        pattern: recurrence,
        interval,
        days: days.join(","),
        start_date: timestamp || Math.floor(Date.now() / 1000),
        end_date: endDate
          ? Math.floor(new Date(endDate).getTime() / 1000)
          : undefined,
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
      addToast({
        title: "Success",
        description: `Task "${task.title}" created`,
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (err) {
      addToast({
        title: "Error",
        description: `Failed to create task because of following error: ${err}`,
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    }

    setTitle("");
    setDueDate("");
    setRecurrence(null);
    setInterval(1);
    setEndDate("");
    setDays([]);
  };

  return (
    <Form className="flex md:flex-row grow">
      <Input
        isClearable
        isRequired
        classNames={{ inputWrapper: "shadow-none" }}
        label="Task title"
        radius="md"
        size="sm"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select
        classNames={{ trigger: "shadow-none" }}
        placeholder="Project"
        radius="md"
        selectedKeys={[String(projectId)]}
        size="lg"
        onSelectionChange={(keys) => setProjectId(Number([...keys][0]))}
      >
        {projects.map((p: any) => (
          <SelectItem key={String(p.id)}>{p.name}</SelectItem>
        ))}
      </Select>
      <DatePicker
        classNames={{ inputWrapper: "shadow-none" }}
        label="Due Date"
        radius="md"
        size="sm"
        value={toCalendarDate(dueDate)}
        onChange={(d) => setDueDate(fromCalendarDate(d))}
      />
      <Select
        classNames={{ trigger: "shadow-none" }}
        label="Repeat"
        radius="md"
        selectedKeys={[recurrence ?? ""]}
        size="sm"
        onSelectionChange={(keys) =>
          setRecurrence(([...keys][0] as string) || null)
        }
      >
        <SelectItem key="">No repeat</SelectItem>
        <SelectItem key="daily">Daily</SelectItem>
        <SelectItem key="weekly">Weekly</SelectItem>
        <SelectItem key="monthly">Monthly</SelectItem>
      </Select>
      {recurrence && (
        <NumberInput
          classNames={{ inputWrapper: "shadow-none" }}
          label="Repeat every"
          minValue={1}
          radius="md"
          size="sm"
          value={interval}
          onValueChange={(v) => setInterval(v)}
        />
      )}
      <Button color="primary" radius="md" size="lg" onPress={submit}>
        Add Task
      </Button>
    </Form>
  );
}
