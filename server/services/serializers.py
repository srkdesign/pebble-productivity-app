def serialize_project(project):
    return {
        "id": project.id,
        "name": project.name,
        "is_archived": project.is_archived,
        "is_default": project.is_default,
        "color": project.color,
        "icon": project.icon,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }

def serialize_task(task):
    data = {
        "id": task.id,
        "title": task.title,
        "project_id": task.project_id,
        "due_date": task.due_date,
        "completed": task.completed,
        "completed_at": task.completed_at,
        "updated_at": task.updated_at,
        "time_spent": task.time_spent or 0,
        "is_running": task.is_running or False,
        "recurring_rule_id": task.recurring_rule_id,
    }

    # Include recurring rule details
    if task.recurring_rule:
        rule = task.recurring_rule
        data["recurring_rule"] = {
            "id": rule.id,
            "pattern": rule.pattern,
            "interval": rule.interval,
            "days": rule.days,
            "start_date": rule.start_date
        }

    return data