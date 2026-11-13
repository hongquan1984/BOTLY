@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not available on PATH.
  pause
  exit /b 1
)
echo HealthClues Manager: bắt đầu workflow AI audit an toàn.
npm run manager:start -- %*
pause
