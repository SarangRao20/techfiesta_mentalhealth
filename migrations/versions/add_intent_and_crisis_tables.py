"""Add ChatIntent and CrisisAlert tables for analytics and mentor dashboard

Revision ID: add_intent_crisis
Revises: 5dcef09a4df7
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'add_intent_crisis'
down_revision = '5dcef09a4df7'
branch_labels = None
depends_on = None


def upgrade():
    # Create ChatIntent table for storing intent analysis
    op.create_table('chat_intent',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('intent_data', JSONB, nullable=False),  # Full intent JSON
        sa.Column('emotional_state', sa.String(50), nullable=True),
        sa.Column('intent_type', sa.String(50), nullable=True),
        sa.Column('emotional_intensity', sa.String(20), nullable=True),
        sa.Column('cognitive_load', sa.String(20), nullable=True),
        sa.Column('help_receptivity', sa.String(20), nullable=True),
        sa.Column('self_harm_crisis', sa.Boolean(), default=False),
        sa.Column('suggested_feature', sa.String(100), nullable=True),
        sa.Column('suggested_assessment', sa.String(50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['chat_session.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['message_id'], ['chat_message.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_intent_user_id', 'chat_intent', ['user_id'])
    op.create_index('ix_chat_intent_timestamp', 'chat_intent', ['timestamp'])
    op.create_index('ix_chat_intent_crisis', 'chat_intent', ['self_harm_crisis'])
    
    # Create CrisisAlert table for mentor dashboard
    op.create_table('crisis_alert',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('intent_id', sa.Integer(), nullable=True),
        sa.Column('alert_type', sa.String(50), nullable=False),  # 'self_harm', 'high_distress', etc.
        sa.Column('severity', sa.String(20), nullable=False),  # 'critical', 'high', 'moderate'
        sa.Column('message_snippet', sa.Text(), nullable=True),
        sa.Column('intent_summary', JSONB, nullable=True),
        sa.Column('acknowledged', sa.Boolean(), default=False),
        sa.Column('acknowledged_by', sa.Integer(), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['chat_session.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['intent_id'], ['chat_intent.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['acknowledged_by'], ['user.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_crisis_alert_user_id', 'crisis_alert', ['user_id'])
    op.create_index('ix_crisis_alert_acknowledged', 'crisis_alert', ['acknowledged'])
    op.create_index('ix_crisis_alert_created_at', 'crisis_alert', ['created_at'])


def downgrade():
    op.drop_table('crisis_alert')
    op.drop_table('chat_intent')
