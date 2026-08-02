"""Setup configuration for PEAAI Backend Database Module."""
from setuptools import setup, find_packages

setup(
    name="peaai-database",
    version="1.0.0",
    description="PEAAI Database Module - PostgreSQL schema and migrations",
    author="PEAAI Engineering",
    packages=find_packages(),
    install_requires=[
        "SQLAlchemy>=2.0.0",
        "psycopg2-binary>=2.9.9",
        "alembic>=1.13.0",
        "python-dotenv>=1.0.0",
        "bcrypt>=4.1.0",
    ],
    python_requires=">=3.10",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
