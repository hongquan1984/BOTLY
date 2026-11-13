# Codex workspace-write permission boundary test

Codex CLI: 0.166.0

Test 1 used `--ignore-user-config --sandbox workspace-write --cd D:/botly/App/Manager/workspaces/sandbox-probe`.
- Write within cwd: succeeded.
- Write outside cwd, within Manager: succeeded (unexpected).

Test 2 additionally used `--skip-git-repo-check` and a fresh non-repository directory.
- Write within cwd: succeeded.
- Write outside cwd, within Manager: succeeded (unexpected).

The outside files were temporary probes created only by these tests and were removed immediately. This confirms the installed CLI sandbox does not enforce a path-level boundary in this Windows environment. A separate snapshot directory alone is unsafe. Developer was not launched for HC-PILOT-001. No HealthClues application file was changed and no Apply Gate was run.
