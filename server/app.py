from dotenv import load_dotenv
import os

from flask import Flask, jsonify, request
from server.db.session import SessionLocal, engine
from server.models.base import Base
from server.services.project_service import ensure_default_project, create_project
from server.services.task_service import create_task
from server.services.sync_service import *
from server.services.serializers import serialize_project, serialize_task
from flask_cors import CORS
from server.services.task_service import start_timer, stop_timer
from server.services.recurring_service import create_recurring_rule, generate_recurring_tasks
from server.models.recurring_task import RecurringTask

load_dotenv()

app = Flask(__name__)
CORS(app)

# create tables + default project
Base.metadata.create_all(engine)
session = SessionLocal()
ensure_default_project(session)
session.close()

@app.route("/")
def home():
    return {"status": "API running"}

@app.route("/projects", methods=["GET"])
def get_projects():
    session = SessionLocal()
    projects = session.query(Project).all()
    serialized = [serialize_project(p) for p in projects]
    session.close()
    return jsonify(serialized)

@app.route("/projects", methods=["POST"])
def create_project_route():
    session = SessionLocal()

    name = request.json["name"]
    color = request.json.get("color", "#6366f1")
    project = create_project(session, name, color)

    data = serialize_project(project)
    session.close()

    return jsonify(data)

@app.route("/projects/<int:project_id>", methods=["PATCH"])
def update_project_route(project_id):
    session = SessionLocal()
    project = session.query(Project).filter(Project.id == project_id).first()
    if not project:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    if "name" in data:
        project.name = data["name"]
    if "color" in data:
        project.color = data["color"]
    project.updated_at = int(time.time())
    session.commit()
    session.refresh(project)
    result = serialize_project(project)
    session.close()
    return jsonify(result)

@app.route("/tasks", methods=["GET"])
def get_tasks():
    session = SessionLocal()
    try:
        # Only generate recurring tasks if rules exist
        rules_exist = session.query(RecurringTask).first() is not None
        if rules_exist:
            generate_recurring_tasks(session, lookahead_days=90)

        tasks = session.query(Task).all()
        serialized = [serialize_task(t) for t in tasks]  # includes recurring_rule
        return jsonify(serialized)
    finally:
        session.close()

@app.route("/tasks", methods=["POST"])
def new_task():
    session = SessionLocal()
    data = request.json
    due_date = data.get("due_date")

    # Create normal task
    task = create_task(
        session,
        title=data["title"],
        project_id=data.get("project_id"),
        due_date=due_date
    )

    # If recurring rule info is present, create the rule
    if "recurring_rule" in data:
        rule_data = data["recurring_rule"]
        rule_data["project_id"] = data.get("project_id")
        rule_data["title"] = data["title"]
        # make sure start_date exists
        if not rule_data.get("start_date"):
            rule_data["start_date"] = due_date or int(time.time())

        rule = create_recurring_rule(session, rule_data)
        task.recurring_rule_id = rule.id
        session.commit()

    task_data = serialize_task(task)
    session.close()
    return jsonify(task_data)

@app.route("/tasks/<int:task_id>/complete", methods=["PUT"])
def complete_task(task_id):
    session = SessionLocal()
    task = session.get(Task, task_id)
    task.completed = not task.completed
    task.updated_at = int(time.time())

    if task.completed:
        task.completed_at = int(time.time())
    else:
        task.completed_at = None

    session.commit()
    data = serialize_task(task)
    session.close()
    return jsonify(data)

@app.route("/tasks/<int:task_id>/delete", methods=["DELETE"])
def delete_task(task_id):
    session = SessionLocal()
    task = session.get(Task, task_id)
    if not task:
        session.close()
        return jsonify({"error": "Task not found"}), 404
    session.delete(task)
    session.commit()
    session.close()
    return jsonify({"status": "deleted"})

@app.route("/tasks/<int:task_id>/start", methods=["POST"])
def start_task_timer(task_id):
    session = SessionLocal()
    start_timer(session, task_id)
    task = session.get(Task, task_id)
    data = serialize_task(task)
    session.close()
    return jsonify(data)

@app.route("/tasks/<int:task_id>/stop", methods=["POST"])
def stop_task_timer(task_id):
    session = SessionLocal()
    stop_timer(session, task_id)
    task = session.get(Task, task_id)
    data = serialize_task(task)
    session.close()
    return jsonify(data)

@app.route("/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    session = SessionLocal()
    task = session.get(Task, task_id)
    if not task:
        session.close()
        return jsonify({"error": "Task not found"}), 404

    data = request.json
    if "title" in data:
        task.title = data["title"]
    if "project_id" in data:
        task.project_id = data["project_id"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    task.updated_at = int(time.time())
    session.commit()
    result = serialize_task(task)
    session.close()
    return jsonify(result)

# @app.route("/recurring-tasks", methods=["POST"])
# def new_recurring_task():
#     session = SessionLocal()
#     data = request.json
#     rule = create_recurring_rule(session, data)
#     session.close()
#     return jsonify({
#         "id": rule.id,
#         "title": rule.title,
#         "project_id": rule.project_id,
#         "pattern": rule.pattern,
#         "interval": rule.interval,
#         "days": rule.days,
#         "start_date": rule.start_date,
#         "end_date": rule.end_date
#     })

@app.route("/tasks/delete_all", methods=["DELETE"])
def delete_all_tasks():
    session = SessionLocal()
    try:
        # Delete all tasks
        session.query(Task).delete()

        # Delete all recurring rules
        session.query(RecurringTask).delete()

        session.commit()
        return jsonify({"status": "all tasks and recurring rules deleted"})
    finally:
        session.close()

if __name__ == "__main__":
    app.run(host=os.getenv("HOST"), port=os.getenv("PORT"), debug=True)