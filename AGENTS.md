# AGENTS.md

Guidance for AI agents working in this repository.

## What this is

A minimalist black & white todo app. Strict monochrome design — no colour accents
anywhere in the UI. Frontend is React, backend is FastAPI, storage is SQLite.

- **Repo:** https://github.com/xmendevs/To-Do-APP (public)
- **Live app:** https://mono-todo-seven.vercel.app
- **Live API:** https://mono-todo-api-production.up.railway.app
- **API docs:** https://mono-todo-api-production.up.railway.app/docs

## Commands

```bash
# Backend — http://localhost:8000
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (source venv/bin/activate on Unix)
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend — http://localhost:5173
cd frontend
npm install
npm run dev
npm run build
```

Both must be running. Vite proxies `/api/*` → `localhost:8000` in dev only.

## Architecture

```
backend/
  main.py        FastAPI app, all routes, automation rules
  config.py      env-driven settings + production startup guards
  init_db.py     table creation + column auto-migration
  rate_limit.py  in-process sliding-window limiter (no external deps)
  auth.py        JWT + bcrypt helpers
  models.py      User, Board, Task (SQLAlchemy)
  schemas.py     Pydantic request/response models
  routines.py    predictive routine analysis
  database.py    engine/session — path anchored to module, not CWD

frontend/src/
  components/    Navbar, Sidebar, TaskInput, TaskList, TaskItem, KanbanView,
                 StatusDropdown, PriorityBadge, AuthModal, CommandPalette, …
  context/       AuthContext, ThemeContext
  hooks/         useKeyboardNavigation, useTaskReminders
  utils/         dateParser.js (chrono-node wrapper)
  api.js         axios instance + JWT interceptor
```

### Data model

- `User` — id, username, email, hashed_password, is_premium
- `Board` — id, user_id, name
- `Task` — id, user_id, **board_id**, parent_id (subtasks), title, description,
  is_completed, priority (0/1/2), **status** (backlog/in_progress/blocked/done),
  **tags** (JSON array), due_date, completed_at, is_archived, created_at

## Conventions that will bite you

**Task `status` is snake_case on the wire.** The API validates against
`["backlog", "in_progress", "blocked", "done"]` and returns **422** for anything
else. Sending `"IN PROGRESS"` fails. Display labels are separate from wire values
— see `StatusDropdown.jsx` which holds both.

**Update tasks with `PATCH`, never `PUT`.** `PUT /tasks/{id}` returns 405. If you
see 405s in the console, someone used `api.put`.

**`init_db.py` runs on every boot and is what makes model changes safe.**
`Base.metadata.create_all()` only creates tables — it silently ignores new
columns on existing tables, which produces `sqlite3.OperationalError: no such
column` after any model change. `init_db.py` does `create_all()` plus
`ALTER TABLE … ADD COLUMN` for anything missing. **Never tell a user to delete
the database.** Run `python init_db.py` directly to apply migrations.

**Bare imports in `backend/*.py` assume `backend/` is on `sys.path`.** That's why
every host must set root dir to `backend`. `uvicorn backend.main:app` from the
repo root fails with `ModuleNotFoundError`. `uvicorn --app-dir backend main:app`
is the alternative if root must stay at the repo root.

**`VITE_*` env vars are baked in at build time.** Changing one requires a
rebuild, not just a restart. The production API host comes from `VITE_API_URL`;
`api.js` falls back to `/api` for local dev.

**Colour is banned.** Tailwind config defines only `mono-0`…`mono-950`. Never
introduce a colour token. `PriorityBadge` is the reference for expressing
hierarchy in pure monochrome: inverted fill for HIGH, outlined for MED, muted
for LOW.

## Deploy targets and their quirks

Each platform breaks in a different way. These are all real failures hit here.

