# backend/rate_limit.py — Simple in-memory rate limiter for write endpoints.
#
# Uses a token-bucket approach per (IP, endpoint) key.
# Disabled automatically when Flask's TESTING flag is True so test suites
# aren't affected by per-IP throttle windows.
from __future__ import annotations

import threading
import time
from collections import deque
from functools import wraps
from typing import Callable

from flask import request, jsonify, current_app

_lock = threading.Lock()
# Maps (remote_addr, endpoint) → deque of request timestamps
_windows: dict[tuple[str, str], deque] = {}


def rate_limit(max_calls: int, window_seconds: int = 60) -> Callable:
    """
    Decorator: allow at most *max_calls* requests per *window_seconds* per client IP.

    Skipped entirely when ``app.testing`` is True.

    Usage::

        @bp.post("/some-endpoint")
        @rate_limit(60)          # 60 req/min
        def my_view():
            ...
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if current_app.testing:
                return fn(*args, **kwargs)

            ip = request.remote_addr or "unknown"
            key = (ip, request.endpoint or fn.__name__)
            now = time.monotonic()
            cutoff = now - window_seconds

            with _lock:
                bucket = _windows.setdefault(key, deque())
                # Drop timestamps outside the current window
                while bucket and bucket[0] < cutoff:
                    bucket.popleft()

                if len(bucket) >= max_calls:
                    retry_after = int(window_seconds - (now - bucket[0])) + 1
                    resp = jsonify({
                        "error": "rate limit exceeded",
                        "retry_after_seconds": retry_after,
                    })
                    resp.status_code = 429
                    resp.headers["Retry-After"] = str(retry_after)
                    return resp

                bucket.append(now)

            return fn(*args, **kwargs)
        return wrapper
    return decorator
