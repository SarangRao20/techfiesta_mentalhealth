#!/bin/bash

echo "Starting TechFiesta Mental Health App..."

# Kill running processes on exit
trap "kill 0" EXIT

# Start Ollama
echo "Launching Ollama Server..."
ollama serve &

# Start Backend
echo "Launching Backend (Python)..."
python main.py &

# Start Frontend
echo "Launching Frontend (Vite)..."
cd src
npm run dev &

# Wait a moment for servers to initialize
echo "Waiting for servers to start..."
sleep 5

# Open the application in the default browser
echo "Opening Application in Browser..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start http://localhost:5173
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
else
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173
    else
        echo "Could not detect browser opener. Please open http://localhost:5173 manually."
    fi
fi

# Keep the script running to maintain background processes
wait
