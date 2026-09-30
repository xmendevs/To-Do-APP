"""
Application configuration.

All environment-specific settings live here so nothing sensitive is hardcoded
and there's a single place to validate production readiness.
"""

import os
import secrets
import warnings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# ── Environment ───────────────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT in {"production", "prod"}


# ── Secret key ───────────────────────────────────────────────────────────────
def _load_secret_key() -> str:
    """
    Resolve the JWT signing key.

    Order of preference:
      1. SECRET_KEY env var            (required in production)
      2. .secret_key file on disk      (stable dev default, gitignored)
      3. fresh random value            (last resort; tokens die on restart)

    A hardcoded fallback is deliberately NOT used - a committed secret means
    anyone with the repo can mint valid tokens for any account.
    """
    env_key = os.getenv("SECRET_KEY", "").strip()
    if env_key:
        return env_key

    if IS_PRODUCTION:
        raise RuntimeError(
            "SECRET_KEY must be set in production. Generate one with:\n"
            "  python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )

    key_file = BASE_DIR / ".secret_key"
    try:
        if key_file.exists():
            existing = key_file.read_text().strip()
            if existing:
                return existing

        generated = secrets.token_urlsafe(48)
        key_file.write_text(generated)
        # best-effort hardening; ignore failures on exotic filesystems
        try:
            os.chmod(key_file, 0o600)
        except OSError:
            pass

        warnings.warn(
            "SECRET_KEY not set - generated a development key at "
            f"{key_file.name}. Never rely on this outside local dev.",
            RuntimeWarning,
            stacklevel=2,
        )
        return generated
    except OSError as exc:
        warnings.warn(
            f"Could not persist a development secret key ({exc}). "
            "Using an in-memory key; all sessions reset when the server restarts.",
            RuntimeWarning,
            stacklevel=2,
        )
        return secrets.token_urlsafe(48)


SECRET_KEY = _load_secret_key()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


# ── CORS ─────────────────────────────────────────────────────────────────────
_DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def _load_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        if IS_PRODUCTION:
            raise RuntimeError(
                "CORS_ORIGINS must be set in production. Comma-separated, e.g.\n"
                '  CORS_ORIGINS="https://your-app.vercel.app"'
            )
        return _DEFAULT_DEV_ORIGINS

    origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    return origins or _DEFAULT_DEV_ORIGINS


CORS_ORIGINS = _load_cors_origins()


# ── Rate limiting ────────────────────────────────────────────────────────────
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").strip().lower() not in {
    "false",
    "0",
    "no",
}

LOGIN_RATE_LIMIT = int(os.getenv("LOGIN_RATE_LIMIT", "10"))      # attempts ...
LOGIN_RATE_WINDOW = int(os.getenv("LOGIN_RATE_WINDOW", "300"))   # ... per N seconds

REGISTER_RATE_LIMIT = int(os.getenv("REGISTER_RATE_LIMIT", "5"))
REGISTER_RATE_WINDOW = int(os.getenv("REGISTER_RATE_WINDOW", "3600"))


# ── Misc ─────────────────────────────────────────────────────────────────────
MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", "8"))
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "").strip() or "sqlite:///./todo.db"


def describe() -> str:
    """Safe-to-log summary. Never prints the secret."""
    return (
        f"environment={ENVIRONMENT} "
        f"cors_origins={CORS_ORIGINS} "
        f"rate_limit={'on' if RATE_LIMIT_ENABLED else 'off'} "
        f"login={LOGIN_RATE_LIMIT}/{LOGIN_RATE_WINDOW}s "
        f"jwt_expiry={ACCESS_TOKEN_EXPIRE_MINUTES}m "
        f"secret={'env' if os.getenv('SECRET_KEY') else 'local-file'}"
    )
