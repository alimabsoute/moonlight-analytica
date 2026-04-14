"""
backend/routes/websocket.py — Real-time person position WebSocket feed.

Endpoint: GET /ws/positions  (HTTP Upgrade → WebSocket)

The edge agent pushes position updates via POST /api/positions/update.
Connected WebSocket clients receive JSON frames whenever new data arrives,
enabling ThreeJSRoom.jsx to render live person markers.

Frame format:
    {
      "persons": [{"id": int, "world_x": float, "world_y": float, "zone": str}, ...],
      "count":   int,
      "timestamp": float   (Unix epoch seconds)
    }
"""

from __future__ import annotations

import json
import threading
import time
from typing import Any

from flask import Blueprint, jsonify, request
from flask_sock import Sock

websocket_bp = Blueprint("websocket", __name__)

# Lazy-initialised Sock instance — attached to the app in create_app()
sock: Sock | None = None

# ---------------------------------------------------------------------------
# In-memory position cache (edge agent writes, WS clients read)
# ---------------------------------------------------------------------------
_cache_lock = threading.Lock()
_position_cache: list[dict] = []

# Connected WebSocket clients — set of ws objects
_clients_lock = threading.Lock()
_clients: set[Any] = set()


def init_sock(app) -> Sock:
    """Attach flask-sock to the app and register the WS route."""
    global sock
    sock = Sock(app)

    @sock.route("/ws/positions")
    def positions_ws(ws):
        """Stream person positions to a connected browser."""
        with _clients_lock:
            _clients.add(ws)
        try:
            # Send current snapshot immediately on connect
            ws.send(format_position_frame(get_position_cache()))
            # Keep connection alive; rely on push from _broadcast_to_clients
            while True:
                try:
                    # Block with timeout so the server can detect disconnects
                    msg = ws.receive(timeout=30)
                    if msg is None:
                        break  # client disconnected
                except Exception:
                    break
        finally:
            with _clients_lock:
                _clients.discard(ws)

    return sock


# ---------------------------------------------------------------------------
# Public helpers (used by tests and by POST /api/positions/update)
# ---------------------------------------------------------------------------

def format_position_frame(persons: list[dict]) -> str:
    """Serialise a list of person dicts into a JSON WebSocket frame."""
    return json.dumps({
        "persons":   persons,
        "count":     len(persons),
        "timestamp": time.time(),
    })


def update_position_cache(persons: list[dict]) -> None:
    """Replace the current position cache and push to all WS clients."""
    global _position_cache
    with _cache_lock:
        _position_cache = list(persons)
    _broadcast_to_clients(format_position_frame(persons))


def get_position_cache() -> list[dict]:
    """Return a snapshot of the current position cache."""
    with _cache_lock:
        return list(_position_cache)


def _broadcast_to_clients(payload: str) -> None:
    """Send payload to all connected WS clients; silently drop dead connections."""
    global _clients
    with _clients_lock:
        dead = set()
        for ws in list(_clients):
            try:
                ws.send(payload)
            except Exception:
                dead.add(ws)
        _clients -= dead


# ---------------------------------------------------------------------------
# REST endpoint — edge agent posts position updates here
# ---------------------------------------------------------------------------

@websocket_bp.route("/api/positions/update", methods=["POST"])
def positions_update():
    """
    Edge agent pushes real-time person positions here.

    Body (JSON):
        {"persons": [{"id": int, "world_x": float, "world_y": float, ...}, ...]}
    """
    data = request.get_json(silent=True) or {}
    persons = data.get("persons", [])

    if not isinstance(persons, list):
        return jsonify({"error": "persons must be a list"}), 400

    update_position_cache(persons)
    return jsonify({"ok": True, "count": len(persons)})


@websocket_bp.route("/api/positions/current", methods=["GET"])
def positions_current():
    """Return the current position cache as JSON (polling fallback)."""
    return jsonify({"persons": get_position_cache(), "count": len(get_position_cache())})
