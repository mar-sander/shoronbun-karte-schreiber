@echo off
cd /d "%~dp0"
where npx >nul 2>nul
if errorlevel 1 (
  echo Node.js / npx could not be found.
  pause
  exit /b 1
)
start "" http://localhost:8080
npx --yes http-server . -p 8080 -c-1
pause
