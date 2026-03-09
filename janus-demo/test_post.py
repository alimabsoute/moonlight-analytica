#!/usr/bin/env python3
"""
Simple test script to verify POST endpoints work
"""
import requests
from datetime import datetime, timezone

backend = "http://localhost:8000"

# Test event posting
event_payload = {
    "event_type": "entry",
    "person_id": "TEST_999",
    "zone_id": 1,
    "direction": "in",
    "confidence": 0.99,
    "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds")
}

print("=" * 60)
print("Testing POST /events")
print("=" * 60)
print(f"Payload: {event_payload}")

try:
    r = requests.post(f"{backend}/events", json=event_payload, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
    r.raise_for_status()
    print("✓ Event POST successful")
except Exception as e:
    print(f"✗ Event POST failed: {e}")

# Test session posting
session_payload = {
    "person_id": "TEST_999",
    "entry_time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "exit_time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "dwell_seconds": 42,
    "zone_path": '["entrance", "main_floor"]',
    "converted": 1
}

print("\n" + "=" * 60)
print("Testing POST /sessions")
print("=" * 60)
print(f"Payload: {session_payload}")

try:
    r = requests.post(f"{backend}/sessions", json=session_payload, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
    r.raise_for_status()
    print("✓ Session POST successful")
except Exception as e:
    print(f"✗ Session POST failed: {e}")

print("\n" + "=" * 60)
print("Now run: cd C:/Users/alima/janus-demo/backend && python check_db.py")
print("=" * 60)