**Vercel — frontend only.** Deploy from `frontend/`, never the repo root. The
root contains `Dockerfile` and `render.yaml`, and Vercel will try to interpret
them:
- Root `Dockerfile` → project is treated as a **Container** service
  (`FUNCTION_INVOCATION_FAILED`, then *"Container service must specify an
  entrypoint"*)
- Root `render.yaml` → parsed as a monorepo, conflicting with `vercel.json`
  top-level properties

Root `vercel.json` declares `rootDirectory: "frontend"`, which pins this for
git-connected deploys. If deploying via CLI, `cd frontend` first.

**Railway — backend.** `requirements.txt` is in `backend/`, so Railway can't
auto-detect the project. A custom start command is stored in the dashboard and
**overrides the Dockerfile**:

```
sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers"
```

The `sh -c` is essential. Railway passes `PORT` as an env var but does **not**
shell-expand it, so without the wrapper uvicorn receives the literal string
`"$PORT"` and dies with *"is not a valid integer"*, crash-looping until the
healthcheck times out.

**Render — also supported** via `render.yaml` (uses `rootDir: backend`, no
Docker). Not currently deployed; the YAML is kept working.

## Required production env vars

`config.py` **refuses to boot** in production without these. That's deliberate —
a misconfigured deploy should fail loudly rather than run with a public secret.

```
ENVIRONMENT=production
SECRET_KEY=<48+ random bytes>
CORS_ORIGINS=https://mono-todo-seven.vercel.app   # comma-separated for multiple
```

Backend extras: `DATABASE_URL`, `ACCESS_TOKEN_EXPIRE_MINUTES`,
`MIN_PASSWORD_LENGTH`, `LOGIN_RATE_LIMIT`/`LOGIN_RATE_WINDOW`,
`REGISTER_RATE_LIMIT`/`REGISTER_RATE_WINDOW`, `RATE_LIMIT_ENABLED`.

Frontend: `VITE_API_URL` (no trailing slash, no `/api` suffix).

Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

## Security posture

- Passwords: bcrypt directly. **Do not reintroduce passlib** — it is
  incompatible with bcrypt 5.x and was removed. It is listed in neither
  requirements nor imports.
- Login runs a hash comparison even for unknown usernames, so response timing
  doesn't reveal whether an account exists.
- Rate limits are per-process and in-memory. They reset on restart and don't
  coordinate across instances. Swap the storage in `rate_limit.py` for Redis if
  you ever run more than one worker.
- **Never commit `.secret_key`, `*.db`, `.env`, or tokens.** `.gitignore` covers
  these. Verify with `git grep --cached -E "gho_|ghp_|AKIA|BEGIN.*PRIVATE KEY"`
  before any push that changes visibility.
- `SECRET_KEY` has **no hardcoded fallback** by design. Dev generates one into
  the gitignored `backend/.secret_key`.

## Known limitations

Not fixed. Don't assume these work:

- **SQLite on ephemeral disks.** Data is wiped on every redeploy/restart on both
  free tiers. `DATABASE_URL` is already plumbed for Postgres.
- **`POST /users/upgrade` grants premium for free.** No payment integration.
  Premium is a UI gate, not an authorization boundary. The endpoint is documented
  in the public README.
- **No board rename.** `PATCH /boards/{id}` doesn't exist; rename means deleting
  the board and its tasks.
- **Board deletion is destructive** — immediate, no soft delete, no undo.
- **Tasks can be orphaned** — created before a board is selected, `board_id` is
  null and invisible to board filters.
- **`frontend/public/chime.mp3` is a 0-byte placeholder.** Reminders play no sound.
- **Bundle is ~786 kB** (236 kB gzipped), no code-splitting.
- **Not TypeScript.** Pure JSX. `@types/react` was removed since there are no
  `.ts`/`.tsx` files.

## Testing

No test suite exists. Verify changes by booting locally and exercising the flow.
When touching auth, the pattern that has worked:

```js
// in execute(), against a running server
const u = `probe_${Date.now()}`;
await req("/auth/register", { username: u, email: `${u}@e.com`, password: "pw123456" });
```

Use a unique `Date.now()` suffix per run — the register endpoint is rate limited
per IP.

## Don't retry these

Already tried and failed; the reasoning is above so you don't repeat it:

- Deploying to Vercel from the repo root
- `uvicorn backend.main:app` from the repo root
- A Railway start command without `sh -c`
- Relying on a locally-installed package that's absent from
  `requirements.txt` — `email-validator` was hand-installed into the venv and
  crashed production for hours. **Install into a throwaway venv and boot the app
  before assuming a deploy will work.**
- `vercel deploy` from the repo root when `render.yaml` exists

## Git

- Branch: `main`. Commits are authored as *Success Joseph Ibemgbo*.
- Vercel and Railway both auto-deploy on push to `main`.
- The project started as a Wails/Go desktop app; that path was abandoned and the
  Go files were deleted. The app is web-only. Don't reintroduce a desktop
  build target.
