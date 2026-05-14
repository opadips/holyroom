@echo off
title Holyroom - First Launch & Start

:: Store the root directory of the project
set ROOT=%~dp0

:: Check and install server dependencies if needed
if not exist "%ROOT%server\node_modules" (
    echo.
    echo [INFO] Installing server dependencies...
    cd /d "%ROOT%server"
    call npm install
    cd /d "%ROOT%"
)

:: Check and install client dependencies if needed
if not exist "%ROOT%client\node_modules" (
    echo.
    echo [INFO] Installing client dependencies...
    cd /d "%ROOT%client"
    call npm install
    cd /d "%ROOT%"
)

:: Start the server and client
echo.
echo [INFO] Starting Holyroom Server...
start "Holyroom Server" cmd /k "cd /d "%ROOT%server" && npm run dev"

echo [INFO] Starting Holyroom Client...
start "Holyroom Client" cmd /k "cd /d "%ROOT%client" && npm start"

echo.
echo All done! Both windows should open shortly.
pause >nul