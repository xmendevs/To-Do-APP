from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship, backref
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    boards = relationship("Board", back_populates="owner", cascade="all, delete-orphan")


class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="boards")
    tasks = relationship("Task", back_populates="board", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    title = Column(String, index=True)
    description = Column(Text, default="")
    is_completed = Column(Boolean, default=False)
    priority = Column(Integer, default=0)  # 0=low, 1=medium, 2=high
    status = Column(String, default="backlog")  # backlog, in_progress, blocked, done
    tags = Column(JSON, default=list)  # Array of strings
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="tasks")
    board = relationship("Board", back_populates="tasks")
    subtasks = relationship(
        "Task",
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        lazy="selectin",
    )
