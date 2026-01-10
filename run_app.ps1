Write-Host "Starting TechFiesta Mental Health App..."

# Start Ollama in the current terminal (VS Code)
Write-Host "Launching Ollama Server in VS Code terminal..."
Start-Job -ScriptBlock { ollama serve } | Out-Null

# Start Backend in a new PowerShell window
Write-Host "Launching Backend (Python)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {python main.py}"

# Start Frontend in a new PowerShell window
Write-Host "Launching Frontend (Vite)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {cd src; npm run dev}"

# Wait a moment for servers to initialize
Write-Host "Waiting for servers to start..."
Start-Sleep -Seconds 5

# Open the application in the default browser
Write-Host "Opening Application in Browser..."
Start-Process "http://localhost:5173"

Write-Host "App is running! Check the other windows for logs."
