"""Add is_onboarded to User and onboarding_response table

Revision ID: onboarding_and_is_onboarded
Revises: add_intent_crisis
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'onboarding_and_is_onboarded'
down_revision = 'add_intent_crisis'
branch_labels = None
depends_on = None

def upgrade():
    # Add is_onboarded to user table
    op.add_column('user', sa.Column('is_onboarded', sa.Boolean(), nullable=False, server_default=sa.false()))

    # Create onboarding_response table
    op.create_table(
        'onboarding_response',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=False, index=True),
        sa.Column('responses', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table('onboarding_response')
    op.drop_column('user', 'is_onboarded')
