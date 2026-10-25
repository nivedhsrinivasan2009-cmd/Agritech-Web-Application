# Gracia App - ngrok Tunnel Launcher (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File start-tunnels.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Gracia App - ngrok Tunnel Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
    Write-Host "[ERROR] ngrok is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download"
    Write-Host "  2. Or install via: winget install ngrok.ngrok"
    Write-Host "  3. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting ngrok tunnels..." -ForegroundColor Green
Write-Host ""

# Kill any existing ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# Start frontend tunnel (port 3001)
Write-Host "[1/2] Starting frontend tunnel on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "3001" -WindowStyle Minimized

# Wait for tunnel to establish
Start-Sleep -Seconds 3

# Start AI backend tunnel (port 3002)
Write-Host "[2/2] Starting AI backend tunnel on port 3002..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "3002" -WindowStyle Minimized

# Wait for tunnels to establish
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Fetching tunnel URLs..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Try to get tunnel URLs from ngrok API
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop

    Write-Host "YOUR NGROK URLS:" -ForegroundColor Green
    Write-Host "----------------" -ForegroundColor Green

    foreach ($tunnel in $tunnels.tunnels) {
        $port = $tunnel.config.addr -replace '.*:', ''
        $url = $tunnel.public_url

        if ($port -eq "3001") {
            Write-Host ""
            Write-Host "FRONTEND (Port 3001):" -ForegroundColor Cyan
            Write-Host "  $url" -ForegroundColor White
            $frontendUrl = $url
        }
        elseif ($port -eq "3002") {
            Write-Host ""
            Write-Host "AI BACKEND (Port 3002):" -ForegroundColor Cyan
            Write-Host "  $url" -ForegroundColor White
            $aiUrl = $url
        }
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   NEXT STEPS" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Update your .env file:" -ForegroundColor Yellow
    if ($aiUrl) {
        Write-Host "   VITE_AI_API_URL=$aiUrl/api/ai" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "2. Restart your dev servers (frontend and backend)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Access your app from any device using:" -ForegroundColor Yellow
    if ($frontendUrl) {
        Write-Host "   $frontendUrl" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "4. View ngrok dashboard: http://localhost:4040" -ForegroundColor Yellow

} catch {
    Write-Host "Could not fetch tunnel URLs automatically." -ForegroundColor Yellow
    Write-Host "Check the ngrok windows or visit: http://localhost:4040" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Enter to close this window (tunnels will keep running)..." -ForegroundColor Gray
Read-Host
