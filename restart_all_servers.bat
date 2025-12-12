@echo off
echo ========================================
echo Smart Campus Assistant - Full Restart
echo (Backend + Frontend with Large File Support)
echo ========================================
echo.

echo [1/4] Stopping old backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo   Killing backend process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/4] Stopping old frontend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo   Killing frontend process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [3/4] Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Starting servers...
echo.

echo Starting BACKEND (50MB file support)...
cd /d "%~dp0backend"
start "Smart Campus Backend" cmd /k "python start_server.py"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting FRONTEND (with large file timeout)...
cd /d "%~dp0frontend"
start "Smart Campus Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Both servers are running in separate windows.
echo You can now upload files up to 50MB!
echo.
echo Press any key to close this window...
pause >nul
