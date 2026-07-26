import time
from sqlalchemy.orm import Session
from server.models.task import Task
from server.services.utils import get_default_project
from server.models.view import SmartView
from datetime import datetime

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

def get_smart_view_tasks(session: Session, view: SmartView):
    now = datetime.now()
    today_start = int(datetime(now.year, now.month, now.day).timestamp())
    today_end = today_start + 86399
    upcoming_end = today_start + (3 * 86400) + 86399

    base = session.query(Task).filter(Task.completed == False)

    if view == SmartView.TODAY:
        return (
            base.filter(Task.due_date >= today_start, Task.due_date <= today_end).order_by(Task.due_date.asc()).all()
        )
    elif view == SmartView.UPCOMING:
        return (
            base.filter(Task.due_date >= today_start, Task.due_date <= upcoming_end).order_by(Task.due_date.asc())

        )
    elif view == SmartView.OVERDUE:
        return (
            base.filter(Task.due_date < today_start).order_by(Task.due_date.asc())
        )
    return []