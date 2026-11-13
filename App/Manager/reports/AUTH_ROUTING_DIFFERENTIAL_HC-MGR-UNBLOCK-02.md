# HC-MGR-UNBLOCK-02 — Windows vs Docker Codex routing audit

Audit date: 2026-11-02 (Asia/Bangkok)  
Mode: read-only; no inference was run during this audit. The one Windows smoke cited below belongs to the prior authorized HC-MGR-UNBLOCK-01 diagnostic. No auth values, proxy values, headers, or credential files were read into this report.

## 1. Verified environment differences

| Area | Windows host | Linux Docker | Evidence / limit |
|---|---|---|---|
| Codex distribution | Installed Node CLI distribution, `@openai/codex`, version 0.166.0 | Linux x64 `@openai/codex` 0.166.0 in Manager-local image | `reports/pilot/HC-PILOT-001/docker-isolation-status.md`; Windows installation path is configured in `manager.config.json`. Same CLI version does not prove identical bundled runtime behavior. |
| Runtime | Windows Node 24.16.0 | Node 24.22.2, Debian bookworm-slim, Linux/amd64, UID 10001 | Docker status report. Runtime/OS and CA store differ. |
| Model/provider | Manager config selects `gpt-6.1-sol`, Manager reasoning high; Developer medium. No provider/base URL is set in `manager.config.json`; local Codex config was inspected by key names only and no provider override was observed. Default ChatGPT sign-in route is used. | Smoke used the same model ID. Container had the single auth file mounted read-only into ephemeral CODEX_HOME; it did not receive the host CODEX_HOME/config tree. | `manager.config.json`, Docker status report. Auth file contents were not read or included. Model ID equality does not prove account entitlement/catalog availability in both runtimes. |
| Working directory | Prior successful smoke used Windows Temp, `--sandbox read-only`, `--ephemeral`, and no repository source input. | Failed smoke was executed in isolated `/workspace`, no original checkout mount. Container execution used isolated HOME/CODEX_HOME. | Historical smoke logs and Docker status report. Request context differed by platform/configuration. |
| Authentication signal | Three historical structured Windows smoke runs are recorded as PASS in `state/PROJECT_STATE.json`; prior one-line smoke completed with the expected response. | `codex login status` recognized ChatGPT login state, but inference did not complete. | Login status establishes local credential recognition, not token validity, required scopes, entitlement, or successful inference. |
| Proxy | Windows process proxy environment variables absent; WinHTTP and Internet Settings reported direct/no proxy. | Docker Engine reports configured HTTP/HTTPS/NO_PROXY presence, but container proxy environment variable names were absent. Values were not displayed. | Read-only host/Docker diagnostics from prior audit. Daemon proxy presence is not proof it is passed into application containers. |
| DNS / HTTPS | Host DNS resolved `chatgpt.com` and `api.openai.com`. Unauthenticated HEAD returned 451 for `chatgpt.com/backend-api/ps/mcp` and 401 for `api.openai.com/v1/models`. | Container DNS/HTTPS diagnostics reached the same addresses and returned the same statuses for those unauthenticated HEAD requests. | These are not Codex's authenticated request sequence, not equivalent HTTP methods, and not successful endpoint authorization. They show an HTTP response was received for those specific probes, not successful Codex routing. |
| Codex request lifecycle | Historical Windows `codex exec --json` smoke reached `turn.completed`, returned the requested short response, exit 0. | Docker CLI loaded login state, then model-catalog refresh errors and `workspace routing discovery failed` appeared against `chatgpt.com/backend-api/ps/mcp`, followed by reconnect attempts. No `turn.completed` or successful inference response. Exact final container exit status was not captured. | `reports/REAL_CODEX_SMOKE/*` and `reports/pilot/HC-PILOT-001/docker-isolation-status.md`. This places the visible failure during initialization/routing/catalog refresh, before a verifiable completed model turn; it does not establish why. |
| Filesystem / mounts | Host smoke read-only in Temp, without project source. | Prior boundary probe had only synthetic `/workspace` bind, read-only root, no `/mnt/d`, `/host`, or Docker socket. Codex auth smoke mounted one credential file read-only; no entire profile/CODEX_HOME was mounted. | Docker isolation report. This audit did not rerun the boundary test. |
| TLS trust | Windows uses Windows trust/runtime stack. | Debian container uses Linux CA bundle and Node/OpenSSL runtime. | A platform difference is established; whether a missing CA or interception caused this failure is not established. No CA store contents were dumped. |

