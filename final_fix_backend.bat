@echo off
echo ========================================
echo FINAL FIX - Restarting Backend Only
echo (With proper uvicorn body size limit)
echo ========================================
echo.

echo Stopping old backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting backend with PROPER large file support...
cd /d "%~dp0backend"
python start_server.py

pause
