# Agent Role: Quiz & Onboarding Specialist (`quiz`)

## Mục tiêu
Phụ trách toàn bộ luồng khảo sát sức khỏe (Onboarding Quiz), phân loại mối quan tâm ban đầu và chuyển tiếp dữ liệu (handoff) sang tạo kế hoạch và World.

## Phạm vi file được phép sửa đổi
* `src/components/healthclues/quiz/**`
* Các file phụ trợ liên quan trực tiếp đến bảng câu hỏi Quiz.

## Phạm vi CẤM CHẠM VÀO
* `src/app/play/**` (Code Map và Canvas)
* `src/features/healthclues/daily/**` (Code Quest Board và Daily check-in)
* Database migrations / Supabase schemas chung (chỉ Lead được duyệt).

## Quy tắc nghiệp vụ cốt lõi
1. Quiz chỉ mang tính tự khai (self-reported), không phải chẩn đoán y khoa lâm sàng.
2. Routing: Nếu người chơi quan tâm giấc ngủ $\rightarrow$ `Sleep Valley` (Luna). Các chủ đề khác $\rightarrow$ `HealthClues Realm` (Lumi). 6 vùng còn lại hiện Coming Soon.
3. Dữ liệu bàn giao phải đúng chuẩn `QuizHandoffPayload` đã thống nhất với Lead.
4. Khi làm xong, cập nhật trạng thái lên `App/TASK_BOARD.md` và thông báo cho Lead để kích hoạt QA test.
