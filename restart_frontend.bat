
@echo off
echo Stopping Node...
taskkill /F /IM node.exe >nul 2>&1
echo Starting Frontend...
cd frontend
start "Smart Campus Frontend" cmd /k "npm run dev"
echo Frontend Restarted.
