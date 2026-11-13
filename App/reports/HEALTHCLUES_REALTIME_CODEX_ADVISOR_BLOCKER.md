# HealthClues — đánh giá tích hợp Codex thời gian thực

## Implementation attempt — 2026-10-31 — BLOCKED

- Rechecked the Quiz-to-Plan source; it remains deterministic and has no Codex generation route. The earlier two-profile Chromium audit only verified that deterministic fallback is clearly disclosed.
- Codex CLI `0.165.0` is installed and `codex login status` reports ChatGPT login. No model inference was attempted because the required command sandbox cannot start in this execution environment: `codex sandbox windows --help` fails with `CreateProcessAsUserW failed: 2 (The system cannot find the file specified)`; WSL2 launch fails with `Wsl/Service/CreateInstance/E_ACCESSDENIED`.
- Inspected official `@openai/codex-sdk@0.166.0` in a temporary audit directory. The TypeScript SDK supports `sandboxMode: "read-only"`, a separate working directory, an approval policy, and a non-inherited process environment. Its inspected API has no ephemeral-thread option and documents persistent thread storage under Codex home. The SDK package is not installed in the application. No SDK inference occurred, no SDK dependency was added, and no Codex conversation/session or Quiz profile was created/sent.
- **Decision:** do not start an unsandboxed agent. Codex authentication alone does not establish filesystem/tool isolation. No product source, local Supabase, existing account/World, or production data was changed.
- **Required unblock:** make the native Windows sandbox runner functional or provide a usable, sandboxed WSL Codex CLI. Once available, run a minimal synthetic inference with an isolated temporary `CODEX_HOME`, verify the sandbox denies repository/secrets access, then wire the SDK into the Quiz flow. Until then keep the app deterministic and label the feature NOT IMPLEMENTED.

