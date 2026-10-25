@echo off
echo ==========================================
echo    Gracia App - Full Stack Launcher
echo ==========================================
echo.
echo This script will start:
echo   1. Frontend dev server (port 3001)
echo   2. ngrok tunnels for remote access
echo.
echo NOTE: Make sure you have:
echo   - Node.js installed
echo   - ngrok installed and authenticated
echo   - Ollama running locally (for AI features)
echo.

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

:: Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] ngrok is not installed
    echo Download from: https://ngrok.com/download
    pause
    exit /b 1
)

echo Starting services...
echo.

:: Start frontend dev server
echo [1/3] Starting Frontend (port 3001)...
start "Gracia-Frontend" cmd /k "cd /d %~dp0 && npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

:: Start ngrok for frontend
echo [2/3] Starting ngrok tunnel for Frontend...
start "ngrok-frontend" cmd /k "ngrok http 3001"

timeout /t 2 /nobreak >nul

:: Start ngrok for AI backend (if running locally)
echo [3/3] Starting ngrok tunnel for AI Backend...
start "ngrok-ai-backend" cmd /k "ngrok http 3002"

echo.
echo ==========================================
echo   All services started!
echo ==========================================
echo.
echo Windows opened:
echo   - Gracia-Frontend: React dev server
echo   - ngrok-frontend: Tunnel for web app
echo   - ngrok-ai-backend: Tunnel for AI (if using local Ollama)
echo.
echo Visit http://localhost:4040 to see your ngrok URLs
echo.
echo IMPORTANT: Update .env with your new ngrok AI URL
echo            then restart the frontend server.
echo.
pause
