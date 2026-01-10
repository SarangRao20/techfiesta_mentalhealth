#!/bin/bash

# run_all.sh - Start Full Stack (Flask, FastAPI, Celery, React, Redis)

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "=================================================="
echo "   TechFiesta Mental Health App - Startup Script"
echo "=================================================="

# 1. Start Redis (Optional check, assume running or start if possible)
# Note: On Windows/WSL, redis-server might need to be started manually or via service
echo "[1/5] Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo "WARNING: redis-cli not found. Ensure Redis is running manually."
else
    if redis-cli ping > /dev/null 2>&1; then
        echo "Redis is running."
    else
        echo "Redis is NOT running. Attempting to start..."
        redis-server &
        sleep 2
    fi
fi

# 2. Start Celery Worker
echo "[2/5] Starting Celery Worker..."
# Setting pool to solo for Windows compatibility if needed, or default
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OS" == "Windows_NT" ]]; then
    celery -A utils.celery_app.celery worker --pool=solo --loglevel=info &
else
    celery -A utils.celery_app.celery worker --loglevel=info &
fi

# 3. Start FastAPI (Ollama/AI Backend)
echo "[3/5] Starting FastAPI (Port 8000)..."
uvicorn models.api:app --host 0.0.0.0 --port 8000 &

# 4. Start Flask (Main Backend)
echo "[4/5] Starting Flask API (Port 2323)..."
python main.py &

# 5. Start React Frontend
echo "[5/5] Starting React Frontend..."
cd src
npm run dev &
cd ..

echo "=================================================="
echo "   All Services Started!"
echo "   - Frontend: http://localhost:5173"
echo "   - Flask API: http://localhost:2323"
echo "   - FastAPI: http://localhost:8000"
echo "=================================================="
echo "Press Ctrl+C to stop all services."

# Wait indefinitely
wait
