"""Add recurring_rule_id to tasks

Revision ID: 4747bdd22a61
Revises: 239424abe4bf
Create Date: 2026-02-27 14:18:19.285197

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4747bdd22a61'
down_revision: Union[str, Sequence[str], None] = '239424abe4bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
def upgrade() -> None:
    # Add new column
    op.add_column("tasks", sa.Column("recurring_rule_id", sa.Integer(), nullable=True))
    
    # Optional: copy data from old column if exists
    # op.execute("UPDATE tasks SET recurring_rule_id = source_recurring_id")
    
    # Drop old column (SQLite requires table recreation if you want to fully drop)
    # If you don’t have important data, you can skip drop

def downgrade() -> None:
    op.drop_column("tasks", "recurring_rule_id")