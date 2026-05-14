@echo off
title Holyroom Launcher
set ROOT=%~dp0

echo Checking dependencies...

if not exist "%ROOT%server\node_modules" (
    echo Installing server dependencies...
    cd /d "%ROOT%server"
    call npm install
    cd /d "%ROOT%"
)

if not exist "%ROOT%client\node_modules" (
    echo Installing client dependencies...
    cd /d "%ROOT%client"
    call npm install
    cd /d "%ROOT%"
)

echo Starting server and client...
start "Holyroom Server" cmd /k "cd /d "%ROOT%server" && npm run dev"
start "Holyroom Client" cmd /k "cd /d "%ROOT%client" && npm start"

exit