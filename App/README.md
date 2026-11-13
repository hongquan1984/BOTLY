# HealthClues — bộ tài liệu sản phẩm

## Tester nghiệm thu độc lập — 2026-11-05

`tester.bat` ở thư mục này gọi một phiên Codex Tester riêng để nghiệm thu HealthClues sau mỗi lượt Antigravity sửa. Cách bàn giao, trạng thái resume, file kết quả/prompt và giới hạn kiểm chứng được mô tả tại [`tester/README.md`](tester/README.md). Lượt Codex đầu tiên đã tạo báo cáo `REWORK`; việc tiếp tục đúng thread ở lượt hai và vòng Antigravity sửa rồi nghiệm thu lại vẫn chưa được kiểm chứng.

## Mục đích
Đặc tả tiếng Việt để chuẩn bị triển khai HealthClues trên website Next.js, Supabase và Vercel hiện tại của Botly. Đây là tài liệu thiết kế; không có thay đổi mã nguồn, cơ sở dữ liệu hay production trong phạm vi này.

## Thứ tự đọc
1. `DECISIONS_AND_ASSUMPTIONS.md` — ranh giới giữa yêu cầu đã chốt và đề xuất.
2. `MASTER_SPEC.md` — nguồn yêu cầu sản phẩm tổng thể và bảng truy vết.
3. `BUSINESS_RULES.md`, `DATABASE_DESIGN.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `COMMUNITY_AND_PRIVACY_SPEC.md`.
4. `USER_FLOWS.md`, `UI_UX_SPEC.md`, `USE_CASES.md`.
5. `ACCEPTANCE_TESTS.md`, `IMPLEMENTATION_PLAN.md`.

`MASTER_SPEC.md` là nguồn chính khi diễn giải phạm vi sản phẩm. Tài liệu chuyên đề bổ sung quy tắc chi tiết; mâu thuẫn phải được ghi thành quyết định mở trước khi code.

## Danh mục
- `MASTER_SPEC.md`: tầm nhìn, tính năng, phạm vi, traceability.
- `USE_CASES.md`: 30 use case.
- `USER_FLOWS.md`: 12 luồng Mermaid.
- `UI_UX_SPEC.md`: màn hình, trạng thái và hành vi responsive.
- `BUSINESS_RULES.md`: quy tắc nghiệp vụ có mã ổn định.
- `DATABASE_DESIGN.md`: hiện trạng file schema, mô hình logic/vật lý đề xuất, RLS.
- `KNOWLEDGE_AND_SAFETY_SPEC.md`: nội dung, bằng chứng, review và an toàn.
- `COMMUNITY_AND_PRIVACY_SPEC.md`: chia sẻ, quyền, kiểm duyệt.
- `IMPLEMENTATION_PLAN.md`: các phase và cổng phê duyệt, không phải lệnh triển khai.
- `ACCEPTANCE_TESTS.md`: test specification, chưa chạy.
- `DECISIONS_AND_ASSUMPTIONS.md`: confirmed/proposed/open.

## Phiên bản và thay đổi
Tài liệu dùng ID ổn định (`HC-F`, `HC-UC`, `HC-BR`, `HC-AT`). Không tái sử dụng ID đã bỏ; ghi thay đổi có ảnh hưởng schema, quyền riêng tư hoặc điểm thưởng vào Decisions và cập nhật bảng truy vết cùng lúc. Trước khi triển khai, xác nhận lại source, migrations và trạng thái production bằng quy trình riêng.

## Quy tắc giai đoạn
Không sửa source, API, SQL/migration, `.env`, Supabase, Vercel hay dữ liệu production trong giai đoạn đặc tả. Implementation Plan không cấp quyền tự động triển khai.
Build V1 prompt supersedes documentation-only scope; see V1 implementation decisions.
## Build V1 addendum
Current Build HealthClues V1 prompt supersedes the earlier documentation-only rule. Implementation and isolated test validation are authorized; production migrations/deployment and real email remain behind the approval gate. Current traceability includes F017, UC39–42 and AT41–48.
# Codex/AI handoff (current)

Start each HealthClues session with [`HEALTHCLUES_CONTEXT.md`](HEALTHCLUES_CONTEXT.md) then [`CURRENT_STATE.md`](CURRENT_STATE.md). The existing documents above remain canonical; they are not replaced by duplicate specs. For implementation/test status use `reports/V1_PROGRESS.md`, `reports/V1_TEST_RESULTS.md`, `reports/V1_RELEASE_READINESS.md` and the dated current acceptance report. Preserve historical report sections; latest dated state and evidence supersede older snapshots.

Documentation reminder command:

```powershell
npm run docs:healthclues:check -- --files src/features/healthclues/world-map.tsx src/features/healthclues/WellnessWorldGame.tsx --docs App/UI_UX_SPEC.md App/USER_FLOWS.md App/CURRENT_STATE.md App/reports/V1_PROGRESS.md
```

The installed `.githooks/pre-commit` also runs this guard against **staged** paths (only when HealthClues code/canonical docs are staged), after the existing staged-secret scan. This detects likely omissions; it cannot judge semantic accuracy.

