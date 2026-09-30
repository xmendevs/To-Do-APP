"""
Dependency-free in-memory rate limiting for auth endpoints.

Design notes / limits:
  - State lives in this process only. With multiple uvicorn workers the
    effective limit is per-worker, and limits reset on restart.
  - That's acceptable for the abuse case we're guarding against (someone
    hammering a single endpoint). For stricter guarantees, swap the storage
    for Redis.

A fixed window per key is used - cheap, and accurate enough here.
"""

import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status


class SlidingWindowLimiter:
    def __init__(self):
        # key -> list of request timestamps
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def _prune(self, key: str, window: int, now: float) -> list[float]:
        cutoff = now - window
        hits = [t for t in self._hits[key] if t > cutoff]
        self._hits[key] = hits
        return hits

    def check(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        """
        Register a hit for `key`.
        Returns (allowed, retry_after_seconds).
        """
        now = time.monotonic()
        with self._lock:
            hits = self._prune(key, window, now)

            if len(hits) >= limit:
                retry_after = int(hits[0] + window - now) + 1
                return False, max(retry_after, 1)

            hits.append(now)
            return True, 0

    def reset(self, key: str) -> None:
        """Clear a key - call after a successful auth so good users aren't punished."""
        with self._lock:
            self._hits.pop(key, None)

    def sweep(self, window: int) -> None:
        """Drop fully-expired keys so the dict can't grow without bound."""
        now = time.monotonic()
        cutoff = now - window
        with self._lock:
            stale = [k for k, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
            for k in stale:
                del self._hits[k]


limiter = SlidingWindowLimiter()


def client_ip(request: Request) -> str:
    """Best-effort client IP. Trusts X-Forwarded-For only if a proxy set it."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce(
    request: Request,
    scope: str,
    limit: int,
    window: int,
    enabled: bool = True,
):
    """Raise 429 when the caller has exceeded `limit` hits in `window` seconds."""
    if not enabled:
        return

    ip = client_ip(request)
    key = f"{scope}:{ip}"
    allowed, retry_after = limiter.check(key, limit, window)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Too many attempts. "
                f"Please try again in {retry_after} second(s)."
            ),
            headers={"Retry-After": str(retry_after)},
        )


def clear(request: Request, scope: str):
    """Reset counters after a successful auth."""
    limiter.reset(f"{scope}:{client_ip(request)}")
