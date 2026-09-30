from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
import logging

from database import engine, get_db, Base
from models import User, Task, Board
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    BoardCreate, BoardResponse,
    TaskCreate, TaskUpdate, TaskResponse, CompletionRate
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user
)
from routines import analyze_routines
from init_db import init_db
import config
from rate_limit import enforce as rate_enforce, clear as rate_clear

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("mono")

# Create tables + auto-migrate any missing columns
init_db()

app = FastAPI(title="Minimalist Todo API", version="2.0.0")

# CORS - origins resolved from env via config (required in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _log_config():
    log.info("Mono API starting: %s", config.describe())


# ══════════════════════════════════════════════════════════════
# AUTOMATIONS ENGINE
# ══════════════════════════════════════════════════════════════

def run_automations(task: Task, db: Session):
    """Run automation rules after a task update."""
    # Rule 1: When status changes to "done", set completed_at
    if task.status == "done" and not task.completed_at:
        task.completed_at = datetime.utcnow()
        task.is_completed = True
    
    # Rule 2: When status changes away from "done", clear completed_at
    if task.status != "done" and task.completed_at:
        task.completed_at = None
        task.is_completed = False
    
    # Rule 3: Auto-archive tasks that have been "done" for 24+ hours
    if task.status == "done" and task.completed_at:
        hours_since_completion = (datetime.utcnow() - task.completed_at).total_seconds() / 3600
        if hours_since_completion >= 24:
            task.is_archived = True
    
    db.commit()


# ══════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    # Throttle account creation (spam / mass signup).
    rate_enforce(
        request,
        scope="register",
        limit=config.REGISTER_RATE_LIMIT,
        window=config.REGISTER_RATE_WINDOW,
        enabled=config.RATE_LIMIT_ENABLED,
    )

    username = payload.username.strip()
    email = payload.email.strip().lower()

    # bcrypt silently truncates past 72 bytes - reject instead of pretending.
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or fewer",
        )
    if len(payload.password) < config.MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {config.MIN_PASSWORD_LENGTH} characters",
        )
    if not (3 <= len(username) <= 32):
        raise HTTPException(
            status_code=400, detail="Username must be 3-32 characters"
        )

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="Username already registered")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    db_user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db.add(Board(user_id=db_user.id, name="My Board"))
    db.commit()

    # NOTE: deliberately do NOT clear the register counter here. The point of
    # this limit is to cap how many accounts one IP can create, so successful
    # registrations must still count against it.
    return db_user


@app.post("/auth/login", response_model=Token)
def login(
    payload: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    # Throttle credential-stuffing attempts per IP.
    rate_enforce(
        request,
        scope="login",
        limit=config.LOGIN_RATE_LIMIT,
        window=config.LOGIN_RATE_WINDOW,
        enabled=config.RATE_LIMIT_ENABLED,
    )

    username = payload.username.strip()
    db_user = db.query(User).filter(User.username == username).first()

    # Always run a hash comparison so a missing user and a wrong password
    # take the same time (avoids username enumeration by timing).
    stored = db_user.hashed_password if db_user else (
        "$2b$12$" + "." * 53  # valid-looking but non-matching hash
    )
    password_ok = verify_password(payload.password, stored)

    if not db_user or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    rate_clear(request, "login")
    return {
        "access_token": create_access_token(data={"sub": db_user.username}),
        "token_type": "bearer",
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ══════════════════════════════════════════════════════════════
# BOARD ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/boards", response_model=List[BoardResponse])
def get_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Board).filter(Board.user_id == current_user.id).all()


@app.post("/boards", response_model=BoardResponse)
def create_board(
    board: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_board = Board(user_id=current_user.id, name=board.name)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board


@app.delete("/boards/{board_id}")
def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_board = db.query(Board).filter(
        Board.id == board_id, Board.user_id == current_user.id
    ).first()
    if not db_board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(db_board)
    db.commit()
    return {"detail": "Board deleted"}


# ══════════════════════════════════════════════════════════════
# TASK ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    board_id: int = None,
    include_archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.parent_id == None,
    )
    if board_id is not None:
        query = query.filter(Task.board_id == board_id)
    if not include_archived:
        query = query.filter(Task.is_archived == False)
    return query.order_by(Task.created_at.desc()).all()

@app.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_task = Task(
        **task.model_dump(),
        user_id=current_user.id,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)
    
    # Run automations
    run_automations(db_task, db)
    
    return db_task


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Remove descendants (cascade="all, delete-orphan" handles the ORM side,
    # but do it explicitly so orphaned rows can never survive).
    def collect_descendants(task):
        children = db.query(Task).filter(Task.parent_id == task.id).all()
        for child in children:
            collect_descendants(child)
        if task.id != task_id:
            db.delete(task)

    collect_descendants(db_task)
    db.delete(db_task)
    db.commit()
    return {"detail": "Task deleted"}


# ══════════════════════════════════════════════════════════════
# ANALYTICS ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/analytics/completion-rate", response_model=List[CompletionRate])
def get_completion_rate(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        next_day = day + timedelta(days=1)

        total = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id,
            Task.created_at >= day,
            Task.created_at < next_day,
        ).scalar()
        completed = db.query(func.count(Task.id)).filter(
            Task.user_id == current_user.id,
            Task.is_completed == True,
            Task.created_at >= day,
            Task.created_at < next_day,
        ).scalar()
        rate = (completed / total * 100) if total > 0 else 0.0
        results.append(CompletionRate(
            date=day.strftime("%Y-%m-%d"),
            total=total,
            completed=completed,
            rate=round(rate, 1),
        ))
    return results


@app.get("/tasks/suggested")
def get_suggested_routines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    task_dicts = [
        {"title": t.title, "created_at": t.created_at, "is_completed": t.is_completed}
        for t in tasks
    ]
    return analyze_routines(task_dicts)


# ══════════════════════════════════════════════════════════════
# PREMIUM ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/users/upgrade", response_model=UserResponse)
def upgrade_to_premium(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.is_premium = True
    db.commit()
    db.refresh(current_user)
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
