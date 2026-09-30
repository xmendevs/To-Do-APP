"""SQLAlchemy engine, session factory, and declarative Base."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

# DATABASE_URL wins if set (that's how you move off SQLite). Otherwise keep the
# file next to this module so the path doesn't shift with the working directory
# - uvicorn, systemd, and `cd backend && uvicorn` all land in different CWDs.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not SQLALCHEMY_DATABASE_URL:
    db_path = (BASE_DIR / "todo.db").as_posix()
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # check_same_thread is a SQLite-only concern; passing it to Postgres/MySQL
    # raises at engine creation time.
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
