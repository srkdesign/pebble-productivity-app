import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import "../styles/calendar.css";

interface Task {
  id: number;
  title: string;
  due_date?: number; // Unix timestamp in seconds
  project_id?: number;
}

interface TaskCalendarProps {
  tasks: Task[];
}

export default function TaskCalendar({ tasks }: TaskCalendarProps) {
  // Convert tasks to calendar events
  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => ({
      id: t.id.toString(),
      title: t.title,
      start: new Date(t.due_date! * 1000),
      allDay: true,
      extendedProps: { projectId: t.project_id },
    }));

  const handleEventClick = (clickInfo: any) => {
    const task = clickInfo.event.extendedProps;
    alert(`Task: ${clickInfo.event.title}\nProject ID: ${task.projectId}`);
  };

  return (
    <div className="p-4 rounded h-full">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events} // all tasks, including recurring occurrences
        eventClick={handleEventClick}
        height="100%"
      />
    </div>
  );
}
