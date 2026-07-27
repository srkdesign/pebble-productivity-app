from datetime import datetime
import os
import sys
import time

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy.orm import joinedload

from server.db.session import SessionLocal, engine, with_session
from server.models.base import Base
from server.models.task import Task
from server.models.project import Project
from server.models.recurring_task import RecurringTask

from server.services.project_service import ensure_default_project, create_project
from server.services.task_service import create_task, start_timer, stop_timer, get_smart_view_tasks
from server.services.recurring_service import (
    create_recurring_rule,
    generate_recurring_tasks,
)
from server.services.serializers import serialize_task, serialize_project


# ----------------------------
# App setup
# ----------------------------

app = Flask(__name__, static_folder=None)
CORS(app)
app.url_map.strict_slashes = False


def get_base_dir():
    if getattr(sys, "frozen", False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


BASE_DIR = get_base_dir()
STATIC_DIR = os.path.join(BASE_DIR, "static")


# ----------------------------
# DB init
# ----------------------------

Base.metadata.create_all(engine)

with SessionLocal() as session:
    ensure_default_project(session)


# ----------------------------
# Global performance state
# ----------------------------

_last_generation = 0
RECURRENCE_INTERVAL = 300


# ----------------------------
# Static
# ----------------------------

@app.route("/sw.js")
def service_worker():
    return send_from_directory(STATIC_DIR, "sw.js")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    file_path = os.path.join(STATIC_DIR, path)

    if path and os.path.exists(file_path):
        return send_from_directory(STATIC_DIR, path)

    return send_from_directory(STATIC_DIR, "index.html")


# ----------------------------
# PROJECTS
# ----------------------------

@app.route("/api/projects", methods=["GET"])
@with_session
def get_projects():
    projects = session.query(Project).all()
    return jsonify([serialize_project(p) for p in projects])


@app.route("/api/projects", methods=["POST"])
@with_session
def create_project_route():
    data = request.get_json()

    existing = session.query(Project).filter_by(name=data["name"]).first()
    if existing:
        return jsonify(serialize_project(existing))

    project = create_project(
        session,
        data["name"],
        data.get("color", "#6366f1"),
    )

    return jsonify(serialize_project(project))

@app.route("/api/projects/<int:project_id>", methods=["PATCH"])
@with_session
def update_project_route(project_id):
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

    return jsonify(serialize_project(project))


@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
@with_session
def delete_project_route(project_id):
    project = session.query(Project).filter(Project.id == project_id).first()

    if not project:
        return jsonify({"error": "Not found"}), 404

    session.delete(project)
    session.commit()

    return jsonify({"success": True})

# ----------------------------
# TASKS (FAST CORE)
# ----------------------------

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    global _last_generation

    with SessionLocal() as session:

        now = time.time()

        # throttled recurring generation
        if now - _last_generation > RECURRENCE_INTERVAL:
            if session.query(RecurringTask.id).first():
                generate_recurring_tasks(session, lookahead_days=90)
            _last_generation = now

        page = request.args.get("page", 1, type=int)
        limit = min(request.args.get("limit", 50, type=int), 100)
        offset = (page - 1) * limit

        tasks = (
            session.query(Task)
            .options(joinedload(Task.recurring_rule))
            .order_by(Task.id.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        return jsonify({
            "page": page,
            "limit": limit,
            "data": [serialize_task(t) for t in tasks],
        })


@app.route("/api/tasks", methods=["POST"])
def new_task():
    with SessionLocal() as session:
        data = request.get_json()
        due_date = data.get("due_date")

        task = create_task(
            session,
            title=data["title"],
            project_id=data.get("project_id"),
            due_date=due_date,
        )

        if "recurring_rule" in data:
            rule = data["recurring_rule"].copy()
            rule["project_id"] = data.get("project_id")
            rule["title"] = data["title"]
            rule["start_date"] = rule.get("start_date") or due_date or int(time.time())

            created = create_recurring_rule(session, rule)
            task.recurring_rule_id = created.id
            session.commit()

        return jsonify(serialize_task(task))


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    with SessionLocal() as session:
        task = session.get(Task, task_id)

        if not task:
            return jsonify({"error": "not found"}), 404

        data = request.get_json() or {}
        now = int(time.time())

        for field in ["title", "project_id", "due_date", "is_running", "last_start", "time_spent"]:
            if field in data:
                setattr(task, field, data[field])

        if "completed" in data:
            task.completed = data["completed"]
            task.completed_at = now if data["completed"] else None

        task.updated_at = now
        session.commit()

        return jsonify(serialize_task(task))


@app.route("/api/tasks/<int:task_id>/complete", methods=["PUT"])
def complete_task(task_id):
    with SessionLocal() as session:
        task = session.get(Task, task_id)

        if not task:
            return jsonify({"error": "not found"}), 404

        now = int(time.time())

        task.completed = not task.completed
        task.completed_at = now if task.completed else None
        task.updated_at = now

        session.commit()

        return jsonify(serialize_task(task))


@app.route("/api/tasks/<int:task_id>/delete", methods=["DELETE"])
def delete_task(task_id):
    with SessionLocal() as session:
        task = session.get(Task, task_id)

        if not task:
            return jsonify({"error": "not found"}), 404

        session.delete(task)
        session.commit()

        return jsonify({"status": "deleted"})


@app.route("/api/tasks/<int:task_id>/start", methods=["POST"])
def start_task(task_id):
    with SessionLocal() as session:
        start_timer(session, task_id)
        task = session.get(Task, task_id)

        if not task:
            return jsonify({"error": "not found"}), 404

        return jsonify(serialize_task(task))


@app.route("/api/tasks/<int:task_id>/stop", methods=["POST"])
def stop_task(task_id):
    with SessionLocal() as session:
        stop_timer(session, task_id)
        task = session.get(Task, task_id)

        if not task:
            return jsonify({"error": "not found"}), 404

        return jsonify(serialize_task(task))


@app.route("/api/tasks/delete_all", methods=["DELETE"])
def delete_all():
    with SessionLocal() as session:
        session.query(Task).delete(synchronize_session=False)
        session.query(RecurringTask).delete(synchronize_session=False)
        session.commit()

        return jsonify({"status": "cleared"})

# ----------------------------
# VIEWS
# ----------------------------

@app.route("/api/views/<view_name>/tasks", methods=["GET"])
@with_session
def get_view_tasks(view_name):
    valid = {"today", "upcoming", "overdue"}
    if view_name not in valid:
        return jsonify({"error": f"Unknown view: {view_name}"}), 400

    with SessionLocal() as session:
        tasks = get_smart_view_tasks(session, view_name)
        return jsonify({
            "view": view_name,
            "data": [serialize_task(t) for t in tasks],
        })

# ----------------------------
# HEALTH
# ----------------------------

@app.route("/api/health")
def health():
    return {"ok": True}