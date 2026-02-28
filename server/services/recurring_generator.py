import time
from datetime import datetime, timedelta
from server.models.task import Task
from server.models.recurring_task import RecurringTask


def generate_tasks(session):
    now = int(time.time())

    rules = session.query(RecurringTask).all()

    for rule in rules:
        last = rule.last_generated or rule.start_date
        current = datetime.fromtimestamp(last)

        if rule.pattern == "daily":
            next_date = current + timedelta(days=1)

        elif rule.pattern == "weekly":
            next_date = current + timedelta(weeks=1)

        elif rule.pattern == "interval":
            next_date = current + timedelta(days=rule.interval or 1)

        else:
            continue

        next_ts = int(next_date.timestamp())

        if rule.end_date and next_ts > rule.end_date:
            continue

        exists = session.query(Task).filter(
            Task.source_recurring_id == rule.id,
            Task.due_date == next_ts
        ).first()

        if not exists and next_ts <= now:
            session.add(Task(
                title=rule.title,
                project_id=rule.project_id,
                due_date=next_ts,
                source_recurring_id=rule.id
            ))
            rule.last_generated = next_ts

    session.commit()