# backend/main.py — Thin entry point (re-exports for backwards compatibility)
#
# Tests and other modules import from here:
#   from main import app, db, ensure_schema, DB
#   main.DB = "path"  (tests override the DB path)
#
import db as _db_module
from db import db, ensure_schema  # noqa: F401
from app import app  # noqa: F401
import sys as _sys


# Property-like access for DB: reading main.DB returns db.DB,
# setting main.DB sets db.DB. This keeps test fixtures working.
class _MainModule(_sys.modules[__name__].__class__):
    @property
    def DB(self):
        return _db_module.DB

    @DB.setter
    def DB(self, value):
        _db_module.DB = value


_sys.modules[__name__].__class__ = _MainModule


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
