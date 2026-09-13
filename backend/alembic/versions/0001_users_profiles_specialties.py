"""create users, patient_profiles, doctor_profiles, specialties

Revision ID: 0001
Revises:
Create Date: 2026-08-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = sa.Enum("patient", "doctor", "admin", name="user_role")
doctor_status_enum = sa.Enum("pending", "approved", "blocked", name="doctor_status")


def upgrade() -> None:
    user_role_enum.create(op.get_bind(), checkfirst=True)
    doctor_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "specialties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_unique_constraint("uq_specialties_name", "specialties", ["name"])

    op.create_table(
        "patient_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("blood_group", sa.String(length=5), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("emergency_contact", sa.String(length=50), nullable=True),
    )
    op.create_unique_constraint("uq_patient_profiles_user_id", "patient_profiles", ["user_id"])

    op.create_table(
        "doctor_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("specialty_id", sa.Integer(), sa.ForeignKey("specialties.id"), nullable=False),
        sa.Column("qualification", sa.String(length=255), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("clinic_address", sa.String(length=500), nullable=True),
        sa.Column("consultation_fee", sa.Numeric(10, 2), nullable=True),
        sa.Column("rating", sa.Numeric(3, 2), nullable=True),
        sa.Column("bio", sa.String(length=2000), nullable=True),
        sa.Column("status", doctor_status_enum, nullable=False, server_default="pending"),
    )
    op.create_unique_constraint("uq_doctor_profiles_user_id", "doctor_profiles", ["user_id"])


def downgrade() -> None:
    op.drop_table("doctor_profiles")
    op.drop_table("patient_profiles")
    op.drop_table("specialties")
    op.drop_table("users")
    doctor_status_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
