"""Setup configuration for PEAAI Backend Infrastructure Module."""
from setuptools import setup, find_packages

setup(
    name="peaai-backend",
    version="1.0.0",
    description="PEAAI Backend Infrastructure - API, Authentication, and Database",
    author="PEAAI Engineering",
    packages=find_packages(),
    install_requires=[
        "SQLAlchemy>=2.0.0",
        "psycopg2-binary>=2.9.9",
        "alembic>=1.13.0",
        "python-dotenv>=1.0.0",
        "bcrypt>=4.1.0",
        "fastapi>=0.109.0",
        "uvicorn[standard]>=0.27.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "PyJWT>=2.8.0",
        "python-jose[cryptography]>=3.3.0",
        "slowapi>=0.1.9",
        "email-validator>=2.1.0",
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
