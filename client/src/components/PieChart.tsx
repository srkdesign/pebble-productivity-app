import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Task, Project } from "@api/types";

interface ProjectPieChartProps {
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

export default function ProjectPieChart({
  tasks,
  projects,
}: ProjectPieChartProps) {
  const data = projects
    .map((p) => ({
      name: p.name,
      value: tasks
        .filter((t) => t.project_id === p.id)
        .reduce((sum, t) => sum + (t.time_spent ?? 0), 0),
      color: p.color ?? "#6366f1",
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        No time tracked yet
      </div>
    );
  }

  return (
    <ResponsiveContainer className="overflow-hidden" height="100%" width="100%">
      <PieChart>
        <Pie
          cx="50%"
          cy="50%"
          data={data}
          dataKey="value"
          innerRadius={70}
          nameKey="name"
          outerRadius={110}
          paddingAngle={3}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}
          formatter={(val: number) => formatTime(val)}
        />
        <Legend
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
