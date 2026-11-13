# HealthClues — Gemini real-time Wellness Advisor

## Cập nhật mới nhất — 2026-10-31

- Đã xác định file cấu hình thực tế là `D:\botly\App\secrets\healthclues-owner-demo.env`, có các biến không rỗng cho key/provider/model. Root cause của `AI_UNAVAILABLE`: launcher trước đó tìm ở `D:\botly\secrets\healthclues-owner-demo.env`, không phải thư mục `App/secrets`.
- Đã sửa launcher nạp đúng file **sau build**, chỉ vào Node server runtime. Build environment loại `GEMINI_API_KEY`, `GEMINI_MODEL`, `HEALTHCLUES_ADVISOR_PROVIDER`; không dùng `NEXT_PUBLIC_*`. File nằm ngoài `public/`; launcher không đóng gói thư mục secrets vào browser asset. Đã thêm `/App/secrets/` vào `.gitignore`; file được ignore và không nằm trong Git index.
- **Không gọi Gemini / không có model thực tế được dùng.** Giá trị key vô tình xuất hiện trong output công cụ của một lệnh dò tìm quá rộng; key hiện tại được xem là đã lộ. Vì vậy không kiểm thử API bằng credential đó. Hãy thu hồi/rotate credential và thay giá trị trong chính file hiện hữu trước smoke test. Đây là biện pháp bảo vệ key hiện có, không cần tạo tài khoản mới.
- Model cấu hình trong file là `gemini-3.8-flash`; khả dụng của model với key **chưa xác minh**. Không có request/response ID, checklist Gemini, Plan persistence qua Gemini hay URL build mới để báo PASS. Build trước 3273 không nạp đường dẫn này và không được xem là Gemini build.
- `.env.local`, Supabase local/production, dữ liệu, container, volume và demo builds không bị thay đổi trong lần kiểm tra này. Sau khi key được rotate: chạy launcher đã sửa ở cổng loopback còn trống, thử inference bằng profile tổng hợp, rồi mới chạy Chromium Quiz → checklist → confirm → Quests.

**Ngày kiểm tra:** 2026-10-31  
**Build local:** `app-build-gemini-advisor-20261031`  
**URL đã xác minh:** `http://127.0.0.1:3271/play`  
**Đánh giá:** **PARTIAL — chưa có Gemini key nên chưa có inference thật.**

## Phạm vi thay đổi

- Quiz Plan Builder gọi `POST /api/healthclues/wellness-advisor` bằng structured Quiz profile đã lưu trong tab. UI nhận các trạng thái `GEMINI_AI`, `AI_UNAVAILABLE` và `DETERMINISTIC_DEMO`; lỗi không thay bằng deterministic checklist.
- Route Node.js server-only dùng SDK chính thức `@google/genai`. Gemini chỉ chọn tối đa sáu `candidateId` và mã fact từ danh sách server cung cấp. Server chỉ dựng suggestion từ candidate của Catalog; response của model không được tự viết title, nội dung y tế, nguồn, liều hoặc mục tiêu.
- Nguồn chỉ được nạp từ API Catalog hiện có, vốn truy vấn item active/reviewed/current version; route Advisor tiếp tục loại TEST ONLY, không đủ nguồn HTTPS, không đúng topic, không eligible, safety chưa rõ và nội dung onboarding ngoài phạm vi everyday wellness. Model output được kiểm tra Zod, ID, trùng lặp và fact-reference; explanation sinh từ dữ liệu Quiz đã cho.
- Có UUID theo Quiz request, dedupe request ID, rate cap 8 lần/10 phút, giới hạn hai request đồng thời, giới hạn thời gian và retry SDK tối đa hai attempt cho lỗi mạng/429/5xx. Log chỉ có request/response ID, provider/model, token count, số candidate/kết quả, outcome và duration; không ghi profile hoặc prompt.
- Owner Demo launcher lọc Gemini env khỏi build, chỉ nạp cấu hình file private sau khi build vào tiến trình server. Không thay `.env.local`, không đổi schema hay ghi DB khi build.

## Môi trường và cấu hình

Preflight read-only xác nhận local project `healthclues-owner-demo`, API `http://127.0.0.1:54321`, Supabase CLI `2.122.0`, Auth/REST/Mailpit reachable; không phát hiện remote Supabase env kế thừa. Bản build dùng runtime config dành riêng cho Owner Demo; reuse mode không chạy migration, seed, reset hoặc dừng container.

Đường dẫn đã được tạo sẵn và được `.gitignore` bỏ qua:

`D:\botly\secrets\healthclues-owner-demo.env`

File **chưa tồn tại** ở lần kiểm tra; không có API key trong process environment. Owner tự tạo file với nội dung:

```dotenv
GEMINI_API_KEY=<private Gemini API key>
GEMINI_MODEL=gemini-3.8-flash
HEALTHCLUES_ADVISOR_PROVIDER=gemini
```

Không gửi key qua chat, không thêm vào `.env.local`, không đặt biến `NEXT_PUBLIC_*`. Launcher dùng key chỉ tại runtime server. Model mặc định trong source là `gemini-3.8-flash`; model thật sẽ chỉ được báo sau khi Gemini trả response có `modelVersion`.

