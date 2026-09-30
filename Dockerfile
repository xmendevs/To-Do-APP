# Backend image. Railway, Fly.io, and most container hosts look for this at the
# repo root and prefer it over any start command, which avoids the
# "no requirements.txt at root" fallback that produced a literal
# `--port '$PORT'` crash on Railway.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Platforms inject PORT. Shell form (no JSON array) so ${PORT:-8000} is
# actually expanded by /bin/sh; exec-form would pass the literal string.
# config.py refuses to boot in production without SECRET_KEY + CORS_ORIGINS.
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers
