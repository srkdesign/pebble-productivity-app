import time
from sqlalchemy.orm import Session
from server.models.task import Task
from server.services.utils import get_default_project

# server/services/task_service.py
from server.models.task import Task
import time

def create_task(session, title, project_id, due_date=None):
    task = Task(
        title=title,
        project_id=project_id,
        due_date=due_date,
        updated_at=int(time.time())
    )
    session.add(task)
    session.commit()
    return task

def start_timer(session: Session, task_id: int):
  task = session.get(Task, task_id)
  task.is_running = True
  task.last_start = int(time.time())
  session.commit()

def stop_timer(session: Session, task_id: int):
  task = session.get(Task, task_id)

  if task.is_running:
    now = int(time.time())
    task.time_spent = (task.time_spent or 0) + (now - task.last_start)
    task.is_running = False
    task.last_start = None
    session.commit()

from datetime import datetime, timedelta

def expand_task(task: Task):
    """Return all occurrences of a recurring task up to 1 year or recurrence_end."""
    if not task.recurrence_type or not task.due_date:
        return [task]

    occurrences = []
    current = datetime.fromtimestamp(task.due_date)
    end = datetime.fromtimestamp(task.recurrence_end) if task.recurrence_end else current + timedelta(days=365)

    while current <= end:
        occurrences.append({**task.__dict__, "due_date": int(current.timestamp())})

        if task.recurrence_type == "daily":
            current += timedelta(days=1)
        elif task.recurrence_type == "weekly":
            current += timedelta(weeks=1)
        elif task.recurrence_type == "monthly":
            month = current.month + 1
            year = current.year + (month - 1) // 12
            month = (month - 1) % 12 + 1
            current = current.replace(year=year, month=month)
    return occurrences