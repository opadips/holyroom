@echo off
title Holyroom Launcher
echo Starting Holyroom...
echo.

echo Starting Server...
start "Holyroom Server" cmd /k "cd server && npm run dev"

echo Starting Client...
start "Holyroom Client" cmd /k "cd client && npm start"

echo.
echo Both server and client are starting in separate windows.
echo Close this window or press any key to exit launcher.
pause >nul