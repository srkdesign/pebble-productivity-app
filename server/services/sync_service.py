import time
from server.models.task import Task
from server.models.project import Project


def apply_task_changes(session, tasks):
    for t in tasks:
        db_task = session.get(Task, t["id"])

        # new task
        if not db_task:
            session.add(Task(**t))
            continue

        # conflict resolution
        if t["version"] > db_task.version:
            for k, v in t.items():
                setattr(db_task, k, v)


def apply_project_changes(session, projects):
    for p in projects:
        db_proj = session.get(Project, p["id"])

        if not db_proj:
            session.add(Project(**p))
            continue

        if p["version"] > db_proj.version:
            for k, v in p.items():
                setattr(db_proj, k, v)


def get_changes_since(session, last_sync):
    tasks = session.query(Task).filter(Task.updated_at > last_sync).all()
    projects = session.query(Project).filter(Project.updated_at > last_sync).all()

    return tasks, projects