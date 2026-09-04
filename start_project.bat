@echo off
title Your Wealth Compass - Local Server Launcher
echo ===================================================
echo   Starting Your Wealth Compass Full Stack App...
echo ===================================================
echo.

:: 1. Start Backend in background
echo [1/2] Launching Backend Server on port 5000...
start "Financial Report Backend" cmd /k "cd /d "%~dp0" && node backend/server.js"

:: Small delay to allow backend to bind port
timeout /t 2 /nobreak >nul

:: 2. Start Frontend Dev Server
echo [2/2] Launching Frontend Dev Server on port 5173...
start "Financial Report Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   All Servers Launched!
echo   Frontend URL: http://localhost:5173
echo   Forms Portal: http://localhost:5173/forms
echo   Admin Portal: http://localhost:5173/#adm
echo ===================================================
echo.
pause
