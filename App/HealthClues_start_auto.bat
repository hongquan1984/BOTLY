@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
set "TERM="
title HEALTHCLUES - CODEX CONTINUE DEVELOPMENT

rem Always use the folder containing this start.bat as the project directory.
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
cd /d "%PROJECT_DIR%"
if errorlevel 1 (
    echo [ERROR] Cannot open project directory: %PROJECT_DIR%
    pause
    exit /b 1
)

rem Allow writing inside the Botly repository, including parent documentation files.
for %%I in ("%PROJECT_DIR%\..") do set "REPO_DIR=%%~fI"

rem Detect Codex CLI installed on Windows (npm or standalone executable).
set "CODEX_BIN="
where codex.cmd >nul 2>&1
if not errorlevel 1 set "CODEX_BIN=codex.cmd"
if not defined CODEX_BIN if exist "%APPDATA%\npm\codex.cmd" set "CODEX_BIN=%APPDATA%\npm\codex.cmd"
if not defined CODEX_BIN (
    where codex.exe >nul 2>&1
    if not errorlevel 1 set "CODEX_BIN=codex.exe"
)
if not defined CODEX_BIN (
    echo [ERROR] Codex CLI was not found on PATH or in %%APPDATA%%\npm.
    echo Install/login to Codex CLI, then reopen this file.
    pause
    exit /b 1
)

if not exist "MASTER_SPEC.md" (
    echo [WARNING] MASTER_SPEC.md was not found in this folder.
    echo Expected location: D:\botly\App\start.bat
    echo Codex will inspect the actual repository before continuing.
)

echo.
echo ================================================
echo  HEALTHCLUES - AUTO READ AND CONTINUE
echo ================================================
echo  Working directory: %PROJECT_DIR%
echo  Codex launcher: %CODEX_BIN%
echo  Mode: auto-execution in Botly workspace; no command approval prompts
echo  Write scope: %REPO_DIR%
echo  Network: enabled inside the sandbox
echo ================================================
echo.

rem Start a fresh interactive Codex session with a project-specific task.
rem The latest verified state must come from source + documentation, not memory.
set "BOOT_PROMPT=Continue developing the existing HealthClues game in this project. First inspect Git status and any AGENTS.md instructions in this directory and parent repository. Before making changes, read HEALTHCLUES_CONTEXT.md and CURRENT_STATE.md if they exist; read the real architecture and product documents here: MASTER_SPEC.md, README.md, BUSINESS_RULES.md, USER_FLOWS.md, USE_CASES.md, DATABASE_DESIGN.md, UI_UX_SPEC.md, KNOWLEDGE_AND_SAFETY_SPEC.md, COMMUNITY_AND_PRIVACY_SPEC.md, DECISIONS_AND_ASSUMPTIONS.md, IMPLEMENTATION_PLAN.md and ACCEPTANCE_TESTS.md, plus relevant latest reports. Check the real source and tests; distinguish plans from implemented and verified features. If handoff/context files are missing, create a concise accurate baseline using existing docs, without duplicating them. Latest owner-approved product direction: keep all eight regions visible on the world map; only Sleep Valley with Luna and HealthClues Realm with Lumi are playable now; other six are Coming Soon. Initial Discovery Quiz determines the personal Journey; Health Realm must not ask for the same concern again. Knowledge lessons, learning quizzes, mini-games and Boss are INSIDE their region maps, not a separate land. Safe isolated owner-playable email/auth demo and persistent gameplay are priorities. After reviewing, continue the highest-priority concrete unfinished task in CURRENT_STATE.md and IMPLEMENTATION_PLAN.md; do not fabricate work or overwrite uncommitted changes. If these sources conflict, document the conflict and follow the latest explicit approved decisions. Implement and actually test what is feasible. Before finishing, update affected existing specs, DECISIONS_AND_ASSUMPTIONS.md for material decisions, implementation/test status, and CURRENT_STATE.md with completed items, actual tests, blockers and the exact next task. Never claim PASS without evidence. Execute routine edits, commands, builds, tests and safe local demo setup autonomously; do not ask approval for each action. Stay inside D:\botly and the explicitly allowed workspace. Do not touch production data, deploy, auto-commit or push. For out-of-sandbox operations, report the blocker instead of bypassing controls. Respond in Vietnamese with concise evidence and next steps."

rem No approval prompts; allow project edits/commands and network, but keep the OS sandbox.
rem Never use --yolo or danger-full-access in this launcher.
call "%CODEX_BIN%" --ask-for-approval never --sandbox workspace-write --add-dir "%REPO_DIR%" -c sandbox_workspace_write.network_access=true -C "%PROJECT_DIR%" "%BOOT_PROMPT%"
set "CODEX_EXIT=%ERRORLEVEL%"

echo.
if not "%CODEX_EXIT%"=="0" (
    echo [WARNING] Codex exited with error code %CODEX_EXIT%.
) else (
    echo Codex session ended. Reopen start.bat next time to re-read the current state.
)
echo.
pause
exit /b %CODEX_EXIT%
