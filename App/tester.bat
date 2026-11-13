@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo [TESTER] Node.js is not available on PATH.
  exit /b 1
)
node "%~dp0tester\runner.mjs" %*
exit /b %ERRORLEVEL%
