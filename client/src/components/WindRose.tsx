import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import { Task, Project } from "@/types";

interface WindRoseProps {
  tasks: Task[];
  projects: Project[];
}

export default function WindRose({ tasks, projects }: WindRoseProps) {
  // Count completed tasks per project
  const data = projects.map((p) => {
    const completedCount = tasks.filter(
      (t) => t.project_id === p.id && t.completed,
    ).length;

    return {
      project: p.name,
      completed: completedCount,
    };
  });

  return (
    <ResponsiveContainer height={400} width="100%">
      <RadarChart cx="50%" cy="50%" data={data} outerRadius="80%">
        <PolarGrid />
        <PolarAngleAxis dataKey="project" />
        <PolarRadiusAxis />
        <Radar
          dataKey="completed"
          fill="#8884d8"
          fillOpacity={0.6}
          name="Completed Tasks"
          stroke="#8884d8"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
