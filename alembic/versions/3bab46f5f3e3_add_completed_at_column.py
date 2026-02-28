"""Add completed_at column

Revision ID: 3bab46f5f3e3
Revises: 
Create Date: 2026-02-27 13:29:37.452319
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3bab46f5f3e3'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Add completed_at column to tasks table."""
    op.add_column('tasks', sa.Column('completed_at', sa.Integer(), nullable=True))

def downgrade() -> None:
    """Remove completed_at column from tasks table."""
    op.drop_column('tasks', 'completed_at')