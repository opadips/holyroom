@echo off
title Holyroom Launcher
set ROOT=%~dp0

echo [INFO] Checking port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    if not "%%a"=="0" (
        echo [INFO] Killing process tree on port 3001 (PID: %%a)
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo [INFO] Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        echo [INFO] Killing process tree on port 3000 (PID: %%a)
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo [INFO] Waiting for ports to release...
timeout /t 5 /nobreak >nul

:: Re-check ports
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 is still in use. Killing all node.exe processes...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr ":3001" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [ERROR] Port 3001 is still in use. Please restart your computer or change the port.
        pause
        exit /b
    )
)

netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is still in use. Killing all node.exe processes...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr ":3000" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [ERROR] Port 3000 is still in use. Please restart your computer or change the port.
        pause
        exit /b
    )
)

echo [INFO] Ports are free. Checking dependencies...

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