## Content coverage

Read-only Catalog API trên cùng local project trả 14 item và tất cả 14 được gắn `demoOnly`; số item không-demo vừa recommendation-eligible vừa có nguồn là **0**. Với truy vấn chính xác theo topic tag Gout, Sleep và General Wellness, số ứng viên đạt điều kiện cũng là **0**. Habit templates Gout/Sleep hiện có đều TEST ONLY/not human-reviewed và Advisor cố ý không dùng chúng.

Do đó, kể cả khi cấu hình Gemini thành công, những topic chưa có Catalog knowledge được duyệt sẽ nhận checklist rỗng/truthful coverage gap. Không được đánh dấu fixtures là approved để lấp chỗ trống. Điều này là blocker nội dung riêng, không thể chữa bằng AI.

## Kết quả xác minh

### Lượt xác minh cuối trên build 3271

`node scripts/test-healthclues-gemini-advisor-unavailable.mjs` chạy Chromium thật trên local Owner Demo và trả `PASS_UNAVAILABLE_NO_FALLBACK`: project ID khớp `healthclues-owner-demo`; profile Sleep chỉ là dữ liệu tổng hợp; browser phát đúng 1 POST tới Advisor; request ID metadata `23c3e295-8834-4f61-8ce5-b5bf48c087db`; server trả HTTP 503 do provider chưa cấu hình; DOM báo `AI_UNAVAILABLE`, không có suggestion và nêu rõ không thay deterministic list. Không có request Gemini, response ID từ Google, model response hay lần lưu Plan trong lượt này. Ảnh desktop 1440×900 và mobile emulation 390×844 đã được mở kiểm tra; đây là ảnh unavailable-state.

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| SDK `@google/genai` cài trong server project | IMPLEMENTED | `npm ls @google/genai --depth=0` → `2.32.0`; dependency/lockfile cập nhật |
| Local-only config isolation | IMPLEMENTED | preflight Owner Demo PASS; launcher nạp đúng private path sau build; key file chưa tồn tại |
| Strict source/safety/schema gate | IMPLEMENTED, source-reviewed | route chỉ chọn Catalog IDs; hard safety/content filters; Zod + candidate/fact validation |
| Plan Builder trạng thái truthful và không fallback | BROWSER VERIFIED | Chromium trên 3271 gửi một POST; route trả 503 khi thiếu key; UI báo `AI_UNAVAILABLE`, 0 suggestion, không hiện checklist deterministic giả |
| Safety/rules regression | UNIT TESTED | `node scripts/test-healthclues-wellness-plan.mjs` PASS, 42 assertions; đây là test logic hiện hữu, không chứng minh Gemini |
| Focused ESLint | PASS | route/component/feature/launcher/browser harness; 0 lỗi và 0 cảnh báo sau sửa test harness |
| `tsc --noEmit` | PARTIAL | không có lỗi trong file Advisor; chỉ còn lỗi stale `.next/types/validator.ts` ở baseline root |
| Isolated Owner Demo build | PASS | `app-build-gemini-advisor-20261031` chạy ở 3271; cổng 3270 và demo cũ vẫn nguyên |
| Gemini API inference / response ID / model output | BLOCKED | private file absent; chưa gửi request và chưa trả tiền/API call |
| 4 synthetic profiles, AI output/browser checklist | NOT RUN | không thể thử real provider khi chưa có key; không dùng real health profile |
| Plan confirmation, World/Quests persistence và isolation qua Gemini | NOT RUN | cần real validated candidate response và synthetic authenticated browser flow |
| Desktop/mobile screenshot của trạng thái unavailable | BROWSER VERIFIED + VISUALLY INSPECTED | `reports/previews/gemini-advisor-unavailable-desktop-20261031.png`, `reports/previews/gemini-advisor-unavailable-mobile-20261031.png`; ảnh chỉ thể hiện provider unavailable, không phải checklist Gemini |
| Production | NOT ENABLED | không deploy, không production credentials/data |

## Nguồn thay đổi

- `src/app/api/healthclues/wellness-advisor/route.ts`
- `src/components/healthclues/WellnessPlanBuilder.tsx`
- `src/features/healthclues/wellness-plan.ts`
- `scripts/start-healthclues-owner-demo.mjs`
- `scripts/test-healthclues-gemini-advisor-unavailable.mjs`
- `package.json`, `package-lock.json`
- canonical HealthClues specs và `CURRENT_STATE.md`

## Bước tiếp theo chính xác

Owner tạo file private theo mẫu trên, chỉ dùng synthetic accounts/data và xác nhận model/provider có thể xử lý dữ liệu Quiz. Sau đó rebuild riêng Owner Demo trên cổng còn trống, chạy bốn profile synthetic với response ID thật, kiểm tra zero fabricated IDs/sources, xác nhận Plan → World → Quests/reload và cross-account denial. Hiện chưa thể tuyên bố REAL-TIME GEMINI PASS hay end-to-end Plan acceptance.
