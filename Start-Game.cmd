@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer from https://nodejs.org first.
  pause
  exit /b 1
)
if not exist node_modules\ws (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run build
if errorlevel 1 (
  pause
  exit /b 1
)
echo Open http://localhost:3000 in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop the server.
node server.mjs
pause