Official reference used: [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk) and [Permissions and sandbox profiles](https://learn.chatgpt.com/docs/permissions).

## Cập nhật audit Chromium — 2026-10-31

**Trạng thái hiện tại: NOT IMPLEMENTED; chế độ Quiz Advisor là DETERMINISTIC.** Đây là cập nhật mới nhất, bổ sung bằng chứng browser cho đánh giá ngày 2026-10-30 bên dưới.

- Source trace: `WellnessPlanBuilder.tsx` tải Catalog và `/api/healthclues/wellness-habits`; sau đó gọi `buildWellnessPlanSuggestions(profile, catalog, questId, habits)` phía client. API habits trả library cố định, `availability: test-only` trong owner demo. Không tìm thấy Codex SDK dependency, Quiz-time provider route, server invocation, request ID hay response ID. `/api/healthclues/npc-chat` là chức năng riêng, không được gọi từ Quiz Plan Builder.
- Local preflight PASS: project `healthclues-owner-demo`, API `127.0.0.1:54321`, Auth/REST/Mailpit local reachable, không có remote Supabase URL kế thừa; secret presence chỉ được kiểm tra và không in ra.
- Chromium audit trên build `http://127.0.0.1:3270/play` với hai hồ sơ synthetic: Gout hiển thị 6 IDs; Sleep hiển thị 5 IDs khác. CDP Network chỉ ghi metadata đường dẫn: mỗi Quiz gọi GET `/api/healthclues/world`, `/api/healthclues/catalog`, `/api/healthclues/wellness-habits` (đều HTTP 200); không có Quiz AI-generation endpoint. Cả hai màn hình hiển thị deterministic mode và TEST ONLY. `quizAiGenerationEndpointCalls: 0`; `providerRequestId: null`, `providerResponseId: null`. Đây là browser xác nhận hành vi fallback thật, KHÔNG phải AI generation.
- Ảnh đã mở kiểm tra: `reports/previews/codex-advisor-audit-gout-plan-desktop.png`, `codex-advisor-audit-gout-plan-mobile.png`, `codex-advisor-audit-sleep-plan-desktop.png`, `codex-advisor-audit-sleep-plan-mobile.png`.
- Một lượt E2E rộng hơn đã dừng ở assertion `Gout Quests panel displays the same private saved Plan`; vì vậy không tuyên bố Plan save/reload qua provider, account-isolation trong luồng Codex, hay Codex failure scenario đã PASS. Không có provider failure path để kích hoạt vì adapter chưa tồn tại.
- Không gửi dữ liệu sức khỏe tới Codex, không gọi production, không deploy. Hai tài khoản tổng hợp được tạo trong Auth local cho bài audit; không ghi payload/answers vào log.

**Ma trận:** source/provider mode = DETERMINISTIC (xác minh); Chromium hai hồ sơ + truthful disclosure = PASS; live Codex invocation/request/response = NOT IMPLEMENTED; Codex-backed plan save = NOT RUN; provider-unavailable error handling = NOT IMPLEMENTED.

Ngày: 2026-10-30  
Kết quả: **BLOCKED — chưa kết nối Codex với Quiz hoặc người chơi**

## Phạm vi đã kiểm tra

Luồng liên quan là Quiz → Suggested Wellness Plan → người chơi chọn/chỉnh/bỏ/tạo goal → xác nhận → lưu plan vào profile/World đã xác thực. UI hiện tại vẫn gọi `/api/healthclues/wellness-habits` để lấy thư viện, rồi dùng `buildWellnessPlanSuggestions` deterministic; plan tiếp tục lưu qua API/profile JSON hiện có. Không thay đổi Quiz, plan, World, auth, database hoặc dữ liệu demo trong lượt này.

## Bằng chứng về Codex SDK

- Đã kiểm tra `@openai/codex-sdk` phiên bản 0.166.0 và mã/type đã cài trong `node_modules`.
- `ThreadOptions` công khai không có tùy chọn ephemeral. Source của SDK dựng command `codex exec --experimental-json` và không thêm CLI flag `--ephemeral`.
- README và type của SDK xác nhận thread được lưu dưới `~/.codex/sessions`.
- CLI đi kèm có `codex exec --ephemeral` và `--output-schema`, nhưng chuyển sang gọi CLI trực tiếp sẽ né giới hạn SDK mà owner đã yêu cầu dùng làm tiêu chí an toàn; lượt này không tạo runner thay thế.
- SDK smoke trước đó chỉ dùng một prompt tổng hợp, không chứa dữ liệu Quiz/người chơi. Nó trả structured response nhưng cũng có event lỗi Code Mode unavailable; đây không phải browser/E2E hay bằng chứng sẵn sàng tích hợp. Session smoke có thể đã được SDK lưu ở Codex home; không xóa/sửa lịch sử Codex của người dùng.
- Gọi Codex SDK gửi prompt tới backend gắn với Codex authentication; đây không phải local inference ngoại tuyến. Chưa có consent/privacy design được kiểm chứng cho việc gửi dữ liệu sức khỏe đó ra dịch vụ ngoài.

## Quyết định an toàn

Không gọi SDK bằng Quiz thật hoặc synthetic browser user. Không gửi câu trả lời sức khỏe vào Codex session có lưu bền. Không dùng deterministic checklist để giả dạng AI và không trả checklist giả khi provider lỗi. UI và API hiện tại phải tiếp tục nói rõ checklist là deterministic cho tới khi provider an toàn được triển khai.

Đã gỡ dependency thử nghiệm `@openai/codex-sdk` khỏi `package.json`/lockfile vì không có adapter an toàn nào sử dụng nó. Không có HealthClues source, schema, Supabase, World hay tài khoản nào bị sửa trong lượt đánh giá này.

## Phương án tiếp tục

Ưu tiên một inference worker riêng, chạy localhost với model runtime đã được owner chọn, không có filesystem/repository/app secrets, không có shell/MCP/browser tools, không lưu prompt/session, đầu vào allowlist JSON tối thiểu, output schema chặt, giới hạn kích thước/thời gian/concurrency, và chỉ trả habit IDs/rationale dùng từ knowledge backend đã cung cấp. Server HealthClues vẫn quyết định safety eligibility, evidence, targets, xác nhận và persistence. Nếu owner muốn dùng Codex cloud thay vì local inference, cần SDK/adapter có cam kết không lưu session (hoặc kiểm soát retention tương đương), consent xử lý dữ liệu, và phê duyệt rõ về truyền dữ liệu ra ngoài trước khi browser flow gửi bất kỳ Quiz profile nào.

## Acceptance evidence

| Kiểm tra | Kết quả |
|---|---|
| Xác định provider hiện tại | **PASS** — deterministic rules, không có LLM trong Quiz checklist |
| Xác định SDK có gọi được nhưng lưu thread | **PASS** — source/type/README SDK; smoke chỉ dùng dữ liệu tổng hợp |
| Codex thật được gọi từ browser Quiz completion | **BLOCKED / NOT IMPLEMENTED** |
| Hai browser submissions, request IDs và response mới | **NOT RUN** — không gửi profile vì chưa giải quyết retention/consent |
| Plan save/reload qua Codex output | **NOT RUN** — không được thay bằng dữ liệu giả |
| Failed Codex call hiển thị lỗi thật | **NOT RUN** — chưa có route Codex |
| Production/provider readiness | **NOT READY** — không deploy hoặc dùng production |

## Files / thay đổi

- `package.json`, `package-lock.json`: gỡ dependency thử nghiệm không được sử dụng.
- `App/reports/HEALTHCLUES_REALTIME_CODEX_ADVISOR_BLOCKER.md`: báo cáo này.
- `App/CURRENT_STATE.md`, `App/DECISIONS_AND_ASSUMPTIONS.md`, `App/MASTER_SPEC.md`, `App/ACCEPTANCE_TESTS.md`: ghi nhận blocker và ranh giới hiện tại.
