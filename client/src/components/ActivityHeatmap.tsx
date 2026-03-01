import CalendarHeatmap from "react-calendar-heatmap";

import { Task } from "@/api/types";

import "react-calendar-heatmap/dist/styles.css";
import "../styles/heatmap.css";

interface HeatmapProps {
  tasks?: Task[];
}

export default function ActivityHeatmap({ tasks = [] }: HeatmapProps) {
  const today = new Date();
  const oneYearAgo = new Date();

  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const values = tasks
    .filter((t) => t.completed_at != null)
    .reduce((acc: any[], t) => {
      const date = new Date(t.completed_at! * 1000).toISOString().slice(0, 10);
      const existing = acc.find((v) => v.date === date);

      if (existing) existing.count += 1;
      else acc.push({ date, count: 1 });

      return acc;
    }, []);

  return (
    <div className="w-full overflow-x-auto">
      <CalendarHeatmap
        classForValue={(value) => {
          if (!value) return "color-empty";
          if (value.count >= 5) return "color-github-4";
          if (value.count >= 3) return "color-github-3";
          if (value.count >= 1) return "color-github-2";

          return "color-github-1";
        }}
        endDate={today}
        gutterSize={2}
        startDate={oneYearAgo}
        values={values}
      />
    </div>
  );
}
