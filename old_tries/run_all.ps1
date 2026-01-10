Write-Host "Starting TechFiesta Mental Health App..." -ForegroundColor Cyan

# 1. Redis (Try to start if not running, assuming default location or path)
if (Get-Command redis-server -ErrorAction SilentlyContinue) {
    Write-Host "[1/5] Starting Redis..." -ForegroundColor Yellow
    # Redis usually runs as a service or background process on Windows, 
    # but strictly speaking we can try to launch it if not present.
    # Start-Process "redis-server" -NoNewWindow
} else {
    Write-Host "WARNING: redis-server command not found. Ensure Redis is running." -ForegroundColor Red
}

# 2. Start Backend Services (Flask, FastAPI, Celery) in ONE Window
Write-Host "[2/5] Starting Backend Services (Flask, FastAPI, Celery)..." -ForegroundColor Yellow
$backendCmd = 'npx -y concurrently -k -n \"FLASK,FASTAPI,CELERY\" -c \"cyan,green,yellow\" \"python main.py\" \"uvicorn models.api:app --host 0.0.0.0 --port 8000\" \"celery -A utils.celery_app.celery worker --pool=solo --loglevel=info\"'
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# 3. React Frontend
Write-Host "[3/5] Starting React Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src; npm run dev"

Write-Host "==================================================" -ForegroundColor Green
Write-Host "   Services Launched!"
Write-Host "   - Backend Terminal: Flask, FastAPI, Celery (Combined)"
Write-Host "   - Frontend Terminal: React"
Write-Host "   - Frontend: http://localhost:5173"
Write-Host "   - Flask API: http://localhost:2323"
Write-Host "   - FastAPI: http://localhost:8000"
Write-Host "=================================================="
