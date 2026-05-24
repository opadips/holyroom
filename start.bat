@echo off
title Holyroom Launcher
set ROOT=%~dp0

:: Kill previous processes on ports 3000 and 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Check for SSL certificates
if exist "%ROOT%cert.pem" if exist "%ROOT%key.pem" (
    set HTTPS=true
    set SSL_CRT_FILE=../cert.pem
    set SSL_KEY_FILE=../key.pem
    echo [INFO] SSL certificates found. Running with HTTPS.
) else (
    set HTTPS=false
    set SSL_CRT_FILE=
    set SSL_KEY_FILE=
    echo [WARN] SSL certificates not found. Running with HTTP.
    echo [WARN] Microphone and screen sharing will NOT work without HTTPS.
)

:: Install dependencies if missing
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

:: Start server and client
start "Holyroom Server" cmd /k "cd /d "%ROOT%server" && npm run dev"
start "Holyroom Client" cmd /k "cd /d "%ROOT%client" && npm start"

exit