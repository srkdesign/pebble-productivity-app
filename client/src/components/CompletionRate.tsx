import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/react";
import { Task, Project } from "@api/types";

interface CompletionRateProps {
  tasks: Task[];
  projects: Project[];
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  return `${h}h ${m}m`;
};

export default function CompletionRate({
  tasks,
  projects,
}: CompletionRateProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.due_date && t.due_date < Date.now() / 1000,
  ).length;
  const totalTimeSpent = tasks.reduce((sum, t) => sum + (t.time_spent ?? 0), 0);
  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const stats = [
    { label: "Total Tasks", value: totalTasks },
    { label: "Completed", value: completedTasks },
    { label: "Overdue", value: overdueTasks, danger: true },
    { label: "Time Tracked", value: formatTime(totalTimeSpent) },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} shadow="none">
            <CardBody className="p-4">
              <p className="text-sm text-neutral-500">{s.label}</p>
              <p
                className={`text-3xl font-bold ${s.danger && s.value > 0 ? "text-danger" : ""}`}
              >
                {s.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Overall completion rate */}
      <Card shadow="none">
        <CardBody className="p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Completion Rate</span>
            <span className="text-neutral-500">
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>
          <Progress
            value={completionRate}
            color={
              completionRate >= 75
                ? "success"
                : completionRate >= 40
                  ? "warning"
                  : "danger"
            }
            className="h-2"
          />
          <p className="text-2xl font-bold">{completionRate}%</p>
        </CardBody>
      </Card>

      {/* Per project progress */}
      <Card shadow="none">
        <CardBody className="p-4 flex flex-col gap-4">
          <p className="font-medium">Progress by Project</p>
          {projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.project_id === p.id);
            const total = projectTasks.length;
            const done = projectTasks.filter((t) => t.completed).length;
            const pct = total ? Math.round((done / total) * 100) : 0;

            return (
              <div key={p.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color ?? "#6366f1" }}
                    />
                    <span>{p.name}</span>
                  </div>
                  <span className="text-neutral-500">
                    {done}/{total}
                  </span>
                </div>
                <Progress
                  value={pct}
                  classNames={{
                    indicator: "bg-[var(--project-color)]",
                  }}
                  style={
                    {
                      "--project-color": p.color ?? "#6366f1",
                    } as React.CSSProperties
                  }
                />
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
