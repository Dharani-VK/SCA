@echo off
echo ========================================
echo Restarting Backend with New Endpoints
echo ========================================
echo.

echo Stopping all Python processes...
taskkill /F /IM python.exe >nul 2>&1

echo Waiting for port to be released...
timeout /t 5 /nobreak >nul

echo.
echo Starting backend...
cd /d "%~dp0backend"
start "Smart Campus Backend" cmd /k "python start_server.py"

echo.
echo ========================================
echo Backend restarted!
echo ========================================
echo.
echo Backend will be available at: http://127.0.0.1:8000
echo.
echo Press any key to close this window...
pause >nul
