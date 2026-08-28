"""create_appointments_table

Revision ID: cc7498325096
Revises: 0002
Create Date: 2026-08-25 00:51:40.579808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'cc7498325096'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create the appointments table – no enum creation needed
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('appointment_datetime', sa.DateTime(), nullable=False),
        # Use plain string column – the enum already exists in DB
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('reason_text', sa.Text(), nullable=True),
        sa.Column('booked_at', sa.DateTime(), nullable=True),
        sa.Column('reference_number', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_appointments_id', 'appointments', ['id'], unique=False)
    op.create_index('ix_appointments_reference_number', 'appointments', ['reference_number'], unique=True)

    # 🔥 CRITICAL: Prevents double-booking
    op.execute("CREATE UNIQUE INDEX idx_unique_active_appointment ON appointments (doctor_id, appointment_datetime) WHERE status NOT IN ('CANCELLED');")

def downgrade() -> None:
    # Drop the unique index first
    op.execute("DROP INDEX IF EXISTS idx_unique_active_appointment;")
    op.drop_index('ix_appointments_reference_number', table_name='appointments')
    op.drop_index('ix_appointments_id', table_name='appointments')
    op.drop_table('appointments')
    # Do NOT drop the enum – it may be used elsewhere and was not created by this migration