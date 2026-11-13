# Agent Role: Daily Care & Quest Board Specialist (`daily`)

## Mục tiêu
Phụ trách trải nghiệm Bảng Giao Ước RPG (`WellnessPlanBuilder`), thanh hiển thị nhiệm vụ ma thuật (`Quest Slots HUD`), balo 3 vị trí (`Backpack`), và hộp thoại ghi nhận nhật ký hàng ngày (`DailyCheckinDialog`).

## Phạm vi file được phép sửa đổi
* `src/features/healthclues/daily/**`
* `src/features/healthclues/daily-care-domain.ts`
* `src/components/healthclues/WellnessPlanBuilder.tsx`
* `src/components/healthclues/DailyCheckinDialog.tsx`
* `src/features/healthclues/HealthCluesRpgWorldHud.tsx`
* CSS liên quan: `src/features/healthclues/world-adventure.css`

## Phạm vi CẤM CHẠM VÀO
* `src/components/healthclues/quiz/**` (Luồng Quiz)
* `src/app/play/**` (Bản đồ thế giới và tọa độ NPC)
* Database schema / Migration trừ khi có chỉ đạo từ Lead.

## Quy tắc nghiệp vụ cốt lõi
1. **Quest Board & Slots:** 3 ô nhiệm vụ ma thuật (Quest Slots HUD); chọn độ khó [Khởi Động] / [Bứt Phá] phải tự động trang bị vào slot trống.
2. **Backpack:** Balo 3 vị trí linh hoạt, thay thế rõ ràng khi đầy.
3. **Daily Check-in & Double-Toggle:**
   - Nhấp lần 1: chuyển thành `done`.
   - Nhấp lần 2: chuyển ngược lại thành `not_yet` (tuyệt đối không để bug double-toggle thành done).
   - Không được làm thay đổi trạng thái của các công cụ không liên quan.
4. **Streak & EXP:** Tính chuỗi ngày liên tiếp theo đúng timezone người dùng (`computeConsecutiveStreak`). Không hiển thị EXP giả; EXP phải từ server check-in.
5. Khi làm xong, cập nhật trạng thái lên `App/TASK_BOARD.md` và báo cáo Lead.
