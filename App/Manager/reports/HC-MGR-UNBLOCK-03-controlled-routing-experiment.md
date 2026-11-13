# HC-MGR-UNBLOCK-03 — Controlled routing experiment decision

Date: 2026-11-02  
Scope: inspect existing sanitized reports, Manager configuration/source, and official OpenAI documentation. No inference, Docker, network, auth, HealthClues source, baseline, or queue operation was run or changed in this task.

## 1. Experimental variable and evidence

**No sufficiently supported single variable was identified.** The experiment is not eligible to proceed to inference.

Candidate considered: provide the Linux container with a non-secret Codex `config.toml` matching the Windows profile, mounted read-only.

- Evidence of a difference: the previous container mounted only the approved auth file into its temporary `CODEX_HOME`; it did not mount the host Codex profile/config tree. The Windows profile's non-secret key names were previously inspected and included model/reasoning/sandbox/trust preferences.
- Evidence against selecting it as the controlled variable: `manager.config.json` and `src/developer-adapter.mjs` already pass the selected model, reasoning effort, sandbox mode, and working directory explicitly to `codex exec`. The previous audit found no provider/base-URL override in the Windows configuration. Nothing in the available logs ties the remaining settings to model-catalog refresh or workspace routing.
- Conclusion: copying or synthesizing a profile would change multiple unproven settings and would not be a clean causal test. It may also import personal trust preferences without proving relevance. **Not selected.**

Other candidates considered:

- **Proxy:** Docker Engine proxy presence was observed, but no evidence shows it is injected into this container or that Codex needs it. Prior host and container HTTPS probes received responses for the same unauthenticated HEAD requests. Proxy is not a justified test variable.
- **CA/trust store:** Windows and Debian use different trust/runtime stacks, but no Codex TLS validation error or missing CA certificate was evidenced. A generic CA difference alone is not enough to select a test.

Source evidence: `reports/AUTH_ROUTING_DIFFERENTIAL_HC-MGR-UNBLOCK-02.md`; `reports/pilot/HC-PILOT-001/docker-isolation-status.md`; `manager.config.json`; `src/developer-adapter.mjs`.

## 2. Test executed / result

- Docker inference test: **NOT RUN**.
- Reason: no one-variable experiment met the user's evidence and safety gate.
- Result: **INCONCLUSIVE** as to root cause; this is not an inference FAIL because no request was issued.
- No auth, Docker, proxy, network, source, task queue, or baseline change was made.

Previously recorded behavior remains: Windows CLI 0.166.0 smoke completed; Linux CLI 0.166.0 recognized local ChatGPT login state but failed during model-catalog/workspace-routing initialization without `turn.completed`. That does not isolate auth, routing, endpoint, network, or runtime as root cause.

## 3. Recommended architecture path

### Windows inference + isolated Docker execution

**NOT VERIFIED and not presently safe to approve as a Developer execution architecture.** The Windows Codex Developer adapter in `src/developer-adapter.mjs` launches `codex exec` as a local child process with the configured working directory and sandbox flag. The earlier boundary diagnostic found Windows `workspace-write` could write outside its configured workspace. Therefore, using the Windows Codex agent for Developer work would permit its local shell/tool execution on the host; a prompt saying “only use Docker” is not an enforcement boundary.

A design where Windows Codex only produces a task plan and a deterministic host adapter executes fixed, allowlisted container operations may be possible, but it is not implemented or verified. The host adapter must not expose a generic shell, arbitrary Docker arguments, Docker socket to the container, or original checkout mount to Developer. Until host-side enforcement of that interface is independently tested, do not use it for a real task.

### Documented Codex app-server / OAuth

Official OpenAI documentation describes app-server using a Responses provider and an OAuth access token authorized for the user's ChatGPT plan; the documented client flow requires registration/consent and appropriate permissions. It uses public `api.openai.com/v1/responses`, not private ChatGPT backend endpoints. A catalog result alone is not entitlement proof; a completed inference turn is.

This is a supported path to evaluate, **not a confirmed fix**. The docs also state app-server can run local shell/MCP tools. App-server does not itself prove filesystem isolation. For this project, it should run in the same constrained container with only the task snapshot writable; credentials should be injected only at runtime with minimal scope and not stored in the image or task artifacts. The current Windows CLI login has not been proven reusable by a custom app-server client.

Sources: [Codex app-server with Sign in with ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server), [Sign-in and registration](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [Codex preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations).

## 4. Security assumptions still unverified

- Linux container inference could work using the documented SIWC app-server flow with an owner-approved registration and granted scopes.
- The current owner ChatGPT account/workspace has access to the requested model and plan usage for that flow.
- A host orchestrator can safely pass an authorized runtime credential into a disposable container without exposing it in logs, image layers, snapshots, reports, or Developer-readable files.
- Container execution can retain the already recorded filesystem boundary after adding a narrowly scoped app-server process and required writable home/cache paths.
- A host-side allowlisted Docker invocation can constrain Codex Developer without giving it arbitrary host shell or Docker-daemon control.
- No current evidence proves a proxy, CA, network policy, or server-routing defect.

## 5. Smallest next task to request Owner approval

**Proposed task: `HC-MGR-APP-SERVER-POC-01` — isolated, non-product app-server feasibility spike.**

1. Confirm the intended SIWC client registration and OAuth consent/scope requirements against current official docs; stop if Owner approval or account consent is needed.
2. Prepare a disposable container design with no source checkout, no Docker socket, read-only root, and only explicit temporary writable paths. Do not implement a generic host shell/Docker bridge.
3. After separate Owner authorization for client registration/consent and one inference request, run exactly one harmless app-server inference with bounded timeout; capture process exit and `turn/completed` status, redacted.
4. Independently verify mount inventory and that Developer cannot access host checkout/secrets before considering code tools enabled.

**PASS:** authorized real inference returns a completed turn; no tool execution is enabled in the inference-only proof; credentials are runtime-only; container mounts remain constrained. A later separate test must prove shell/tool isolation before any Developer task.  
**STOP:** registration/consent is unavailable or declined; credential flow requires copying hidden CLI auth data; unsupported endpoint/configuration is needed; host checkout or Docker socket becomes reachable; mount inventory is ambiguous; inference does not complete. No retries without new approval.

Owner approval required before any OAuth registration/consent, credential issuance, inference smoke, source change, adapter implementation, or Developer task. HC-PILOT-001 remains `AUTH_BLOCKED`; HC-001 through HC-008 remain `PENDING`.
