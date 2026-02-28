from server.db.session import engine, SessionLocal
from server.models.base import Base
from server.services.project_service import ensure_default_project

def start():
  Base.metadata.create_all(engine)
  session = SessionLocal()
  ensure_default_project(session)
  session.close()

if __name__ == "__main__":
  start()