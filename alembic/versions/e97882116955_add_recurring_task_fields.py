"""add recurring task fields

Revision ID: e97882116955
Revises: 0da82c113579
Create Date: 2026-02-27 13:40:11.270549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e97882116955'
down_revision: Union[str, Sequence[str], None] = '0da82c113579'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add recurring task fields safely
    conn = op.get_bind()
    existing_cols = [c['name'] for c in conn.execute("PRAGMA table_info(tasks)")]
    
    if 'recurrence_type' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_type', sa.VARCHAR(), nullable=True))
    if 'recurrence_day' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_day', sa.VARCHAR(), nullable=True))
    if 'recurrence_end' not in existing_cols:
        op.add_column('tasks', sa.Column('recurrence_end', sa.BIGINT(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'recurrence_type')
    op.drop_column('tasks', 'recurrence_day')
    op.drop_column('tasks', 'recurrence_end')
