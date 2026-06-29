import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useMemo, useCallback } from "react";

import "../styles/calendar.css";
import { Modal, Button, useOverlayState } from "@heroui/react";
import { CalendarIcon, Folder } from "@icons";
import { formatDate } from "@utils/date";

import { Project, Task } from "@/types";
import { updateTask } from "@api/tasks";

interface TaskCalendarProps {
  tasks: Task[];
  projects: Project[];
  onTasksChange?: (tasks: Task[]) => void;
}

export default function TaskCalendar({
  tasks,
  projects,
  onTasksChange,
}: TaskCalendarProps) {
  const [clickedTask, setClickedTask] = useState<Task | null>(null);
  const taskState = useOverlayState();

  // -------------------------
  // EVENTS
  // -------------------------
  const events = useMemo(() => {
    return tasks
      .filter((t) => t.due_date)
      .map((t) => {
        const color =
          projects.find((p) => p.id === t.project_id)?.color ?? "#999";

        return {
          id: String(t.id),
          title: t.title,
          start: new Date(t.due_date! * 1000),
          allDay: true,
          backgroundColor: color,
          borderColor: color,
          textColor: "#fff",
          classNames: t.completed ? ["event-completed"] : [],
        };
      });
  }, [tasks, projects]);

  // -------------------------
  // CLICK
  // -------------------------
  const handleEventClick = useCallback(
    (info: any) => {
      const taskId = Number(info.event.id);
      const task = tasks.find((t) => t.id === taskId);

      setClickedTask(task ?? null);
      taskState.open();
    },
    [tasks],
  );

  // -------------------------
  // DRAG & DROP FIXED
  // -------------------------
  const handleEventDrop = async (info: any) => {
    const taskId = Number(info.event.id);

    if (!info.event.start) {
      info.revert();
      return;
    }

    try {
      // 1. Get local calendar date (year/month/day only)
      const d = info.event.start;

      const year = d.getFullYear();
      const month = d.getMonth(); // 0-based
      const day = d.getDate();

      // 2. Convert to UTC midnight explicitly (prevents timezone shift)
      const utcMidnight = Date.UTC(year, month, day) / 1000;

      // 3. Optimistic update (optional but recommended)
      await updateTask(taskId, {
        due_date: utcMidnight,
      });

      // 4. Update parent state if needed
      if (onTasksChange) {
        onTasksChange(
          tasks.map((t) =>
            t.id === taskId ? { ...t, due_date: utcMidnight } : t,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update due_date:", err);
      info.revert();
    }
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="p-0 rounded h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        views={{
          dayGridMonth: { buttonText: "Month" },
          timeGridWeek: {
            buttonText: "Week",
            editable: true,
            eventStartEditable: true,
            eventDurationEditable: true,
            dayHeaderFormat: {
              weekday: "short",
              day: "numeric",
              omitCommas: true,
            },
            allDayText: "All Day",
            eventTimeFormat: {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            },
            slotLabelFormat: {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            },
          },
        }}
        events={events}
        editable={true}
        eventStartEditable={true}
        eventDurationEditable={false}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="100%"
        firstDay={1}
        fixedWeekCount={false}
      />

      {/* ---------------- MODAL ---------------- */}
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
                    <Folder size={16} />
                    {projects.find((p) => p.id === clickedTask?.project_id)
                      ?.name || "None"}
                  </Button>

                  <Button variant="tertiary">
                    <CalendarIcon size={18} />
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
