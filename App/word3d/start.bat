@echo off
cd /d "%~dp0"
echo ==============================================
echo   Starting Floating Fantasy Village 3D Server
echo ==============================================
echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/
npx vite --port 5173 --host
pause
