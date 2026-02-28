import time
from sqlalchemy.orm import Session
from server.models.project import Project
from server.models.task import Task
from server.services.utils import get_default_project

def ensure_default_project(session):
    project = session.query(Project).filter_by(is_default=True).first()
    if not project:
        now = int(time.time())
        project = Project(
            name="Inbox",
            is_default=True,
            created_at=now,
            updated_at=now
        )
        session.add(project)
        session.commit()
    return project

def create_project(session: Session, name: str, color: str):
  now = int(time.time())

  project = Project(
    name=name,
    color=color,
    created_at=now,
    updated_at=now,
  )

  session.add(project)
  session.commit()
  return project

def archive_project(session: Session, project_id: int):
  project = session.get(Project, project_id)
  project.is_archived = True
  session.commit()

def delete_project(session: Session, project_id: int):
  project = session.get(Project, project_id)

  if project.is_default:
    raise ValueError("Cannot delete default project")
  
  inbox = get_default_project(session)

  session.query(Task).filter_by(project_id=project_id).update({"project_id": inbox.id})

  session.delete(project)
  session.commit()
