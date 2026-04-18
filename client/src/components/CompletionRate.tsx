import { Card, Label, ProgressBar } from "@heroui/react";

import { Task, Project } from "@/types";

interface CompletionRateProps {
  tasks: Task[];
  projects: Project[];
}

const formatTime = (seconds: number) => {
  const h = seconds / 3600;

  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
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
    { label: "Time Spent", value: formatTime(totalTimeSpent) },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-none">
            <Card.Content className="p-4">
              <p className="text-sm text-neutral-500">{s.label}</p>
              <p
                className={`text-3xl font-bold ${s.danger && s.value > 0 ? "text-danger" : ""}`}
              >
                {s.value}
              </p>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Overall completion rate */}
      <Card className="shadow-none">
        <Card.Content className="p-4 flex flex-col gap-2">
          <ProgressBar
            aria-label="Overall Completion Rate"
            color="default"
            size="md"
            value={completionRate}
          >
            <Label>Overall Completion Rate</Label>
            <ProgressBar.Output />
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </Card.Content>
      </Card>

      {/* Per project progress */}
      <Card className="shadow-none">
        <Card.Content className="p-4 flex flex-col gap-4">
          <p className="font-medium">Progress by Project</p>
          {projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.project_id === p.id);
            const total = projectTasks.length;
            const done = projectTasks.filter((t) => t.completed).length;

            return (
              <div key={p.id} className="flex flex-col gap-1">
                <ProgressBar
                  aria-label="Overall Completion Rate"
                  color="default"
                  formatOptions={{ style: "decimal" }}
                  maxValue={total}
                  size="sm"
                  style={{ "--total": `"/${total}"` } as React.CSSProperties}
                  value={done}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color ?? "#6366f1" }}
                    />
                    <Label>{p.name}</Label>
                  </div>
                  <ProgressBar.Output className={`after:content-(--total)`} />
                  <ProgressBar.Track
                    style={
                      {
                        "--project-color": p.color ?? "#6366f1",
                      } as React.CSSProperties
                    }
                  >
                    <ProgressBar.Fill className="bg-(--project-color)" />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            );
          })}
        </Card.Content>
      </Card>
    </div>
  );
}
