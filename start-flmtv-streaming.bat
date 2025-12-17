@echo off
REM FLM TV - Start Streaming Services
REM Run this as Administrator

echo ========================================
echo FLM TV Streaming Services Launcher
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [1/4] Starting Nginx HLS Server...
cd C:\nginx
start "Nginx HLS Server" nginx.exe -c nginx-vmix-hls.conf
timeout /t 2 /nobreak >nul
echo       Nginx started on port 8080
echo.

echo [2/4] Checking vMix HLS Output Directory...
if not exist "C:\vMix\HLS" (
    mkdir "C:\vMix\HLS"
    echo       Created HLS directory
) else (
    echo       HLS directory exists
)
echo.

echo [3/4] Opening vMix...
echo       Please configure vMix HLS output to: C:\vMix\HLS
start "" "C:\Program Files (x86)\vMix\vMix64.exe"
timeout /t 3 /nobreak >nul
echo.

echo [4/4] Testing Stream Access...
echo       Local Test: http://localhost:8080/hls/FLMTV.m3u8
echo       Public Test: http://flmtv26.duckdns.org:8080/hls/FLMTV.m3u8
echo.

echo ========================================
echo Services Started Successfully!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. In vMix, start HLS streaming to C:\vMix\HLS
echo 2. Wait 10-15 seconds for segments to generate
echo 3. Test stream in VLC: http://localhost:8080/hls/FLMTV.m3u8
echo 4. If working, test externally: http://flmtv26.duckdns.org:8080/hls/FLMTV.m3u8
echo.
echo To stop services:
echo - Close vMix
echo - Run: taskkill /F /IM nginx.exe
echo.
pause
