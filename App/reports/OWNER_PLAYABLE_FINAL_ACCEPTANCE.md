# Owner Playable Final Acceptance — Master Prompt 08 V2

Ngày kiểm tra: 2026-10-28. Trạng thái milestone: **PARTIAL**. Không triển khai production.

## Acceptance matrix

| Hạng mục | Implemented | Browser verified | Persistence verified | Visual QA | Kết quả |
|---|---|---|---|---|---|
| `/play` trong preview hiện tại | Có | Có, Chromium | Không áp dụng guest | Welcome desktop/mobile | PASS |
| Overworld tám vùng, hai vùng playable | Availability tập trung; API từ chối tạo Journey cho sáu ID khóa | Browser xác nhận 8 vùng, 2 mở, 6 Coming Soon; full E2E test API lock PASS | E2E xác nhận API từ chối sáu region ID chưa phát hành | Ảnh desktop/mobile đã kiểm tra | PASS (global map/availability) |
| Quiz ≤10 câu, Reveal, World Preview | Có | Có trên URL owner preview | Guest không tạo World | Ảnh Reveal/World hiện có và đã kiểm tra | PASS (guest flow) |
| Account activation qua Supabase thật + local inbox | Chưa có local Auth/Mailpit | Mock OTP/callback trong E2E cũ | E2E DB riêng, nhưng không xác minh email thật | Chưa chụp owner Auth | BLOCKED |
| World/Journey cá nhân hóa theo Gout hoặc Sleep goal | Chưa hoàn chỉnh: tạo World hiện lưu `topicKey` theo region ID; không có active Journey Context chuẩn | Chưa xác minh Gout | Chưa xác minh | Chưa có map theo Journey | BLOCKED |
| Hai detailed region map + Luna/Lumi pet riêng | Chưa có scene renderer/art riêng; hiện chỉ có Overworld và sprite adventurer tổng quát | Chưa | Chưa | Không đạt yêu cầu map vùng | BLOCKED |
| Toolkit, Knowledge, Daily, Boss, Rewards | Các panel/API hiện có trong V1; chưa tích hợp đầy đủ theo vùng/Journey | Regression đang chạy; lần trước dừng vì fixture Knowledge không khớp Sleep | API E2E trước đó đã có coverage; lần chạy này chưa PASS | Screenshot lịch sử tồn tại; không chứng minh tích hợp map | PARTIAL |
| Local isolated owner test inbox | Không có Mailpit/MailHog hay Supabase Auth container đang chạy | Không | Không | Không | BLOCKED |

## Preview thực tế

- URL đang chạy: `http://127.0.0.1:3234/play`
- Đây là isolated production build từ source trong `D:\botly`, với toàn bộ Supabase env bị loại bỏ. Chỉ có guest/read-only flow; không thể đăng ký, gửi mail hoặc lưu World.
- Build: `App/.tmp/healthclues-owner-preview-1793203073581`.
- Start/rebuild (PowerShell):

```powershell
$env:HEALTHCLUES_PREVIEW_PORT = "3234"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

- Khởi động lại không rebuild: đảm bảo port 3234 đã rảnh, sau đó chạy lệnh trên bỏ `--rebuild`. Stop: xác định PID đang LISTEN trên port 3234 bằng `Get-NetTCPConnection -LocalPort 3234 -State Listen`, đối chiếu command line là `next start` với đúng build ở trên, rồi dừng đúng PID đó. Không dừng PID nếu ownership không khớp.
- Test inbox URL: **không có**; không được bịa URL.

## Isolation evidence

`.env.local` chứa host `rswmadukvegraxfcdbcb.supabase.co` (production project). Không in/ghi secret và không dùng target này cho demo writes. Docker hiện có `botly-healthclues-db-e2e` và `botly-healthclues-postgrest-e2e`; không có Supabase Auth hoặc Mailpit. E2E runner tạo mock callback/identity tạm, không phải email verification thật. Không gửi email ngoài, không sửa production.

## Tests / screenshots

- ESLint các file source đã sửa: PASS.
- `node --check scripts/run-healthclues-game-e2e.mjs`: PASS.
- Isolated Next build và route `/play`: PASS.
- `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3234/play`: PASS; browser kiểm tra Welcome, 2 Quest mở, 6 Coming Soon, 10-question cap, Reveal sau Quiz, refresh, World Preview, activation overlay, zero runtime errors.
- Full `node scripts/run-healthclues-game-e2e.mjs`: lần chạy đầu BLOCKED tại Knowledge UI assertion vì fixture Sleep journey chờ “Test nutrition knowledge clue”; runner xác nhận cleanup fixture. Đã sửa test expectation theo fixture Sleep và chạy lại; kết quả cuối được ghi sau khi hoàn tất.
- Đã chụp/kiểm tra ảnh trên cùng URL/build: `healthclues-fullscreen-world-preview-desktop.png`, `healthclues-fullscreen-world-preview-mobile.png`, cùng Welcome/Quest/Reveal/Activation trong `App/reports/previews/`. Ảnh map xác nhận đủ tám marker; đây là global Overworld, không phải detailed Sleep/Health maps.

## Blockers còn lại

1. Local Supabase Auth + local email capture chưa được cấu hình; owner chưa thể tự đăng ký/verify và lưu World an toàn.
2. Không có detailed maps, map landmarks, Luna/Lumi sprite pair, Companion Engine hoặc in-map Knowledge/mini-game UI.
3. Branch `topic_key` hiện là region ID (`sleep-better`, `health-concern`) và chưa biểu diễn concern cụ thể; Knowledge endpoint lọc theo branch key, nên Gout personalization không được đảm bảo.
4. Journey switching, per-Journey loadout persistence, four Skills/five levels, Daily Companion questions, Gout-specific reviewed Knowledge/Boss fixtures chưa được xác minh.
5. Human content review, privacy/security review và release gates hiện hành vẫn mở.


## Kết quả regression cuối cùng — 2026-10-28

Lệnh `node scripts/run-healthclues-game-e2e.mjs` **PASS** sau khi sửa test assumptions đã cũ: Sleep journey trước đây bị test chờ Knowledge/Boss Nutrition; test cũng cố click Nutrition Garden dù yêu cầu mới khóa sáu vùng. Run cuối xác nhận luồng cô lập onboarding/resume, callback identity mô phỏng, đúng một World và cùng ID sau reload, Knowledge, Sleep Boss, rewards/unlocks, Toolkit/Collection, Check-in/Journal, Community/privacy, browser desktop/mobile và cleanup fixture. Không phải xác minh email Supabase thật.
