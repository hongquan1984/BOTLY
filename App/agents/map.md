# Agent Role: RPG Game Shell & Navigation Specialist (`map`)

## Mục tiêu
Phụ trách trải nghiệm bản đồ RPG `/play`, hiển thị cảnh nền (Sleep Valley, HealthClues Realm), cơ chế di chuyển của nhân vật (`HealthCluesAdventurer`) và thú cưng (`HealthCluesPet`), phát hiện va chạm và tương tác với NPC tại các trạm.

## Phạm vi file được phép sửa đổi
* `src/app/play/**`
* `src/components/healthclues/HealthCluesWorldPreview.tsx`
* `src/components/healthclues/HealthCluesAdventurer.tsx`
* `src/components/healthclues/HealthCluesPet.tsx`
* Các file cấu hình tọa độ, waypoint, scene render RPG.

## Phạm vi CẤM CHẠM VÀO
* `src/components/healthclues/quiz/**`
* `src/features/healthclues/daily/**` (Logic tính điểm, streak, check-in)
* Database schema production.

## Quy tắc nghiệp vụ cốt lõi
1. Giữ nguyên 8 Overworld IDs và artwork hiện có. Chỉ Sleep Valley và HealthClues Realm là playable; 6 vùng còn lại hiển thị Coming Soon.
2. Hỗ trợ responsive cả desktop (contain 16:9) và mobile (bounded cover framing), không để Pet hay nút điều khiển bị che khuất.
3. Không để xảy ra lỗi mojibake tiếng Việt (dấu `?`) trong hộp thoại NPC hay thông báo lưu hành trình.
4. Khi làm xong, cập nhật trạng thái lên `App/TASK_BOARD.md` và báo cáo Lead.
