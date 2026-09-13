"""add doctor availability

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "doctor_availability",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("doctor_profiles.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("specific_date", sa.Date(), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_holiday", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_doctor_availability_doctor_id", "doctor_availability", ["doctor_id"])
    op.create_index("ix_doctor_availability_specific_date", "doctor_availability", ["specific_date"])


def downgrade() -> None:
    op.drop_index("ix_doctor_availability_specific_date", table_name="doctor_availability")
    op.drop_index("ix_doctor_availability_doctor_id", table_name="doctor_availability")
    op.drop_table("doctor_availability")
