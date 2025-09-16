# 🔍 Janus Backend — Quickstart, API & Smoke Test

**Open the frontend:** http://localhost:5173/#analytics

## 🎯 Production Features
- ✅ **Flexible Time Parsing**: `10m`, `24h`, `7d`, `0.167`
- ✅ **Modern Python**: context managers, type hints, timezone-aware
- ✅ **Clean Schema**: simple `counts` table
- ✅ **CORS Ready**: frontend integration enabled
- ✅ **Production Stable**: no schema conflicts or parsing errors

**Status:** 🟢 Production Ready

---

## Run the backend (Terminal 1)
```bash
python janus-demo/backend/main.py
```

## One-time seed + quick checks (Terminal 2)
```bash
# Seed 14 days of demo data
curl -s -X POST http://localhost:8000/seed_demo

# Health
curl -s http://localhost:8000/health

# KPIs for last 24h (JSON with avg_people, peak_people, throughput, hours)
curl -s "http://localhost:8000/kpis?hours=24h"

# KPIs for last 10 minutes (works after you add a fresh point)
curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" http://localhost:8000/count
curl -s "http://localhost:8000/kpis?hours=10m"

# CSV for last 24h (first few lines)
curl -s "http://localhost:8000/series.csv?hours=24h"
```

---

## Windows: batch smoke test (optional)
Save as `janus-demo\verify_backend.bat` and run it.
```bat
@echo off
setlocal

echo === 1) Seed demo data =========================
curl -s -X POST http://localhost:8000/seed_demo
echo.&echo.

echo === 2) Health check ===========================
curl -s http://localhost:8000/health
echo.&echo.

echo === 3) KPIs for last 24h ======================
curl -s "http://localhost:8000/kpis?hours=24h"
echo.&echo.

echo === 4) CSV for last 24h (header only) =========
for /f "delims=" %%A in ('curl -s "http://localhost:8000/series.csv?hours=24h"') do (
  echo %%A
  goto :aftercsv
)
:aftercsv
echo.&echo.

echo === 5) Prove sub-hour windows =================
echo Posting a fresh count so 10m window has data...
curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" http://localhost:8000/count
echo.&echo.

echo KPIs for last 10m:
curl -s "http://localhost:8000/kpis?hours=10m"
echo.&echo.

echo Done.
endlocal
```

---

## Endpoints
| Endpoint                 | Method | Description                                    | Example Response / Notes |
|--------------------------|--------|------------------------------------------------|--------------------------|
| `/health`                | GET    | Health probe                                   | `{"ok": true}` |
| `/seed_demo`             | POST   | Seed 14 days of hourly demo data               | `{"ok": true, "seeded_days": 14}` |
| `/count`                 | POST   | Append a datapoint                             | Body: `{"count_value": 42}` → `{"timestamp":"…+00:00","count_value":42}` |
| `/kpis?hours=<window>`   | GET    | KPIs over window                               | `{"avg_people": 41.17, "peak_people": 56, "throughput": 910, "hours": 24.0}` |
| `/series.csv?hours=<window>` | GET | CSV export                                     | Header: `timestamp,count_value,peak,throughput` |

### Time Format Support
| Format  | Example | Meaning                    |
|---------|---------|----------------------------|
| Minutes | `10m`   | 10 minutes                 |
| Hours   | `24h`   | 24 hours                   |
| Days    | `7d`    | 7 days                     |
| Decimal | `0.167` | 10 minutes (decimal hours) |
| Integer | `168`   | 168 hours (treated as h)   |

---

## Example Workflows
**Quick Demo Setup**
```bash
curl -s -X POST http://localhost:8000/seed_demo
curl -s "http://localhost:8000/kpis?hours=24h"
```

**Real-time Testing**
```bash
curl -s -H "Content-Type: application/json" -d '{"count_value":50}' http://localhost:8000/count
curl -s "http://localhost:8000/kpis?hours=10m"
```

**Data Export**
```bash
curl -s "http://localhost:8000/series.csv?hours=7d" > analytics_data.csv
```

---

## Troubleshooting
- `10m` returns `{"error":"no data"}`? Post a fresh datapoint first:
  ```bash
  curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" http://localhost:8000/count
  ```
- Changed schemas? Stop the server and let the app recreate `janus.db`, or delete it and reseed:
  ```bash
  rm -f janus-demo/backend/janus.db
  curl -s -X POST http://localhost:8000/seed_demo
  ```