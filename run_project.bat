@echo off
TITLE CampusWay Runner
echo ==========================================
echo    CampusWay Local Server Starting...
echo ==========================================

:: Start Backend (Forced to Port 5003 to avoid local conflicts)
start cmd /k "echo Starting Backend on 5003... && cd /d %~dp0backend && set PORT=5003 && npm run dev"

:: Start Frontend (Forced to Port 5175 to avoid local conflicts)
start cmd /k "echo Starting Frontend on 5175... && cd /d %~dp0frontend && npm run dev -- --port 5175"

echo.
echo Servers are being started in separate windows.
echo.
echo [ACCESS LINKS]
echo Backend API    : http://localhost:5003/api
echo Frontend Website: http://localhost:5175
echo Admin Panel     : http://localhost:5175/campusway-secure-admin
echo.
echo Happy Coding!
pause
