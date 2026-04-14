# backend/app.py — Flask app factory and blueprint registration
from __future__ import annotations

import logging
import logging.config

from flask import Flask
from flask_cors import CORS

from db import ensure_schema


def _configure_logging() -> None:
    """Set up structured logging for the application."""
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": "INFO",
            "handlers": ["console"],
        },
        "loggers": {
            # Quiet noisy werkzeug request logs in tests
            "werkzeug": {"level": "WARNING"},
        },
    })
from routes.health import health_bp
from routes.data import data_bp
from routes.analytics import analytics_bp
from routes.deep_analytics import deep_analytics_bp
from routes.video import video_bp
from routes.batch import batch_bp
from routes.profile import profile_bp
from routes.zones import zones_bp
from routes.calibration import calibration_bp
from routes.websocket import websocket_bp, init_sock


def create_app():
    """Create and configure the Flask application."""
    _configure_logging()
    application = Flask(__name__)
    application.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB upload limit

    CORS(
        application,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3003",
            "http://127.0.0.1:3003",
            "http://localhost:3004",
            "http://127.0.0.1:3004",
        ],
    )

    # Register all blueprints (no URL prefix — routes stay the same)
    application.register_blueprint(health_bp)
    application.register_blueprint(data_bp)
    application.register_blueprint(analytics_bp)
    application.register_blueprint(deep_analytics_bp)
    application.register_blueprint(video_bp)
    application.register_blueprint(batch_bp)
    application.register_blueprint(profile_bp)
    application.register_blueprint(zones_bp)
    application.register_blueprint(calibration_bp)
    application.register_blueprint(websocket_bp)

    # Attach flask-sock and register /ws/positions WebSocket route
    init_sock(application)

    return application


# Initialize schema and create the app at import time (matches original behavior)
ensure_schema()
app = create_app()
