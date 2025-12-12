@echo off
echo ========================================
echo Smart Campus Assistant - Backend Restart
echo ========================================
echo.

echo Stopping old backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Waiting for port to be released...
timeout /t 2 /nobreak >nul

echo.
echo Starting backend with large file support (50MB)...
cd /d "%~dp0backend"
python start_server.py

pause
