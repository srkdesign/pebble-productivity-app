from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class RecurringTask(Base):
    __tablename__ = "recurring_tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    pattern = Column(String, nullable=False)  
    interval = Column(Integer, nullable=True)
    days = Column(String, nullable=True)
    start_date = Column(BigInteger, nullable=False)
    end_date = Column(BigInteger, nullable=True)
    
    last_generated = Column(BigInteger, nullable=True)  # timestamp in seconds

    tasks = relationship("Task", back_populates="recurring_rule")