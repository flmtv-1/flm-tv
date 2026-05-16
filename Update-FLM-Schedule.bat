@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title FLM TV Schedule Updater

echo.
echo  ================================
echo   FLM TV - Schedule Page Updater
echo   Channel 26.5 Las Vegas
echo  ================================
echo.
echo  Working folder:
echo  %~dp0
echo.
echo  Press any key to start...
pause >nul

echo.
echo  Checking files...
echo.

REM --- Check Python ---
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Python not found.
        echo  Install Python from python.org and try again.
        echo.
        pause
        exit /b 1
    )
    set PYTHON=py
) else (
    set PYTHON=python
)
echo  Python: OK

REM --- Check update_schedule.py ---
if not exist "%~dp0update_schedule.py" (
    echo  ERROR: update_schedule.py not found.
    echo  It must be in the same folder as this BAT file.
    echo.
    pause
    exit /b 1
)
echo  update_schedule.py: OK

REM --- Check schedule.html ---
if not exist "%~dp0schedule.html" (
    echo  ERROR: schedule.html not found.
    echo  Copy schedule.html into this folder:
    echo  %~dp0
    echo.
    pause
    exit /b 1
)
echo  schedule.html: OK

REM --- Find newest FLM-TV-Schedule*.json ---
set JSONFILE=
for /f "delims=" %%i in ('dir /b /o-d "%~dp0FLM-TV-Schedule*.json" 2^>nul') do (
    if not defined JSONFILE set JSONFILE=%%i
)

if not defined JSONFILE (
    echo  ERROR: No FLM-TV-Schedule*.json found in this folder.
    echo.
    echo  Steps:
    echo    1. Open the FLM Scheduler
    echo    2. Click Export then JSON
    echo    3. Save into this folder:
    echo       %~dp0
    echo    4. Run this BAT again
    echo.
    pause
    exit /b 1
)
echo  Schedule JSON: %JSONFILE%

echo.
echo  ================================
echo   Running update...
echo  ================================
echo.

%PYTHON% "%~dp0update_schedule.py" "%~dp0%JSONFILE%" "%~dp0schedule.html"

if %errorlevel% neq 0 (
    echo.
    echo  Update FAILED. See error above.
    echo.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   SUCCESS!
echo  ================================
echo.

set /p DOPUSH="  Push to GitHub now? (Y/N): "
if /i "%DOPUSH%"=="Y" (
    echo.
    echo  Pushing to GitHub...
    git -C "%~dp0" add schedule.html
    git -C "%~dp0" commit -m "Update schedule %date%"
    git -C "%~dp0" push
    if %errorlevel% neq 0 (
        echo  Git push failed - check your git setup.
    ) else (
        echo  Done - live on flmtv.com/schedule.html
    )
)

echo.
echo  Finished. Press any key to close.
pause >nul