No new inference smoke or network mutation was performed in this audit. The status probes above are historical evidence from the preceding authorized diagnostic, not new tests.

## 2. Root cause and remaining hypotheses

**Verified root cause: none.** The verified failure stage is Codex initialization/routing/model-catalog refresh in Linux, before a completed inference turn. HTTP 451 and 403 from earlier probes are responses to different endpoints/methods and cannot be assigned as the cause of the Codex failure. Likewise, CLI reporting “Logged in using ChatGPT” proves only local sign-in state was recognized.

**Remaining hypotheses (unconfirmed):**

1. Runtime network policy, proxy path, DNS response, TLS trust, or connection handling differs for the exact Codex request. The Docker daemon proxy presence and absent container proxy environment are a configuration difference worth checking with the owner/IT, but not evidence that a proxy is required or the cause.
2. Linux-specific CLI initialization or a 0.166.0 regression affects model-catalog or workspace-routing discovery. Issue reports below show related symptoms in other environments, not this root cause.
3. The ChatGPT sign-in state is recognized but a request-specific authentication, scope, workspace entitlement, model availability, or server routing condition fails. No credential inspection or token validation was done, so this remains unverified.
4. Model catalog refresh and routing may be separate failures or one triggering the other. Current logs do not establish order beyond showing both during initialization.

## 3. Issue correlation

Public `openai/codex` issues contain symptom-level similarities:

