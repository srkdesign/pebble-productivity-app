"""Add recurring task fields safely

Revision ID: 2fc8ffbe9e1e
Revises: e97882116955
Create Date: 2026-02-27 13:44:33.578893

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fc8ffbe9e1e'
down_revision: Union[str, Sequence[str], None] = 'e97882116955'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()
    existing_cols = [c[1] for c in conn.execute("PRAGMA table_info(tasks)")]

    if 'recurrence_pattern' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_pattern', sa.String(), nullable=True))
    if 'recurrence_type' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_type', sa.String(), nullable=True))
    if 'recurrence_day' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_day', sa.String(), nullable=True))
    if 'recurrence_end' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_end', sa.BigInteger(), nullable=True))

def downgrade():
    op.drop_column('tasks', 'recurrence_pattern')
    op.drop_column('tasks', 'recurrence_type')
    op.drop_column('tasks', 'recurrence_day')
    op.drop_column('tasks', 'recurrence_end')
