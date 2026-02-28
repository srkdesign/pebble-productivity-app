from server.models.project import Project

def get_default_project(session):
    return session.query(Project).filter_by(is_default=True).one()