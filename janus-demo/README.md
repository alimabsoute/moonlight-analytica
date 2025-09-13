# Janus Demo

A minimal visual counting application with FastAPI backend and React frontend.

## Features

- Session-based counting
- Real-time count tracking
- SQLite database storage
- Responsive web interface
- Docker containerization

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start both services
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /sessions` - List all sessions
- `POST /sessions` - Create new session
- `GET /sessions/{id}/counts` - Get session counts
- `POST /sessions/{id}/counts` - Add count to session

## Usage

1. Create a new counting session
2. Select the session from the list
3. Use +1, +10, -1, -10 buttons to count
4. View count history in real-time

## Project Structure

```
janus-demo/
├── backend/           # FastAPI server
│   ├── main.py       # API endpoints
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React app
│   ├── src/
│   │   ├── App.jsx   # Main component
│   │   └── App.css   # Styles
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```