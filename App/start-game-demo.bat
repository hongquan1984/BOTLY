@echo off
setlocal
cd /d "%~dp0\.."
set "HEALTHCLUES_OWNER_DEMO_PORT=3249"
set "HEALTHCLUES_OWNER_DEMO_BUILD_NAME=app-build-final-a10"
set "HEALTHCLUES_OWNER_DEMO_BUILD_ROOT=%TEMP%\healthclues-owner-demo-builds"
node scripts\start-healthclues-owner-demo.mjs %*
if errorlevel 1 (
  echo.
  echo HealthClues owner demo did not start. Read the message above and App\.tmp\healthclues-owner-demo logs.
  pause
  exit /b 1
)
echo.
echo Open the Game URL and local inbox printed above.
pause
