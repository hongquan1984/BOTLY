# Docker isolation and pilot status

## Environment
- Docker Desktop 4.66.1, Docker Engine 29.3.1, Linux/amd64, context desktop-linux.
- WSL2 Ubuntu and docker-desktop distributions are listed.
- Existing Docker workloads were observed (including Supabase Owner Demo and unrelated services); no existing container was stopped or changed.
- Windows Node: 24.16.0. npm.ps1 is blocked by the host PowerShell execution policy; npm CLI was not needed on host.

## Image
- Manager-local `Docker/Developer.Dockerfile` was built with Node 24 bookworm-slim and @openai/codex 0.166.0, user 10001, no credentials in image.
- BuildKit reported image export success. Subsequent image inspect/run failed with containerd content-store I/O error; image usability is therefore not verified.

## Runtime blocker
- `docker run` for the newly built Developer image failed before process start: `blob ... expected ... input/output error`.
- Minimal `docker run --rm --network none --read-only node:24-bookworm-slim --version` also failed before process start: `write ... containerd.metadata.../meta.db: input/output error`.
- No container was left running. No host checkout was mounted into Docker. No source snapshot was created. No Docker socket or credential mount was attempted.
- Docker Desktop was not reset/restarted, and no prune/volume/container operation was used.

## Pilot
- HC-PILOT-001 remains BLOCKED. Developer and Manager review did not run. Apply Gate did not run.
- Both authorized app files retain their preflight SHA-256 values; they remain pre-existing untracked files.
- HC-001 through HC-008 remain PENDING. No HealthClues file changed.
- Existing Manager unit suite: 15/15 PASS.
- Windows Codex read-only restriction is not considered enforceable because the tested workspace-write boundary failed; Manager review must also move to an isolated container before real use.

## Authentication
- Windows Codex auth file exists, with auth metadata. No values were inspected or mounted.
- Official OpenAI guidance documents OAuth access-token use with Codex app-server for ChatGPT plan inference. This Manager currently invokes Codex CLI; a safe Linux authentication method was not validated in this turn. No authentication smoke test was run.

## Recovery verification (2026-11-02)
- Docker Desktop Linux Engine recovered: `docker info` reports Linux 29.3.1. A no-network Node 24 container ran successfully. Existing Owner Demo and other containers remained running.
- Rebuilt image now runs Linux Codex CLI 0.166.0 under UID 10001. The current auth.json, mounted alone and read-only, yields `codex login status: Logged in using ChatGPT`; its values were never displayed.
- Docker boundary probe: only `/workspace` bind-mounted from the synthetic Manager workspace; `/mnt/d`, `/host`, `/mnt/host`, and Docker socket paths absent; workspace write passed; host path write returned ENOENT; symlink escape returned EPERM; root filesystem read-only. Original application target hash was unchanged across the boundary probe.
- Real Codex read-only smoke did not complete: CLI could load local login state, then failed workspace routing discovery against `chatgpt.com/backend-api/ps/mcp`. Unauthenticated HEAD returned HTTP 451 for `chatgpt.com`; OAuth token request to `api.openai.com/v1/models` returned HTTP 403. No successful inference response was received.
- No Developer task or Apply Gate was run. Manager tests: 15/15 PASS.
- The second approved original file currently has SHA-256 `AD7989393B811B7B244EF6A12822982EADF55ADC49DBC184887D0955B919A9E3`, whereas the recorded preflight SHA-256 was `49D41FF6E1EE0C0E1187516E2D3F4252F2BA5809CF20FC0B8C0DD451FF3ABACB`. This Manager did not write either original target. Treat this checksum drift as an external/concurrent change and do not restore or overwrite it.
