import sqlite3
from datetime import datetime, timedelta
import random

db = sqlite3.connect('janus.db')
cur = db.cursor()

# Clear existing data
cur.execute('DELETE FROM counts')

# Generate 2 weeks of data (every 10 minutes)
now = datetime.now()
start = now - timedelta(days=14)
current = start

count = 0
while current <= now:
    # Vary counts by time of day (higher during business hours)
    hour = current.hour
    base_count = 5
    if 9 <= hour <= 17:
        base_count = 15
    elif 18 <= hour <= 22:
        base_count = 10

    # Add some randomness
    value = max(0, base_count + random.randint(-5, 10))

    cur.execute(
        'INSERT INTO counts (timestamp, count_value) VALUES (?, ?)',
        (current.isoformat(), value)
    )

    count += 1
    current += timedelta(minutes=10)

db.commit()
print(f'Seeded {count} records over 2 weeks')
print(f'From {start} to {now}')
