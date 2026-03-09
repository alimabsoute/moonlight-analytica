import sqlite3

conn = sqlite3.connect('janus.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM events')
total_events = cursor.fetchone()[0]
print(f'Total events: {total_events}')

cursor.execute('SELECT event_type, COUNT(*) FROM events GROUP BY event_type')
print('Events by type:')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]}')

cursor.execute('SELECT COUNT(*) FROM sessions')
total_sessions = cursor.fetchone()[0]
print(f'Total sessions: {total_sessions}')

if total_events > 0:
    cursor.execute('SELECT * FROM events ORDER BY timestamp DESC LIMIT 5')
    print('\nRecent events:')
    for row in cursor.fetchall():
        print(f'  {row}')

if total_sessions > 0:
    cursor.execute('SELECT * FROM sessions ORDER BY entry_time DESC LIMIT 3')
    print('\nRecent sessions:')
    for row in cursor.fetchall():
        print(f'  {row}')

conn.close()
