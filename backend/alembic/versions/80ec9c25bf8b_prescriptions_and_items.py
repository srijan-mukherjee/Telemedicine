"""prescriptions and items

Revision ID: 80ec9c25bf8b
Revises: cc7498325096
Create Date: 2026-08-28 15:44:41.730669

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80ec9c25bf8b'
down_revision: Union[str, None] = 'cc7498325096'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('prescriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('appointment_id', sa.Integer(), nullable=False),
    sa.Column('doctor_id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('diagnosis', sa.Text(), nullable=True),
    sa.Column('advice', sa.Text(), nullable=True),
    sa.Column('clinical_notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
    sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('appointment_id')
    )
    op.create_index(op.f('ix_prescriptions_doctor_id'), 'prescriptions', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_id'), 'prescriptions', ['id'], unique=False)
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'], unique=False)
    op.create_table('prescription_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('prescription_id', sa.Integer(), nullable=False),
    sa.Column('medicine_name', sa.String(length=200), nullable=False),
    sa.Column('dosage', sa.String(length=100), nullable=True),
    sa.Column('frequency', sa.String(length=100), nullable=True),
    sa.Column('duration_days', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescription_items_id'), 'prescription_items', ['id'], unique=False)
    op.create_index(op.f('ix_prescription_items_prescription_id'), 'prescription_items', ['prescription_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_prescription_items_prescription_id'), table_name='prescription_items')
    op.drop_index(op.f('ix_prescription_items_id'), table_name='prescription_items')
    op.drop_table('prescription_items')
    op.drop_index(op.f('ix_prescriptions_patient_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_doctor_id'), table_name='prescriptions')
    op.drop_table('prescriptions')
