"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create conversation_mode enum
    conversation_mode = postgresql.ENUM('companion', 'story', name='conversationmode', create_type=False)
    conversation_mode.create(op.get_bind(), checkfirst=True)
    
    # Create message_role enum
    message_role = postgresql.ENUM('user', 'assistant', 'system', name='messagerole', create_type=False)
    message_role.create(op.get_bind(), checkfirst=True)
    
    # Create memory_type enum
    memory_type = postgresql.ENUM('user_preference', 'user_fact', 'relationship', 'conversation_summary', 'context', 'long_term', name='memorytype', create_type=False)
    memory_type.create(op.get_bind(), checkfirst=True)
    
    # Create memory_importance enum
    memory_importance = postgresql.ENUM('low', 'medium', 'high', 'critical', name='memoryimportance', create_type=False)
    memory_importance.create(op.get_bind(), checkfirst=True)
    
    # Create story_status enum
    story_status = postgresql.ENUM('draft', 'generating', 'completed', 'failed', 'archived', name='storystatus', create_type=False)
    story_status.create(op.get_bind(), checkfirst=True)
    
    # Create story_genre enum
    story_genre = postgresql.ENUM('fantasy', 'scifi', 'mystery', 'romance', 'adventure', 'horror', 'comedy', 'drama', 'other', name='storygenre', create_type=False)
    story_genre.create(op.get_bind(), checkfirst=True)

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.Text(), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('preferences', sa.Text(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_created_at', 'users', ['created_at'])
    
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('mode', postgresql.ENUM('companion', 'story', name='conversationmode', create_type=False), nullable=False, server_default='companion'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', postgresql.JSONB(astext=sa.Text()), nullable=True),
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_conversations_created_at', 'conversations', ['created_at'])
    op.create_index('ix_conversations_user_created', 'conversations', ['user_id', 'created_at'])
    op.create_index('ix_conversations_mode', 'conversations', ['mode'])
    op.create_index('ix_conversations_is_active', 'conversations', ['is_active'])
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', postgresql.ENUM('user', 'assistant', 'system', name='messagerole', create_type=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', postgresql.JSONB(astext=sa.Text()), nullable=True),
        sa.Column('embedding', sa.Text(), nullable=True),
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_conversation_sequence', 'messages', ['conversation_id', 'sequence_number'])
    op.create_index('ix_messages_created_at', 'messages', ['created_at'])
    op.create_index('ix_messages_role', 'messages', ['role'])
    
    # Create memories table
    op.create_table(
        'memories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('memory_type', postgresql.ENUM('user_preference', 'user_fact', 'relationship', 'conversation_summary', 'context', 'long_term', name='memorytype', create_type=False), nullable=False),
        sa.Column('importance', postgresql.ENUM('low', 'medium', 'high', 'critical', name='memoryimportance', create_type=False), nullable=False, server_default='medium'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('summary', sa.String(500), nullable=True),
        sa.Column('embedding', sa.Text(), nullable=True),
        sa.Column('relevance_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('access_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_accessed', sa.DateTime(), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext=sa.Text()), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext=sa.Text()), nullable=True),
    )
    op.create_index('ix_memories_user_id', 'memories', ['user_id'])
    op.create_index('ix_memories_conversation_id', 'memories', ['conversation_id'])
    op.create_index('ix_memories_memory_type', 'memories', ['memory_type'])
    op.create_index('ix_memories_importance', 'memories', ['importance'])
    op.create_index('ix_memories_created_at', 'memories', ['created_at'])
    op.create_index('ix_memories_user_type', 'memories', ['user_id', 'memory_type'])
    op.create_index('ix_memories_user_importance', 'memories', ['user_id', 'importance'])
    op.create_index('ix_memories_relevance_score', 'memories', ['relevance_score'])
    op.create_index('ix_memories_is_pinned', 'memories', ['is_pinned'])
    op.create_index('ix_memories_is_active', 'memories', ['is_active'])
    op.create_index('ix_memories_expires_at', 'memories', ['expires_at'])
    
    # Create memory_relations table
    op.create_table(
        'memory_relations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('source_memory_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('memories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_memory_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('memories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('relation_type', sa.String(100), nullable=False),
        sa.Column('strength', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_memory_relations_source', 'memory_relations', ['source_memory_id'])
    op.create_index('ix_memory_relations_target', 'memory_relations', ['target_memory_id'])
    op.create_index('ix_memory_relations_type', 'memory_relations', ['relation_type'])
    op.create_index('ix_memory_relations_source_target', 'memory_relations', ['source_memory_id', 'target_memory_id'], unique=True)
    
    # Create stories table
    op.create_table(
        'stories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('genre', postgresql.ENUM('fantasy', 'scifi', 'mystery', 'romance', 'adventure', 'horror', 'comedy', 'drama', 'other', name='storygenre', create_type=False), nullable=False, server_default='other'),
        sa.Column('status', postgresql.ENUM('draft', 'generating', 'completed', 'failed', 'archived', name='storystatus', create_type=False), nullable=False, server_default='draft'),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('scene_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', postgresql.JSONB(astext=sa.Text()), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext=sa.Text()), nullable=True),
    )
    op.create_index('ix_stories_user_id', 'stories', ['user_id'])
    op.create_index('ix_stories_conversation_id', 'stories', ['conversation_id'])
    op.create_index('ix_stories_status', 'stories', ['status'])
    op.create_index('ix_stories_genre', 'stories', ['genre'])
    op.create_index('ix_stories_created_at', 'stories', ['created_at'])
    op.create_index('ix_stories_user_status', 'stories', ['user_id', 'status'])
    op.create_index('ix_stories_user_created', 'stories', ['user_id', 'created_at'])
    op.create_index('ix_stories_is_favorite', 'stories', ['is_favorite'])
    op.create_index('ix_stories_is_public', 'stories', ['is_public'])
    op.create_index('ix_stories_rating', 'stories', ['rating'])
    
    # Create story_scenes table
    op.create_table(
        'story_scenes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('story_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scene_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(300), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('narrative', sa.Text(), nullable=True),
        sa.Column('background_prompt', sa.Text(), nullable=True),
        sa.Column('character_positions', postgresql.JSONB(astext=sa.Text()), nullable=True),
        sa.Column('emotion', sa.String(100), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=False, server_default='5000'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_story_scenes_story_id', 'story_scenes', ['story_id'])
    op.create_index('ix_story_scenes_scene_number', 'story_scenes', ['scene_number'])
    op.create_index('ix_story_scenes_story_scene', 'story_scenes', ['story_id', 'scene_number'], unique=True)
    
    # Create story_versions table
    op.create_table(
        'story_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('story_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('change_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_story_versions_story_id', 'story_versions', ['story_id'])
    op.create_index('ix_story_versions_story_version', 'story_versions', ['story_id', 'version_number'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_table('story_versions')
    op.drop_table('story_scenes')
    op.drop_table('stories')
    op.drop_table('memory_relations')
    op.drop_table('memories')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS storygenre')
    op.execute('DROP TYPE IF EXISTS storystatus')
    op.execute('DROP TYPE IF EXISTS memoryimportance')
    op.execute('DROP TYPE IF EXISTS memorytype')
    op.execute('DROP TYPE IF EXISTS messagerole')
    op.execute('DROP TYPE IF EXISTS conversationmode')
