# Báo cáo nghiệm thu — Icon fantasy cho My Journey

**Ngày:** 2026-10-31  
**Build local:** http://127.0.0.1:3276/play  
**Môi trường:** Supabase local cô lập `healthclues-owner-demo` (API `127.0.0.1:54321`)

## Kết quả

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Tích hợp icon inventory, giữ Lucide cho action | PASS | Bốn SVG Game-icons; source/license/attribution có trong asset folder |
| Build và lint | PASS | Isolated Next build thành công; ESLint 0 lỗi, 3 cảnh báo `<img>` hiện hữu |
| Ba section My Journey luôn mở, không tab/accordion | PASS | Chromium E2E assertions và ảnh desktop/mobile |
| Dữ liệu thật, trạng thái empty và TEST ONLY | PASS | Plan/Quiz/equipment đọc từ World; không có item giả; practice fixture hiện nhãn TEST ONLY |
| NPC/walking, RPG và persistence regression | PASS | Full `test-healthclues-owner-auth-demo.mjs`, `result: PASS`, `runtimeErrors: 0` |
| Botanist herb đã trang bị và persist | PARTIAL | Demo hiện không có herb đủ điều kiện để trang bị; kiểm thử empty state, không tự tạo dữ liệu |
| So sánh với hình tham chiếu được chỉ định | BLOCKED | `design/references/HEALTHCLUES_MY_JOURNEY_REFERENCE.png` không tồn tại |

## Tài sản và giấy phép

Đã tải từ Game-icons.net tại revision `82d948812bfe3f269ef8f731dcdb07b08160edc4`:

| Tài sản | Tác giả | Vị trí dùng |
|---|---|---|
| Backpack | Delapouite | Nút My Journey bên dưới World Map |
| Checklist | Delapouite | Tiêu đề và dòng Daily Checklist |
| Herbs bundle | Delapouite | Herbs Equipped; Botanist |
| Lotus | Lorc | Practices Equipped; Wellness Guide |

Cả bốn icon theo CC BY 3.0. Bản dùng trong app bỏ nền vuông đen và đổi fill sang `currentColor` để tô màu UI. Attribution, đường dẫn nguồn và ghi chú chuyển đổi được lưu tại [`ATTRIBUTION.md`](../../public/healthclues/assets/ui/my-journey/ATTRIBUTION.md) cùng `SOURCE_REVISION.txt`. Kenney không được tải vì UI hiện tại đã dùng phong cách nền rừng và viền vàng phù hợp; không thêm dependency. Lucide React tiếp tục phục vụ thao tác chức năng.

## Thay đổi mã nguồn

- `src/components/healthclues/HealthCluesGameIcon.tsx`: component nhỏ ánh xạ tên icon sang SVG, áp dụng CSS mask và ba tông màu.
- `src/features/healthclues/RegionMapScene.tsx`: dùng Backpack fantasy cho nút My Journey, giữ biểu tượng Backpack Lucide ở action Toolkit riêng.
- `src/features/healthclues/WorldAdventureScene.tsx`: thay icon section/row cho Checklist, Herbs và Practices. Không đổi lọc dữ liệu, nguồn Plan, trạng thái, API hay quyền truy cập.
- `src/features/healthclues/WellnessEncyclopediaStation.tsx`: thêm biểu tượng role cạnh tên Botanist/Wellness Guide; giữ portrait NPC gốc.
- `src/features/healthclues/world-adventure.css`: mask sizing, sắc độ gold/green/lavender, kích thước và trình bày đồng bộ.
- `public/healthclues/assets/ui/my-journey/`: bốn SVG và thông tin nguồn/giấy phép.

Không đổi schema, Plan, Toolkit/equipment, NPC eligibility, World IDs, artwork bản đồ hoặc tiến trình game.

## Browser và visual QA

