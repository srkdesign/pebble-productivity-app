import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Task, Project } from "@api/types";

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
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="project" />
        <PolarRadiusAxis />
        <Radar
          name="Completed Tasks"
          dataKey="completed"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
