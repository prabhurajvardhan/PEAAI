# PEAAI Database Module

PostgreSQL database schema and migrations for the PEAAI AI Companion application.

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Setup](#setup)
- [Migrations](#migrations)
- [Models](#models)
- [Usage](#usage)

## Overview

This module provides the database infrastructure for PEAAI, including:
- User management and authentication
- Conversation and message storage
- AI memory and context management
- Story generation and scene storage

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication |
| `conversations` | Chat sessions between users and AI |
| `messages` | Individual messages in conversations |
| `memories` | AI memory and context storage |
| `memory_relations` | Relationships between memories |
| `stories` | Generated story content |
| `story_scenes` | Individual scenes within stories |
| `story_versions` | Version history for stories |

### Indexes

All tables include appropriate indexes for:
- Primary key lookups
- Foreign key relationships
- Common query patterns
- Sorting and filtering

### Data Integrity

- Foreign key constraints with CASCADE/SET NULL
- Check constraints for valid ranges
- NOT NULL constraints on required fields
- Unique constraints on appropriate columns

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- `psql` client (optional)

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/peaai
SQL_ECHO=false
```

### Database Creation

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE peaai;"

# Run migrations
alembic upgrade head
```

## Migrations

We use Alembic for database migrations.

### Commands

```bash
# Upgrade to latest migration
alembic upgrade head

# Downgrade one revision
alembic downgrade -1

# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Show current revision
alembic current

# Show migration history
alembic history

# Upgrade to specific revision
alembic upgrade <revision>
```

### Creating Migrations

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "Add new column to users"

# Manual migration
alembic revision -m "Add new table"
```

## Models

### User

```python
from database.models import User

user = User(
    email="user@example.com",
    username="username",
    display_name="User Name"
)
user.set_password("password123")
```

### Conversation

```python
from database.models import Conversation, Message
from database.models.conversation import ConversationMode, MessageRole

conversation = Conversation(
    user_id=user_id,
    title="My Chat",
    mode=ConversationMode.COMPANION
)

message = Message(
    conversation_id=conversation.id,
    role=MessageRole.USER,
    content="Hello!",
    sequence_number=1
)
```

### Memory

```python
from database.models import Memory
from database.models.memory import MemoryType, MemoryImportance

memory = Memory(
    user_id=user_id,
    memory_type=MemoryType.USER_PREFERENCE,
    importance=MemoryImportance.HIGH,
    content="User prefers dark mode",
    summary="Dark mode preference"
)
```

### Story

```python
from database.models import Story, StoryScene
from database.models.story import StoryStatus, StoryGenre

story = Story(
    user_id=user_id,
    title="The Adventure Begins",
    genre=StoryGenre.FANTASY,
    status=StoryStatus.COMPLETED,
    content="Once upon a time...",
    word_count=5000
)

scene = StoryScene(
    story_id=story.id,
    scene_number=1,
    title="The Beginning",
    description="A hero stands at the crossroads",
    duration_ms=5000
)
```

## Usage

### Database Session

```python
from database import SessionLocal, get_db
from database.models import User

# Using SessionLocal directly
db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "user@example.com").first()
finally:
    db.close()

# Using dependency injection
def get_user(db: Session = Depends(get_db)):
    return db.query(User).first()
```

### Initialization

```python
from database import init_db

# Create all tables
init_db()
```

## License

Internal use only - PEAAI Project
