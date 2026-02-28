import time
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime, timedelta

from .recurring_task import RecurringTask

class Task(Base):
  __tablename__ = "tasks"

  id = Column(Integer, primary_key=True, autoincrement=True)
  title = Column(String, nullable=False)

  completed = Column(Boolean, default=False, nullable=False)
  completed_at = Column(Integer, nullable=True)  # timestamp in seconds

  updated_at = Column(Integer, nullable=False)
  version = Column(Integer, default=1, nullable=False)

  deleted = Column(Boolean, default=False, nullable=False)

  time_spent = Column(Integer, default=0, nullable=False)
  is_running = Column(Boolean, default=False, nullable=False)
  last_start = Column(Integer)

  due_date = Column(BigInteger, nullable=True)

  project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
  project = relationship("Project", back_populates="tasks")

  parent_id = Column(Integer, ForeignKey("tasks.id"))
  children = relationship("Task")

  recurring_rule_id = Column(Integer, ForeignKey("recurring_tasks.id"), nullable=True)

  recurring_rule = relationship(
      "RecurringTask",
      back_populates="tasks",
      foreign_keys=[recurring_rule_id]
  )