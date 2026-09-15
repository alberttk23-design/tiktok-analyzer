#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================="
echo " Starting TikTok Creative AI v2.0"
echo "================================="

cd "$PROJECT_DIR"

# Clean up any lingering processes on ports 8000 and 5173
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Check Ollama service
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✓ Ollama is active (qwen3-vl:4b available)"
else
    echo "Notice: Ollama not detected on localhost:11434, starting ollama serve..."
    ollama serve > /dev/null 2>&1 &
    sleep 2
fi

echo "Starting Backend (FastAPI + SQLite)..."
source .venv/bin/activate
uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

echo "Starting Frontend (React + Vite)..."
cd frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

echo ""
echo "================================="
echo " APP IS RUNNING"
echo " Backend:  http://127.0.0.1:8000"
echo " Frontend: http://localhost:5173"
echo " Backend PID:  $BACKEND_PID"
echo " Frontend PID: $FRONTEND_PID"
echo " Press CTRL+C to stop all servers"
echo "================================="

# Trap exit signals to kill children cleanly
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Open browser
open http://localhost:5173 2>/dev/null || true

wait