- [#55453](https://github.com/openai/codex/issues/55453) reports “workspace routing discovery failed” alongside TLS/WebSocket errors in a Windows 11 VS Code extension; different environment and integration.
- [#48894](https://github.com/openai/codex/issues/48894) reports workspace routing discovery timeout in a remote Linux SSH context. A user discusses TLS/certificate conditions; that report is not evidence about this Docker host.
- [#49827](https://github.com/openai/codex/issues/49827) reports the routing error in app-server while `codex exec` worked, the opposite component result from this case.
- [#50211](https://github.com/openai/codex/issues/50211) reports a similar CLI routing failure on macOS; network cause is not established for this case.
- [#56674](https://github.com/openai/codex/issues/56674) reports TLS resets before ClientHello and routing discovery on Windows CLI 0.163.0, a different OS/runtime and version.
- [#54878](https://github.com/openai/codex/issues/54878) reports model-catalog refresh timeouts and cache effects, which correlate with the catalog symptom but do not establish the current cause.

These are user issue reports and symptoms, not an authoritative diagnosis or supported workaround. No issue was used to justify changing network, TLS, or authentication configuration.

## 4. Recommended fixes (not applied)

| Option | Change and complexity | Security / auth | Manager impact | PASS condition |
|---|---|---|---|---|
| **A — First choice: compare supported runtime configuration** | Low. Owner/IT reviews whether the documented Docker Desktop proxy configuration should be exposed to this particular container; compare non-secret Codex config keys, CA trust metadata, DNS results, and CLI diagnostics on host vs container. Do not copy the whole CODEX_HOME, alter proxy/CA, or add undocumented endpoints. | No credential change. Keep one-file, read-only credential exposure only if separately approved. | Keep CLI + container adapter; likely configuration-only if a documented setting is confirmed. | Owner-approved, single bounded smoke later completes with `turn.completed` inside container; container still has no original checkout, Docker socket, or extra mounts. Record exact exit/completion and sanitized error. |
| **B — Evaluate documented Codex app-server / SIWC Responses integration if A fails** | Medium/high. A new adapter/provider and token handling path is needed; do not assume app-server OAuth will work with the existing CLI login. | Official OpenAI docs describe app-server use with a Responses provider and SIWC scope/client requirements. Requires owner approval for client registration, consent/scopes, and auth flow if not already provisioned. Never extract or reuse hidden CLI tokens. | Adds or replaces Developer transport while preserving orchestrator and isolated workspace. | Officially supported registration/scopes are confirmed for this use; a harmless real request succeeds with documented Responses integration; credentials remain outside image/task snapshot; isolated Developer boundary tests still pass. |
| **C — Keep model control on Windows; isolate only code execution in Linux** | Medium/high and architecturally distinct. Windows Codex coordinates; code/test execution is exposed through a narrow, reviewed remote execution bridge or approved service. | Avoid Linux Codex auth, but bridge becomes a sensitive command/file boundary; must be allowlisted, authenticated, audited, and unable to reach original checkout. No generic host shell bridge. | Requires a new adapter and evidence/result protocol; greater complexity. | Threat-model and adversarial tests show Developer can only read/write task snapshot, cannot address host checkout/secrets/socket, and can return verifiable diffs/tests; one approved task completes end-to-end. |

**Minimal recommendation:** approve Option A’s read-only comparison with the Docker/IT owner first. This audit did not change Docker or run another smoke. Since the status probes reached HTTP responses both on host and in container, focus the next diagnostic on whether the exact Codex request path has a supported proxy/CA/config difference, not on treating the 451/403 probe statuses as the cause. If A finds no supported configuration correction, pause for explicit approval before evaluating B or C.

## 5. Exact evidence and state

- Manager model/provider configuration: `manager.config.json`.
- Docker image, runtime, routing logs, proxy-presence summary, previous smoke status, and prior isolation evidence: `reports/pilot/HC-PILOT-001/docker-isolation-status.md`.
- Prior Manager verdict: `reports/pilot/HC-PILOT-001/manager-verdict.json`.
- Windows structured smoke artifacts: `reports/REAL_CODEX_SMOKE/2026-11-02T12-36-43.751Z/`, `12-41-14.096Z/`, `12-53-55.629Z/` (Developer JSON result and logs).
- Current durable state inspected read-only: `state/PROJECT_STATE.json` and `state/TASK_QUEUE.json`.
- HC-PILOT-001 remains `AUTH_BLOCKED`; HC-001 through HC-008 remain `PENDING`. No queue, baseline, credentials, Docker setting, or source file was modified by this audit.
- Separate pre-existing apply blocker remains: the test target checksum in the earlier preflight differs from the checksum recorded in the Docker status report. This audit did not hash, restore, accept, or change that baseline and cannot attribute the drift. Resolve it only in a separately approved read-only provenance review before any Apply Gate attempt.

## 6. Official guidance and next verification

Official OpenAI documentation for Sign in with ChatGPT says to use the documented integration and Responses endpoint rather than private ChatGPT backend endpoints; it describes model catalog behavior and the supported inference request shape in [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference). The [Codex app-server integration](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server) and [sign-in requirements](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) describe a possible app-server/OAuth route, but do not prove the existing local Codex login can be reused by a custom Linux adapter. No app-server or SDK smoke has been run.

**Next safe step requiring Owner approval:** authorize a non-inference, read-only comparison of the exact non-secret CLI configuration keys and CA/proxy/DNS metadata, plus confirmation from Docker Desktop/IT whether daemon proxy settings are intentionally made available to containers. If that comparison suggests a supported configuration change, request separate approval before changing it or running one bounded container inference smoke. Do not retry automatically.

**Owner approval required:** any proxy/CA/config change; any new inference smoke; OAuth client registration/consent or scope changes for app-server; any alternative execution bridge; any future checksum reconciliation or Apply Gate. Until then, keep HC-PILOT-001 AUTH_BLOCKED and the rest of the queue pending.
