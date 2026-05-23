@echo off
title FLM TV - Schedule Updater
color 0A

echo.
echo  ==========================================
echo    FLM TV SCHEDULE UPDATER
echo  ==========================================
echo.
echo  This will read FLM-TV-Schedule.json
echo  and update schedule.html automatically.
echo.
echo  Make sure these files are in the same folder:
echo    - FLM-TV-Schedule.json  (from your Scheduler)
echo    - schedule.html
echo    - update_schedule.py
echo.
pause

python "%~dp0update_schedule.py"
