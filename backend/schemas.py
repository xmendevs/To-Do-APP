from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List


def _ensure_list(v):
    """Normalize a relationship attribute into a list.

    Self-referential backrefs can hand back a single object (or None) instead
    of a list, which breaks response validation. Anything that isn't already a
    list becomes an empty list.
    """
    if isinstance(v, list):
        return v
    if isinstance(v, tuple):
        return list(v)
    return []


# ─── User Schemas ──────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_premium: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ─── Board Schemas ─────────────────────────────────────────────
class BoardCreate(BaseModel):
    name: str


class BoardResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Task Schemas ──────────────────────────────────────────────
VALID_STATUSES = ["backlog", "in_progress", "blocked", "done"]


class TaskBase(BaseModel):
    title: str
    description: str = ""
    priority: int = 0
    status: str = "backlog"
    tags: List[str] = []
    due_date: Optional[datetime] = None

    @field_validator("priority", mode="before")
    @classmethod
    def convert_priority(cls, v):
        if isinstance(v, str):
            mapping = {"LOW": 0, "MED": 1, "MEDIUM": 1, "HIGH": 2}
            return mapping.get(v.upper(), 0)
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            return "backlog"
        return v

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        return _ensure_list(v)


class TaskCreate(TaskBase):
    parent_id: Optional[int] = None
    board_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    is_archived: Optional[bool] = None

    @field_validator("priority", mode="before")
    @classmethod
    def convert_priority(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            mapping = {"LOW": 0, "MED": 1, "MEDIUM": 1, "HIGH": 2}
            return mapping.get(v.upper(), 0)
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return v
        if v not in VALID_STATUSES:
            raise ValueError(f"Status must be one of: {VALID_STATUSES}")
        return v

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return v
        return _ensure_list(v)


class TaskResponse(TaskBase):
    id: int
    user_id: int
    board_id: Optional[int]
    parent_id: Optional[int]
    is_completed: bool
    is_archived: bool
    completed_at: Optional[datetime]
    created_at: datetime
    subtasks: List["TaskResponse"] = []

    @field_validator("subtasks", mode="before")
    @classmethod
    def validate_subtasks(cls, v):
        return _ensure_list(v)

    class Config:
        from_attributes = True


TaskResponse.model_rebuild()


# ─── Analytics Schemas ─────────────────────────────────────────
class CompletionRate(BaseModel):
    date: str
    total: int
    completed: int
    rate: float
