# Milestone 09D-R — kiểm tra gameplay Region Map

Ngày kiểm tra: 2026-10-29. Kết quả tổng thể: **PARTIAL**. Bản demo owner cô lập mới: [http://127.0.0.1:3247/play](http://127.0.0.1:3247/play). Inbox Mailpit cục bộ: [http://127.0.0.1:54324](http://127.0.0.1:54324).

## Tóm tắt triển khai

`RegionMapScene` giữ renderer React/DOM/CSS hiện có nhưng thay nền đa giác tĩnh bằng hai môi trường fantasy vẽ tay đã tối ưu WebP. Nhân vật di chuyển liên tục theo lưới walkable/path A*, camera theo nhân vật có easing và giới hạn biên, Luna/Lumi đi theo, NPC có sprite riêng. Chọn landmark bắt đầu hành trình đi bộ; nút Talk/Interact chỉ hiện khi nhân vật tới vùng tương tác. Overlay React mở sau thao tác Talk và khi đóng giữ nguyên vị trí/camera. Không thêm game engine hay migration.

## Ma trận nghiệm thu

| Hạng mục | Triển khai | Browser kiểm tra | Kết quả |
|---|---|---|---|
| Sleep Valley môi trường vẽ tay | Có | Chromium owner demo; ảnh đã xem | PASS cho lát cắt hiện tại |
| HealthClues Realm môi trường riêng | Có | Chromium render/Gout continuity; ảnh có | PARTIAL: chưa duyệt art production |
| Click đích và di chuyển liên tục | Có | tọa độ avatar đổi khi đang đi | PASS |
| Camera theo người chơi | Có | camera tọa độ đổi trong lúc đi | PASS |
| Pet theo người chơi | Có | tọa độ Pet cập nhật; kiểm tra khoảng cách | PASS |
| Tới gần mới có Talk | Có | không có nút khi đang đi; có khi tới đích | PASS |
| NPC Herbal, Activity, Wellness | Có | Sleep: tới từng trạm; Activity/Herbal Talk flow | PASS cho interaction được chạy |
| Mở/đóng Encyclopedia | Dùng panel nghiệp vụ hiện có | Herbal mở sau Talk, đóng về scene | PASS cho station đã chạy |
| Safe path / collision hoàn chỉnh | Path corridors + A*; lỗi đường không fallback xuyên thẳng | Chưa có test browser độc lập cho từng vật cản | PARTIAL |
| Region Health/Gout | Lumi giữ topic đã lưu | Auth browser flow nhận đúng Gout, không hỏi lại | PASS cho continuity; di chuyển từng NPC chưa đủ bằng chứng |
| Touch/pinch trên thiết bị thật | Touch/pinch code có | Chromium mobile viewport; chưa thiết bị vật lý | PARTIAL |
| FPS/performance | Dùng RAF, không rerender React mỗi frame | Chưa đo FPS | NOT VERIFIED |
| Auth/World ID/owner isolation | Không đổi logic; chạy regression | Mailpit/Auth local, reload cùng World, tài khoản khác bị chặn | PASS cho test đã chạy |

## Kết quả browser thật

Lệnh: `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3247'; node scripts/test-healthclues-owner-auth-demo.mjs`.

Kết quả: `PASS`; test xác nhận `playerCoordinatesChanged`, `cameraFollowed`, `petFollowed`, `talkRequiresArrival`, `runtimeErrors: 0`, local email capture, tài khoản Auth xác nhận, World ID ổn định sau reload, Overworld có 8 vùng / 6 Coming Soon, Gout được khôi phục cho Lumi, guest request bị từ chối (401), Care Plan tài khoản khác bị chặn (404), callback lỗi được xử lý. Không có yêu cầu mạng production trong cấu hình demo.

Test dùng local Supabase hiện có ở loopback `54321/54322` và Mailpit `54324`, volume demo `healthclues-owner-demo`. Không dùng `.env.local`, production Supabase hay dịch vụ gửi mail bên ngoài. Test tạo thêm synthetic account/Care Plan trong volume demo và không xóa dữ liệu owner.

## Ảnh chụp thực tế

Ảnh lấy từ build owner `09d-r6` tại URL trên; chiều rộng desktop 1440, mobile 390:

- [Sleep Valley đang đi giữa đường](previews/09dr-sleep-walk-mid-route-desktop.png)
- [Tới NPC Botanist, Talk đã sẵn sàng](previews/09dr-sleep-botanist-arrival-desktop.png)
- [Tới NPC Activity trên viewport mobile](previews/09dr-sleep-activity-arrival-mobile.png)
- [Tới Wellness Sanctuary](previews/09dr-sleep-sanctuary-arrival-desktop.png)

Các ảnh được mở và xem trực tiếp. Nền Sleep đã làm sạch các nhân vật tĩnh bị trùng với sprite tương tác. Một bản trước đó được giữ trong lịch sử preview, nhưng nghiệm thu này dựa vào ảnh cùng tên được ghi lại từ build cuối.

## Files và thay đổi

- `src/features/healthclues/RegionMapScene.tsx`: world scene, movement, path graph, camera follow, NPC approach/Talk, actor animation, controls.
- `src/features/healthclues/WorldAdventureScene.tsx`: dừng simulation khi panel mở; tiếp tục guide bằng di chuyển tới trạm.
- `src/features/healthclues/world-adventure.css`: layer scene/actor, walk cycle và responsive overlay.
- `scripts/test-healthclues-owner-auth-demo.mjs`: kiểm tra tọa độ, camera, Pet và Talk proximity; lưu ảnh movement.
- `App/start-game-demo.bat`: dùng build/cổng owner demo 09D-R đã kiểm tra.
- `public/healthclues/assets/regions/`: hai background WebP và ba NPC sprite; `assets/characters/adventurer-walk-cycle.webp`.

Không có thay đổi schema/API, auth, RLS, business/reward logic hoặc production.

## Giới hạn còn lại

- Bản đồ là cảnh 2D được vẽ tay làm một lớp nền; chưa có parallax, depth sorting của mọi vật thể môi trường hay bộ collision polygon tác giả chi tiết. Walkability hiện dựa vào corridor graph, không phải va chạm pixel-accurate.
- Sinh ảnh hỗ trợ nhất quán phong cách nhưng chưa qua art direction/human approval như asset production.
- Hoàn tất gameplay toàn bộ NPC/landmark ở HealthClues Realm, xác nhận điều khiển pinch trên thiết bị vật lý và đo hiệu năng vẫn cần làm.
- Catalog/Knowledge đã review còn rỗng cho các topic fixture này; kiểm tra này không chứng minh nội dung y tế được duyệt hoặc Boss/Rewards hoạt động với nội dung production.

Không kết luận toàn bộ HealthClues hay 09C/09D hoàn tất. Đây là một lát cắt RPG movement có browser evidence, status tổng thể PARTIAL.

## Cách mở lại preview

Owner đã kiểm tra build `app-build-09d-r6` tại cổng 3247. Launcher được cập nhật tại `App/start-game-demo.bat`; chạy file đó để khởi động lại build đã lưu. Để build lại source mới trong PowerShell:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_PORT = "3247"
$env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME = "app-build-09d-r6"
node scripts/start-healthclues-owner-demo.mjs --rebuild
```

Inbox: `http://127.0.0.1:54324`. Demo Auth/DB cần local Docker/Supabase đang chạy; launcher sẽ xác nhận API và inbox local trước khi bật app. Build hiện tại không dùng production `.env.local`.

Xác minh tích hợp cuối (build `app-build-09d-r6`, 2026-10-29): isolated Next production build PASS; focused ESLint exit code 0 (còn 2 warning `@next/next/no-img-element` cho các ảnh local scene/NPC); `node --check scripts/test-healthclues-owner-auth-demo.mjs` PASS; `docs:healthclues:check` PASS; `git diff --check` PASS (chỉ cảnh báo chuyển LF/CRLF ở các file có sẵn). Test chạy đúng URL 3247 và kết quả JSON PASS ở trên.
