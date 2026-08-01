#!/usr/bin/env python3
"""Command-line script for running database migrations."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from alembic.config import main as alembic_main


def main():
    """Run alembic commands."""
    os.chdir(os.path.dirname(os.path.dirname(__file__)))
    sys.exit(alembic_main())


if __name__ == "__main__":
    main()
