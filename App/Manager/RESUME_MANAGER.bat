@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo HealthClues Manager: khôi phục trạng thái đã lưu.
node src/cli.mjs resume
pause
