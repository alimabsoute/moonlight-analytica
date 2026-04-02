# backend/helpers.py — Shared helper functions for route modules
from __future__ import annotations

from typing import Tuple

from flask import request


def parse_source() -> str:
    """Parse ?source=live|batch|all from query string. Default 'all'."""
    s = (request.args.get("source") or "all").strip().lower()
    return s if s in ("live", "batch", "all") else "all"


def source_filter(table: str = "") -> Tuple[str, list]:
    """Return (SQL fragment, params) for source filtering."""
    src = parse_source()
    prefix = f"{table}." if table else ""
    if src == "all":
        return "", []
    return f" AND {prefix}source = ?", [src]


def parse_hours(default: float = 168.0) -> float:
    """
    Parse ?hours=... from the query string.
    Accepts decimals (e.g. 0.167) and shorthands like 10m, 24h, 7d.
    Falls back to `default` on bad/missing input.
    """
    raw = request.args.get("hours")
    if raw is None:
        return float(default)

    v = str(raw).strip().lower()
    try:
        if v.endswith("m"):  # minutes, e.g. 10m
            return float(v[:-1]) / 60.0
        if v.endswith("h"):  # hours, e.g. 24h
            return float(v[:-1])
        if v.endswith("d"):  # days, e.g. 7d
            return float(v[:-1]) * 24.0
        return float(v)  # plain number supports decimals like 0.167
    except (TypeError, ValueError):
        return float(default)
