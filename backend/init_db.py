"""
Database initialization + automatic schema migration.

`Base.metadata.create_all()` only CREATES missing tables — it never ADDS
columns to tables that already exist. That's why the app kept crashing with
"no such column: tasks.board_id" after each model change.

This module does both:
  1. create_all() for brand new tables
  2. ALTER TABLE ... ADD COLUMN for any column the models expect but SQLite
     is missing, so schema changes never require deleting the db file.
"""

import logging
from sqlalchemy import inspect, text

from database import engine, Base  # same Base the models are mapped against

log = logging.getLogger(__name__)


def _model_columns(table_name: str):
    """Return {column_name: column_sql_type} for a mapped model."""
    return {c.name: c for c in Base.metadata.tables[table_name].columns}


def _existing_columns(table_name: str):
    insp = inspect(engine)
    if table_name not in insp.get_table_names():
        return None
    return {c["name"] for c in insp.get_columns(table_name)}


def _add_missing_columns(table_name: str):
    """Add any columns the model defines that the DB table is missing."""
    existing = _existing_columns(table_name)
    if existing is None:
        return []

    added = []
    for name, col in _model_columns(table_name).items():
        if name in existing:
            continue

        # Build a portable ADD COLUMN statement.
        col_type = col.type.compile(dialect=engine.dialect)
        ddl = f"ALTER TABLE {table_name} ADD COLUMN {name} {col_type}"

        # SQLite cannot add a NOT NULL column without a default to a table
        # that already has rows. Skip those (or give them a default).
        if not col.nullable and not col.default and not col.server_default:
            log.warning(
                "skipping NOT NULL column %s.%s (needs manual migration)",
                table_name,
                name,
            )
            continue

        with engine.begin() as conn:
            conn.execute(text(ddl))
        added.append(name)
        log.info("migrated: ADD COLUMN %s.%s %s", table_name, name, col_type)

    return added


def _backfill_defaults(table_name: str, columns):
    """Fill NULLs for newly added columns so NOT NULL reads don't explode."""
    if not columns:
        return

    for name in columns:
        col = _model_columns(table_name)[name]
        default_sql = None

        if isinstance(col.type, type(col.type)) and hasattr(col.type, "python_type"):
            if col.type.python_type is bool:
                default_sql = "0"
            elif col.type.python_type is int:
                default_sql = "0"
            elif col.type.python_type is str:
                default_sql = "''"
            else:
                default_sql = "NULL"

        if default_sql and default_sql != "NULL":
            with engine.begin() as conn:
                conn.execute(
                    text(
                        f"UPDATE {table_name} SET {name} = {default_sql} "
                        f"WHERE {name} IS NULL"
                    )
                )


def init_db():
    """Create tables and migrate any missing columns. Safe to run on boot."""
    # Import models so they're registered on Base.metadata before we inspect.
    from models import User, Task, Board  # noqa: F401

    Base.metadata.create_all(bind=engine)
    log.info("tables ensured: %s", sorted(Base.metadata.tables))

    for table in Base.metadata.tables:
        added = _add_missing_columns(table)
        _backfill_defaults(table, added)

    log.info("database ready")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    init_db()
    print("OK - database is up to date")
