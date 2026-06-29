from enum import Enum

class SmartView(str, Enum):
  TODAY = "today"
  UPCOMING = "upcoming"
  OVERDUE = "overdue"