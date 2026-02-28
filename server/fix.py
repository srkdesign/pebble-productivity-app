# server/scripts/fix_recurring_tasks.py

from server.db.session import SessionLocal
from server.models.project import Project          # <--- import Project
from server.models.task import Task
from server.models.recurring_task import RecurringTask
from server.services.recurring_service import generate_recurring_tasks

def main():
    session = SessionLocal()
    try:
        # generate all missing recurring task instances
        generate_recurring_tasks(session)
        print("✅ Recurring tasks generation complete.")
    finally:
        session.close()

if __name__ == "__main__":
    main()