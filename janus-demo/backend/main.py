import sqlite3, json, math, random
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

DB = "janus.db"

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174"])

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        cur = conn.cursor()
        cur.executescript("""
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        CREATE TABLE IF NOT EXISTS sessions(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metrics TEXT
        );
        CREATE TABLE IF NOT EXISTS counts(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          count_value INTEGER NOT NULL,
          FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
        CREATE INDEX IF NOT EXISTS idx_counts_session_ts ON counts(session_id, timestamp);
        CREATE UNIQUE INDEX IF NOT EXISTS ux_counts_sid_ts ON counts(session_id, timestamp);
        """)
    return True

def ensure_session(name="Demo Session"):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("INSERT OR IGNORE INTO sessions(name, metrics) VALUES(?,?)", (name, json.dumps({})))
        conn.commit()
        row = cur.execute("SELECT id FROM sessions WHERE name=?", (name,)).fetchone()
        return row["id"]

def seed_hourly(session_id: int, days: int = 14):
    with db() as conn:
        cur = conn.cursor()
        now = datetime.now(tz=timezone.utc).replace(minute=0, second=0, microsecond=0)
        start = now - timedelta(days=days)
        def season(h):
            base = 0.6 + 0.4*math.exp(-((h-13)/4)**2)
            bump = 0.15*math.exp(-((h-12)/2)**2) + 0.08*math.exp(-((h-18)/3)**2)
            return base + bump
        rows, dt = [], start
        random.seed(42)
        while dt <= now:
            f = season(dt.hour)
            value = int(max(1, 20*f + random.uniform(-4, 4)))
            rows.append((session_id, dt.isoformat(), value))
            dt += timedelta(hours=1)
        cur.executemany("INSERT OR IGNORE INTO counts(session_id, timestamp, count_value) VALUES (?,?,?)", rows)
        conn.commit()

@app.route("/health")
def health(): return jsonify({"service":"janus-api","status":"healthy","timestamp":datetime.now().isoformat()})

@app.route("/seed_demo", methods=["POST"])
def seed_demo():
    init_db()
    sid = ensure_session("Demo Session")
    seed_hourly(sid, days=14)
    return jsonify({"ok": True, "session_id": sid, "seeded_days": 14})

@app.route("/sessions")
def get_sessions():
    with db() as conn:
        rows = conn.execute("SELECT id,name,created_at,metrics FROM sessions ORDER BY created_at DESC").fetchall()
        return jsonify([dict(r) for r in rows])

@app.route("/sessions", methods=["POST"])
def create_session():
    data = request.get_json() or {}
    name = data.get("name")
    if not name: return jsonify({"error":"Session name is required"}), 400
    with db() as conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO sessions(name, metrics) VALUES(?,?)", (name, json.dumps({})))
        sid = cur.lastrowid; conn.commit()
        return jsonify({"id": sid, "name": name, "created_at": datetime.now().isoformat()})

@app.route("/sessions/<int:sid>/counts")
def get_counts(sid: int):
    with db() as conn:
        rows = conn.execute("SELECT timestamp, count_value FROM counts WHERE session_id=? ORDER BY timestamp", (sid,)).fetchall()
        return jsonify([{"timestamp": r["timestamp"], "value": r["count_value"]} for r in rows])

@app.route("/sessions/<int:sid>/counts", methods=["POST"])
def add_count(sid: int):
    data = request.get_json() or {}
    if "count_value" not in data: return jsonify({"error":"count_value is required"}), 400
    with db() as conn:
        cur = conn.cursor()
        ok = cur.execute("SELECT id FROM sessions WHERE id=?", (sid,)).fetchone()
        if not ok: return jsonify({"error":"Session not found"}), 404
        cur.execute("INSERT INTO counts(session_id,timestamp,count_value) VALUES (?,?,?)",
                    (sid, datetime.now(timezone.utc).isoformat(), int(data["count_value"])))
        conn.commit()
        return jsonify({"session_id": sid, "count_value": int(data["count_value"])})

def last_hours_series(hours: int = 168):
    with db() as conn:
        last = conn.execute("SELECT timestamp FROM counts ORDER BY timestamp DESC LIMIT 1").fetchone()
        if not last: return []
        last_ts = last["timestamp"]
        rows = conn.execute("""
          SELECT substr(timestamp,1,13) as hour, AVG(count_value) as avg_val, MAX(count_value) as peak, SUM(count_value) as throughput
          FROM counts
          WHERE timestamp > datetime(?, '-' || ? || ' hours')
          GROUP BY substr(timestamp,1,13)
          ORDER BY hour ASC
        """, (last_ts, hours)).fetchall()
        return rows

@app.route("/count", methods=["POST"])
def record_count():
    data = request.get_json()
    if not data or "count" not in data:
        return jsonify({"error": "Missing 'count' field"}), 400
    
    # Get or create default session
    sid = ensure_session("Tracker Session")
    
    with db() as conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO counts(session_id,timestamp,count_value) VALUES (?,?,?)",
                    (sid, datetime.now(timezone.utc).isoformat(), int(data["count"])))
        conn.commit()
        return jsonify({"session_id": sid, "count_value": int(data["count"]), "status": "recorded"})

@app.route("/kpis")
def kpis():
    hours = int(request.args.get("hours", 168))
    rows = last_hours_series(hours)
    if not rows: return jsonify({"error":"no data"}), 404
    avg_people = sum(r["avg_val"] for r in rows)/len(rows)
    peak_people = max(r["peak"] for r in rows)
    throughput = sum(r["throughput"] for r in rows)
    return jsonify({
        "people_avg": round(avg_people,2),
        "people_peak": int(peak_people),
        "throughput_total": int(throughput),
        "throughput_per_hr": round(throughput/len(rows),2)
    })

@app.route("/series.csv")
def series_csv():
    hours = int(request.args.get("hours", 168))
    rows = last_hours_series(hours)
    if not rows: return Response("hour,avg_val,peak,throughput\n", mimetype="text/csv")
    header = "hour,avg_val,peak,throughput\n"
    body = "\n".join([f"{r['hour']}:00,{round(r['avg_val'],2)},{int(r['peak'])},{int(r['throughput'])}" for r in rows])
    return Response(header+body+"\n", mimetype="text/csv")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000, debug=True)