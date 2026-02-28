import time
from sqlalchemy import Column, String, Integer, BigInteger, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class Project(Base):
  __tablename__ = "projects"

  id = Column(Integer, primary_key=True, autoincrement=True)
  name = Column(String, nullable=False, unique=True)

  is_archived = Column(Boolean, default=False, nullable=False)
  is_default = Column(Boolean, default=False, nullable=False)

  color = Column(String)
  icon = Column(String)

  created_at = Column(Integer, nullable=False)
  updated_at = Column(Integer, nullable=False)

  tasks = relationship("Task", back_populates="project")