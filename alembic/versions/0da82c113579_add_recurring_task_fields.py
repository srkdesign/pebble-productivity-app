from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0da82c113579'
down_revision = '3bab46f5f3e3'
branch_labels = None
depends_on = None

def upgrade():
    # Add recurring task columns
    op.add_column('tasks', sa.Column('recurrence_pattern', sa.String(), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_end', sa.BigInteger(), nullable=True))


def downgrade():
    # Remove recurring task columns
    op.drop_column('tasks', 'recurrence_end')
    op.drop_column('tasks', 'recurrence_pattern')