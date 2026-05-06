import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/calendar.css";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { CalendarIcon, Folder } from "@icons";
import { formatDate } from "@utils/date";

import { Project } from "@/types";

interface Task {
  id: number;
  title: string;
  due_date?: number; // Unix timestamp in seconds
  project_id?: number;
  completed: boolean;
}

interface TaskCalendarProps {
  tasks: Task[];
  projects: Project[];
}

export default function TaskCalendar({ tasks, projects }: TaskCalendarProps) {
  // Convert tasks to calendar events
  const [clickedTask, setClickedTask] = useState<Task | null>(null);
  const taskState = useOverlayState();

  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => {
      const color =
        projects.find((p) => p.id === t.project_id)?.color ?? "#999";

      return {
        id: t.id.toString(),
        title: t.title,
        project_id: t.project_id,
        start: new Date(t.due_date! * 1000),
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: "#fff",
        extendedProps: { projectId: t.project_id },
        classNames: t.completed ? ["event-completed"] : [],
      };
    });

  const handleEventClick = (clickInfo: any) => {
    const taskId = Number(clickInfo.event.id);
    const task = tasks.find((t) => t.id === taskId);

    setClickedTask(task ?? null);
    taskState.open();
    // alert(`Task: ${clickInfo.event.title}\nProject ID: ${task.projectId}`);
  };

  return (
    <div className="p-0 rounded h-full">
      <FullCalendar
        eventClick={handleEventClick}
        events={events} // all tasks, including recurring occurrences
        firstDay={1}
        fixedWeekCount={false}
        height="100%"
        initialView="dayGridMonth"
        plugins={[dayGridPlugin, interactionPlugin]}
      />
      <Modal state={taskState}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="pr-8">
                  {clickedTask?.title}
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Footer className="flex justify-between flex-wrap items-end">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="tertiary">
                    <Folder color="currentColor" size={16} />
                    {projects.find((p) => p.id === clickedTask?.project_id)
                      ?.name || "None"}
                  </Button>
                  <Button variant="tertiary">
                    <CalendarIcon color="currentColor" size={18} />
                    {formatDate(clickedTask?.due_date)}
                  </Button>
                </div>
                <Button variant="primary" onPress={() => taskState.close()}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
