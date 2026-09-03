"""add meeting link to appointment

Revision ID: 25e850aa6060
Revises: cc7a0e058cd5
Create Date: 2026-09-04 01:29:30.015620

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25e850aa6060'
down_revision: Union[str, None] = 'cc7a0e058cd5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ONLY add the meeting_link column
    op.add_column('appointments', sa.Column('meeting_link', sa.String(), nullable=True))


def downgrade() -> None:
    # ONLY drop the meeting_link column
    op.drop_column('appointments', 'meeting_link')