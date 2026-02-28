"""link tasks to recurring

Revision ID: 239424abe4bf
Revises: b6f7f2e701e3
Create Date: 2026-02-27 14:05:06.433616

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '239424abe4bf'
down_revision: Union[str, Sequence[str], None] = 'b6f7f2e701e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("tasks",
        sa.Column("source_recurring_id", sa.Integer())
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
