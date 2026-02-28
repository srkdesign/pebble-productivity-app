from datetime import datetime, timedelta
from calendar import monthrange
import time
from server.models.task import Task
from server.models.recurring_task import RecurringTask
from sqlalchemy.orm import Session


def _midnight(ts: int) -> datetime:
    return datetime.fromtimestamp(ts).replace(hour=0, minute=0, second=0, microsecond=0)


def _next_date(current: datetime, rule: RecurringTask, anchor_day: int) -> datetime:
    if rule.pattern == "daily":
        return current + timedelta(days=rule.interval)

    if rule.pattern == "weekly":
        if not rule.days:
            return current + timedelta(weeks=rule.interval)
        weekdays = sorted(int(d) for d in rule.days.split(","))
        for wd in weekdays:
            if wd > current.weekday():
                return current + timedelta(days=wd - current.weekday())
        # wrap to next interval-week's first target weekday
        next_monday = current + timedelta(days=7 - current.weekday() + (rule.interval - 1) * 7)
        return next_monday + timedelta(days=weekdays[0])

    if rule.pattern == "monthly":
        month = current.month - 1 + rule.interval
        year  = current.year + month // 12
        month = month % 12 + 1
        day   = min(anchor_day, monthrange(year, month)[1])
        return current.replace(year=year, month=month, day=day)

    raise ValueError(f"Unknown pattern: {rule.pattern!r}")


def _task_exists(session: Session, rule: RecurringTask, ts: int) -> bool:
    return session.query(Task).filter(
        Task.recurring_rule_id == rule.id,
        Task.due_date == ts,
    ).first() is not None


def create_recurring_rule(session: Session, data: dict) -> RecurringTask:
    """
    Creates a new recurring rule and generates the first task.
    Expects data to contain:
    - title (str)
    - project_id (int)
    - pattern (str): 'daily', 'weekly', 'monthly'
    - interval (int)
    - days (optional str): comma-separated weekdays (0=Mon, 6=Sun) for weekly patterns
    - start_date (int): UNIX timestamp
    - end_date (optional int): UNIX timestamp
    """
    start_ts = int(_midnight(data["start_date"]).timestamp())

    rule = RecurringTask(
        title=data["title"],
        project_id=data["project_id"],
        pattern=data["pattern"],
        interval=data.get("interval", 1),
        days=data.get("days"),
        start_date=start_ts,
        end_date=data.get("end_date"),
        last_generated=start_ts,
    )
    session.add(rule)
    session.flush()  # get rule.id

    if not _task_exists(session, rule, start_ts):
        session.add(Task(
            title=rule.title,
            project_id=rule.project_id,
            due_date=start_ts,
            recurring_rule_id=rule.id,
            updated_at=int(time.time()),
        ))

    session.commit()
    return rule


def generate_recurring_tasks(session, lookahead_days: int = 90):
    """
    Generate recurring tasks:
    - From start_date → end_date if end_date is set, otherwise up to lookahead_days from now
    - Enforces one task per day maximum
    - Handles daily, weekly, and monthly patterns
    - Skips duplicates
    """
    now   = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    rules = session.query(RecurringTask).all()

    for rule in rules:
        anchor_day = _midnight(rule.start_date).day
        end        = _midnight(rule.end_date) if rule.end_date else now + timedelta(days=lookahead_days)

        # Resume from the next occurrence after last_generated, not just +1 day
        if rule.last_generated:
            current = _next_date(_midnight(rule.last_generated), rule, anchor_day)
        else:
            current = _midnight(rule.start_date)

        while current <= end:
            ts = int(current.timestamp())

            if not _task_exists(session, rule, ts):
                session.add(Task(
                    title=rule.title,
                    project_id=rule.project_id,
                    due_date=ts,
                    recurring_rule_id=rule.id,
                    updated_at=int(time.time()),
                ))

            rule.last_generated = ts
            current = _next_date(current, rule, anchor_day)

    session.commit()