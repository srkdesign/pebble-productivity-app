from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from functools import wraps
from flask import g

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

def with_session(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    with SessionLocal() as session:
      g.session = session
      return f(*args, **kwargs)
  return decorated