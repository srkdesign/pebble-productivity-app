"""add recurring tasks table

Revision ID: b6f7f2e701e3
Revises: 2fc8ffbe9e1e
Create Date: 2026-02-27 14:00:45.824965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6f7f2e701e3'
down_revision: Union[str, Sequence[str], None] = '2fc8ffbe9e1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # --- 1. remove recurrence columns from tasks ---
    with op.batch_alter_table("tasks") as batch:
        batch.drop_column("recurrence_pattern")
        batch.drop_column("recurrence_type")
        batch.drop_column("recurrence_day")
        batch.drop_column("recurrence_end")

    # --- 2. create recurring_tasks table ---
    op.create_table(
        "recurring_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),

        sa.Column("pattern", sa.String(), nullable=False),
        sa.Column("interval", sa.Integer()),
        sa.Column("days", sa.String()),

        sa.Column("start_date", sa.BigInteger(), nullable=False),
        sa.Column("end_date", sa.BigInteger()),
        sa.Column("last_generated", sa.BigInteger())
    )


def downgrade():
    # --- reverse table creation ---
    op.drop_table("recurring_tasks")

    # --- restore columns back to tasks ---
    with op.batch_alter_table("tasks") as batch:
        batch.add_column(sa.Column("recurrence_pattern", sa.String()))
        batch.add_column(sa.Column("recurrence_type", sa.Integer()))
        batch.add_column(sa.Column("recurrence_day", sa.String()))
        batch.add_column(sa.Column("recurrence_end", sa.BigInteger()))
