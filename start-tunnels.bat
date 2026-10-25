@echo off
echo ==========================================
echo    Gracia App - ngrok Tunnel Launcher
echo ==========================================
echo.

:: Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] ngrok is not installed or not in PATH
    echo.
    echo To install ngrok:
    echo   1. Download from: https://ngrok.com/download
    echo   2. Unzip and add to PATH, or place in this folder
    echo   3. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN
    echo.
    pause
    exit /b 1
)

echo Starting ngrok tunnels...
echo.

:: Start frontend tunnel (port 3001)
echo [1/2] Starting frontend tunnel on port 3001...
start "ngrok-frontend" cmd /c "ngrok http 3001 --log=stdout"

:: Wait a moment for first tunnel to start
timeout /t 2 /nobreak >nul

:: Start AI backend tunnel (port 3002)
echo [2/2] Starting AI backend tunnel on port 3002...
start "ngrok-ai-backend" cmd /c "ngrok http 3002 --log=stdout"

echo.
echo ==========================================
echo   Tunnels are starting in separate windows
echo ==========================================
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. Copy the ngrok URLs from each window
echo    - Frontend URL (port 3001): Use this to access the app
echo    - AI Backend URL (port 3002): Update in .env file
echo.
echo 2. Update your .env file:
echo    VITE_AI_API_URL=https://YOUR-AI-NGROK-URL/api/ai
echo.
echo 3. Update vite.config.js allowedHosts with your frontend ngrok subdomain
echo.
echo 4. Restart your dev server after updating .env
echo.
echo Press any key to exit this launcher...
pause >nul
