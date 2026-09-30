# Mono — Minimalist B&W Todo

A monochrome task manager with boards, a Kanban board, natural-language date
parsing, and keyboard-first navigation. Strict black & white design, light/dark
themes, no colour accents anywhere in the UI.

**Status:** works locally. Not deployed.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Date parsing | chrono-node (client-side NLP) |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2.x |
| Database | SQLite |
| Auth | JWT (HS256) + bcrypt |
| Rate limiting | In-process sliding window (no external deps) |

---

## Features

**Core**
- Register / login with JWT sessions
- Tasks with title, description, and priority (Low / Med / High)
- Board switching — tasks scoped per board
- List view and Kanban view with drag-and-drop between columns
- Status workflow: Backlog → In Progress → Blocked → Done
- Inline task editing, subtasks, delete
- Optimistic UI updates with revert-on-failure

**Quality of life**
- Natural language dates — type `go to gym by 6 tomorrow` and the phrase is
  stripped and parsed into a due date, displayed as a badge
- Command palette — `Ctrl+K` / `Cmd+K` to add a task without leaving the keyboard
- Vim-style navigation — `j` / `k` to move, `x` or `Enter` to toggle, `e` to edit.
  Shortcuts disable themselves while you're typing in a field.
- Live clock and time-aware greeting
- Browser notifications + audio chime 5 minutes before a task is due
- Dark / light mode toggle, persisted to `localStorage`

**Analysis**
- 7-day completion-rate bar chart
- Predictive routine suggestions from your own completion history

---

## Getting started

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API: <http://localhost:8000> · Interactive docs: <http://localhost:8000/docs>

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: <http://localhost:5173>

The Vite dev server proxies `/api/*` to `localhost:8000`, so both must be running.

---

## Configuration

All settings are read from environment variables via `backend/config.py`.
Nothing sensitive is hardcoded.

| Variable | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | generated dev key | JWT signing key. **Required in production.** |
| `CORS_ORIGINS` | localhost origins | Comma-separated allowed origins. **Required in production.** |
| `ENVIRONMENT` | `development` | Set to `production` to enable startup guards. |
| `DATABASE_URL` | `sqlite:///./todo.db` | Database connection string. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime. |
| `MIN_PASSWORD_LENGTH` | `8` | Minimum password length. |
| `LOGIN_RATE_LIMIT` / `LOGIN_RATE_WINDOW` | `10` / `300` | Login attempts per IP per N seconds. |
| `REGISTER_RATE_LIMIT` / `REGISTER_RATE_WINDOW` | `5` / `3600` | Registrations per IP per N seconds. |
| `RATE_LIMIT_ENABLED` | `true` | Master switch for rate limiting. |

Generate a production secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

When `ENVIRONMENT=production`, the app **refuses to start** if `SECRET_KEY` or
`CORS_ORIGINS` is missing. That is deliberate — a misconfigured deploy fails
loudly instead of running with a public secret.

---

## API

All routes except register/login require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account (201) |
| POST | `/auth/login` | Obtain JWT |
| GET | `/auth/me` | Current user |
| GET | `/boards` | List boards |
| POST | `/boards` | Create board |
| DELETE | `/boards/{id}` | Delete board (cascades to its tasks) |
| GET | `/tasks?board_id=` | List tasks, optionally filtered by board |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/{id}` | Partial update (status, title, tags, …) |
| DELETE | `/tasks/{id}` | Delete task and its subtasks |
| GET | `/tasks/suggested` | Predicted routines |
| GET | `/analytics/completion-rate` | 7-day completion stats |
| POST | `/users/upgrade` | Grant premium — see Known limitations |

---

## Database migrations

`backend/init_db.py` runs automatically at startup. It calls
`Base.metadata.create_all()` for new tables, then inspects each table and issues
`ALTER TABLE ... ADD COLUMN` for any column the models expect but SQLite is
missing.

This exists because `create_all()` alone only creates tables — it silently
ignores new columns on existing tables, which produces
`sqlite3.OperationalError: no such column` after any model change. You should
not need to delete the database file when you change a model.

Run it standalone with:

```bash
cd backend && python init_db.py
```

---

## Known limitations

These are real and currently unaddressed:

- **SQLite on ephemeral disks.** On free-tier hosts (Render, Heroku) the disk is
  wiped on every redeploy, so all data is lost. Use a persistent disk or move to
  Postgres before relying on it. `DATABASE_URL` is already plumbed for that.
- **`POST /users/upgrade` grants premium for free.** There is no payment
  integration — any authenticated user can call it and get `is_premium: true`.
  Premium is therefore a UI gate only, not an authorization boundary.
- **Rate limiting is per-process and in-memory.** It resets on restart and does
  not coordinate across multiple workers or instances. Swap the storage in
  `backend/rate_limit.py` for Redis if you run more than one worker.
- **No board rename.** `PATCH /boards/{id}` is not implemented; renaming means
  deleting the board and its tasks.
- **Deleting a board is destructive.** Tasks are removed immediately — no soft
  delete, no undo.
- **Tasks can be orphaned.** A task created before a board is selected gets
  `board_id: null` and won't appear under any board filter.
- **Bulk JS bundle** ~785 kB (236 kB gzipped). No code-splitting yet.

---

## Project layout

```
.
├── backend/
│   ├── main.py          # FastAPI app, routes, automation rules
│   ├── config.py        # Env-driven settings + production guards
│   ├── init_db.py       # Table creation + column migrations
│   ├── rate_limit.py    # Dependency-free sliding-window limiter
│   ├── auth.py          # JWT + bcrypt helpers
│   ├── models.py        # User, Board, Task
│   ├── schemas.py       # Pydantic request/response models
│   ├── routines.py      # Predictive routine analysis
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/  # Navbar, Sidebar, TaskInput, TaskList, TaskItem,
│       │                # KanbanView, StatusDropdown, PriorityBadge, …
│       ├── context/     # AuthContext, ThemeContext
│       ├── hooks/       # useKeyboardNavigation, useTaskReminders
│       └── utils/       # dateParser (chrono-node wrapper)
├── Dockerfile
├── render.yaml
└── vercel.json
```

---

## Contributors

| Contributor | Role |
|---|---|
| [Success Joseph Ibemgbo](https://github.com/xmendevs) | Author & maintainer |

Built with AI assistance (Claude / opencode) for scaffolding, debugging, and
feature implementation.

## License

Private. All rights reserved.
