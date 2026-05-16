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
echo  Accepts: FLM-TV-Schedule*.json
echo           FLM-TV-Schedule*.m3u
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
        echo  ERROR: Python not found. Install from python.org
        pause & exit /b 1
    )
    set PYTHON=py
) else (
    set PYTHON=python
)
echo  Python: OK

REM --- Check update_schedule.py ---
if not exist "%~dp0update_schedule.py" (
    echo  ERROR: update_schedule.py not found here.
    pause & exit /b 1
)
echo  update_schedule.py: OK

REM --- Check schedule.html ---
if not exist "%~dp0schedule.html" (
    echo  ERROR: schedule.html not found here.
    echo  Copy schedule.html from Documents\GitHub\flm-tv\ into this folder.
    pause & exit /b 1
)
echo  schedule.html: OK

REM --- Find input file (JSON preferred over M3U, newest first) ---
set INPUTFILE=
set INPUTTYPE=

REM Look for JSON first
for /f "delims=" %%i in ('dir /b /o-d "%~dp0FLM-TV-Schedule*.json" 2^>nul') do (
    if not defined INPUTFILE (
        set INPUTFILE=%%i
        set INPUTTYPE=JSON
    )
)

REM If no JSON, look for M3U
if not defined INPUTFILE (
    for /f "delims=" %%i in ('dir /b /o-d "%~dp0FLM-TV-Schedule*.m3u" 2^>nul') do (
        if not defined INPUTFILE (
            set INPUTFILE=%%i
            set INPUTTYPE=M3U
        )
    )
)

REM Also accept plain *.m3u names
if not defined INPUTFILE (
    for /f "delims=" %%i in ('dir /b /o-d "%~dp0*.m3u" 2^>nul') do (
        if not defined INPUTFILE (
            set INPUTFILE=%%i
            set INPUTTYPE=M3U
        )
    )
)

if not defined INPUTFILE (
    echo  ERROR: No schedule file found in this folder.
    echo.
    echo  Drop one of these into this folder then try again:
    echo    FLM-TV-Schedule.json   (from FLM Scheduler - Export JSON)
    echo    FLM-TV-Schedule.m3u    (from vMix - Export playlist)
    echo.
    pause & exit /b 1
)

echo  Input file : %INPUTFILE%
echo  File type  : %INPUTTYPE%
echo.
echo  ================================
echo   Running update...
echo  ================================
echo.

%PYTHON% "%~dp0update_schedule.py" "%~dp0%INPUTFILE%" "%~dp0schedule.html"

if %errorlevel% neq 0 (
    echo.
    echo  FAILED. See error above.
    pause & exit /b 1
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
        echo  Live on flmtv.com/schedule.html
    )
)

echo.
echo  Finished. Press any key to close.
pause >nul