Đã kiểm tra preflight: project ID đúng `healthclues-owner-demo`; URL API, Auth, REST và Mailpit đều local; không phát hiện remote Supabase env kế thừa. Launcher dùng `--reuse-existing-supabase`, không migration/seed; volume được giữ nguyên. Build chạy riêng trên cổng trống 3276.

Full Chromium E2E sử dụng `scripts/test-healthclues-owner-auth-demo.mjs` trên build mới và dữ liệu synthetic/local, cho kết quả `PASS`, không có lỗi runtime. Bao gồm World entry/tour, My Journey focus, mở panel, Plan thật hoặc empty state, desktop/mobile, equipment từ NPC, Backpack/Collection, Care Plan/account isolation, Daily Companion, Knowledge/minigame/Skills, Boss/Rewards, di chuyển và persistence. Ảnh practice đã trang bị là fixture TEST ONLY được lưu qua luồng NPC thật; không được coi là khuyến nghị chuyên môn.

Đã mở ảnh và kiểm tra bằng mắt: drawer giữ bản đồ nhìn thấy ở cạnh trái desktop; mobile dùng cuộn dọc liên tục; ba tiêu đề luôn có mặt đồng thời; tông màu giúp phân biệt checklist, herbs và practices; không thấy tràn ngang. Nội dung dài hơn cuộn trong panel. Ảnh xác nhận cả các section rỗng trung thực và practice fixture có provenance TEST ONLY.

Ảnh nghiệm thu:

- [World và nút My Journey](previews/my-journey-icons-20261031/owner-my-journey-navigation-desktop.jpg)
- [Panel có Wellness Focus, confirmed Plan và đủ ba section](previews/my-journey-icons-20261031/owner-my-journey-confirmed-desktop.jpg)
- [Panel empty Plan — desktop](previews/my-journey-icons-20261031/no-plan-gout-my-journey-actual-goals-desktop.jpg)
- [Panel empty Plan — mobile 390×844](previews/my-journey-icons-20261031/no-plan-gout-my-journey-actual-goals-mobile.jpg)
- [Practice thật từ NPC, trạng thái TEST ONLY — desktop](previews/my-journey-icons-20261031/owner-my-journey-npc-practice-equipped-desktop.jpg)
- [Practice thật từ NPC, trạng thái TEST ONLY — mobile 390×844](previews/my-journey-icons-20261031/owner-my-journey-npc-practice-equipped-mobile.jpg)
- [Tutorial spotlight nút My Journey](previews/my-journey-icons-20261031/no-plan-gout-my-journey-spotlight-desktop.jpg)
- [Spotlight Botanist](previews/my-journey-icons-20261031/no-plan-gout-botanist-spotlight-desktop.jpg)
- [Wellness Guide spotlight — mobile](previews/my-journey-icons-20261031/no-plan-gout-wellness-practice-spotlight-mobile.jpg)

## Giới hạn tham chiếu

Đường dẫn bắt buộc `D:\botly\App\design\references\HEALTHCLUES_MY_JOURNEY_REFERENCE.png` không có trên đĩa. Có một file cùng tên dưới `D:\botly\App\references\`, nhưng không dùng nó làm bản thay thế vì yêu cầu chỉ định đường dẫn chính xác. Vì vậy phần hình ảnh được đánh giá theo yêu cầu bằng chữ và UI hiện hữu; không tuyên bố đã đối chiếu trực tiếp với ảnh tham chiếu.

## Giới hạn còn lại

- Demo không có herb đủ điều kiện thiết bị từ Botanist; trạng thái rỗng đã được kiểm chứng. Herb equipment cụ thể cần fixture hợp lệ/đủ điều kiện riêng ở môi trường cô lập trước khi nghiệm thu persistence của một herb.
- Mobile được xác minh bằng Chromium emulation, không phải thiết bị vật lý.
- Các cảnh báo `<img>` lint đã có ở artwork/NPC portrait; không phát sinh lỗi icon mới.
- Chưa deploy và không có thao tác production.
