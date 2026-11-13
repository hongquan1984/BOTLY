# MASTER PROMPT CHO CODEX — HEALTHCLUES V1

> Dán toàn bộ nội dung này cho Codex trong `D:\botly`. Nếu đã đặt `HEALTHCLUES_QUIZ_BANK_V1.md` vào thư mục dự án, hãy đọc file đó và giữ nguyên câu hỏi gốc. Nếu không có file, yêu cầu người vận hành dán nội dung ngân hàng câu hỏi; KHÔNG tự nhận là đã đọc file chưa tồn tại. Bản prompt này là quy trình triển khai, không phải lệnh tự ý triển khai sản phẩm lên production.

## Mục tiêu và quy tắc bất biến

Bạn là Codex, kỹ sư tích hợp cho website Botly hiện có. Xây Phase 1: **HealthClues Personal Wellness Discovery Quiz**, theo hướng web-only, khách quốc tế. KHÔNG làm mobile app, subscription, agent nghiên cứu tự động hoặc dashboard bản đầy đủ trong Phase 1.

**Ưu tiên tuyệt đối:** (1) đọc mã và xác định cấu trúc thực tế; (2) LƯU tài liệu tổng thể và đặc tả quiz trước khi sửa code; (3) xây quiz Phase 1; (4) kiểm thử và báo cáo bằng tiếng Việt. Không tạo file đường dẫn giả, không tuyên bố chạy thành công nếu chưa thực sự thử. Giữ nguyên website production, quiz insomnia, nội dung SEO, Supabase công khai và các workflow đang chạy. Không xóa dữ liệu, không `force push`, không tự `deploy`.

Khách truy cập chỉ thấy **ENGLISH**. Chủ dự án xem trong **admin/preview bản câu hỏi EN + dòng `Ghi chú VN` ngay bên dưới**, cùng tên đáp án tiếng Anh. Nút chuyển *Admin notes: Show/Hide* có thể dùng trong preview có bảo vệ quyền; tài liệu Markdown luôn có notes. Không bao giờ hiển thị các note VN ở UI public, trong page source hoặc endpoint public trả về quiz schema. Dữ liệu `note_vi` chỉ trả qua endpoint quản trị có phân quyền hoặc được giữ trong tài liệu nội bộ.

## PHẦN 0 — AUDIT (đọc trước, không sửa)

1. Chạy kiểm tra an toàn repo: xác định root, `git status`, nhánh hiện tại, cấu trúc Next.js, package manager, lệnh test/lint/typecheck, các route hiện có cho `/en/wellness/*`, HealthClues/Health Tips, quiz insomnia, thành phần form, auth và DB.
2. Kiểm tra xem có quiz/assessment framework sẵn, nơi lưu user profile và admin preview sẵn hay chưa. Tái sử dụng chứ không tạo duplicate. Kiểm tra quyền truy cập Supabase, RLS, migrations; KHÔNG in secret/token lên log hoặc tài liệu.
3. Liệt kê rủi ro ảnh hưởng production. Nếu repo đang có thay đổi của người khác, không tự ghi đè.
4. Báo tóm tắt phát hiện dưới dạng nhật ký tiếng Việt trong docs trước khi sửa code.

## PHẦN 1 — BẮT BUỘC LƯU QUY TRÌNH VÀ ĐẶC TẢ TRƯỚC KHI CODE

Tạo thư mục nếu chưa tồn tại: `docs/healthclues/`. Tạo/cập nhật đúng các file (nếu đã có, đọc và đối chiếu trước, không ghi đè mất thông tin):

- `docs/healthclues/00_PRODUCT_VISION_V1.md`: định vị web companion, mục đích, đối tượng, lợi ích, ranh giới không chẩn đoán, hành trình SEO/ebook → quiz → hồ sơ → daily dashboard → check-in → personalization → retention → premium; tính năng Free/Premium; KPI Weekly Meaningful Check-ins; ngôn ngữ EN public / VN admin.
- `docs/healthclues/01_PHASE_ROADMAP_V1.md`: Phase 1 quiz + profile; Phase 2 dashboard nội dung mẫu đã rà soát + check-in; Phase 3 cập nhật nghiên cứu theo chủ đề và phân phối có kiểm duyệt; Phase 4 email / retention / thống kê; Phase 5 thu phí sau kiểm chứng nhu cầu. Ghi rõ ngoài phạm vi Phase 1.
- `docs/healthclues/02_QUIZ_SPEC_V1.md`: cấu trúc, nhóm câu hỏi, logic nhánh, điều kiện ẩn/hiện, model dữ liệu, chính sách skip, accessibility, consent, điều kiện an toàn, kết quả và acceptance criteria.
- `docs/healthclues/03_QUIZ_QUESTIONS_EN_VI_V1.md`: sao chép đầy đủ ngân hàng câu hỏi EN và ngay dưới mỗi câu có note tiếng Việt trong file `HEALTHCLUES_QUIZ_BANK_V1.md`; có đáp án tiếng Anh và ID ổn định. KHÔNG tự dịch rồi thay bằng bản khác nếu đã có file chuẩn.
- `docs/healthclues/04_IMPLEMENTATION_LOG_V1.md`: repo audit, những thay đổi thực hiện, migration, test, tính năng còn thiếu và ảnh chụp/trạng thái nếu có.

**Điểm dừng bắt buộc:** xác thực rằng 5 file trên đã ghi được ra đĩa và chứa nội dung thực tế, sau đó mới bắt đầu code Phase 1. Không chỉ thông báo “đã lưu” bằng lời.

## PHẦN 2 — TRIỂN KHAI CHỈ PHASE 1 QUIZ

### A. Public UX

- Trang quiz mới theo cấu trúc route thực tế của website (ưu tiên `/en/wellness/healthclues/quiz` nếu không trùng kiến trúc hiện hữu; nếu route đang khác thì ghi lý do trong log).
- Mobile-first, SEO metadata phù hợp; giao diện khách chỉ tiếng Anh; tiêu đề `Build Your Wellness Discovery Profile`, mô tả rõ không phải y tế.
- Bước nhanh C01–C10 (8–10 câu thực tế vì có thể có câu tự động hay tùy chọn), có progress bar, Back/Next, validation và Skip cho câu nhạy cảm; xem trước kết quả khách vãng lai mà không lưu nhạy cảm.
- Bước Deep Personalization: tổng cộng khoảng 12–20 câu được chọn từ C11–C33 VÀ nhánh chủ đề (tối đa 7 câu nhánh); không bắt mọi người trả lời đủ 40 câu. Có thể Skip all, Save and continue later nếu xác thực/đồng ý.
- Kết quả `Discovery Profile` gồm: chủ đề quan tâm (không phải chẩn đoán), nội dung ưa thích, thời gian có thể dành, sở thích công thức, tần suất dashboard. Có `Why these topics?`, `Edit answers`, `Start discovering` (chỉ dẫn tới preview hợp lệ, không giả mạo dashboard đầy đủ).
- Nếu chọn ngoài phạm vi V1 hoặc không muốn khai báo sức khỏe: dùng nhánh General wellness đã định nghĩa, tuyệt đối không đoán bệnh.
- Không hỏi địa chỉ/GPS cụ thể; quốc gia optional. Không tính điểm hàn/nhiệt, chẩn đoán, risk score, lựa chọn thuốc, liều dùng, thảo dược chữa bệnh.

### B. Preview/admin

- Trang **admin-only** xem đầy đủ bank câu hỏi và flow; ngay sau EN question là `Ghi chú VN: ...`; thấy đáp án EN và logic/điều kiện hiển thị, có tìm theo ID.
- Có nút toggle notes VN trong preview; mặc định bật ở admin. Public API / UI không được để lộ notes Việt.
- Giao diện quản trị và thông báo cho người sở hữu dự án dùng tiếng Việt.

### C. Data và bảo mật

- Thiết kế database theo kiến trúc hiện có, dùng migrations có thể rollback; ưu tiên lưu `question_id`, `answer_value`, `schema_version`, timestamp, consent_version, `topic_interest` tách biệt `diagnosis_status`.
- Trước các câu liên quan chẩn đoán/triệu chứng cần có giải thích mục đích, tùy chọn bỏ qua và cơ chế đồng ý thích hợp. Guest preview: chỉ giữ trong state của browser, không ghi dữ liệu sức khỏe lên analytics/log. Lưu hồ sơ chỉ sau khi đăng nhập/đăng ký và có đồng ý phù hợp. Email marketing opt-in RIÊNG, mặc định OFF.
- RLS owner-only, mã hóa phù hợp, không gửi dữ liệu sức khỏe nhạy cảm sang analytics hoặc model endpoint không cần thiết; quyền export/edit/delete data; không dump câu trả lời nhạy cảm ra logs.
- Trường hợp cảnh báo an toàn: không tạo khuyến nghị điều trị hoặc kế hoạch tự dùng; hiển thị thông điệp giáo dục an toàn phù hợp, khuyên tìm dịch vụ y tế đúng lúc.
- Nếu tích hợp DB/auth hiện tại chưa cho phép an toàn, ưu tiên hoàn thiện UI quiz + mock persistence có ghi chú rõ ràng, KHÔNG tuyên bố đã lưu được user data.

### D. Acceptance tests

1. Giao diện public 100% EN, kể cả options, validation, consent, buttons và kết quả. Notes VN chỉ ở docs/admin, không lộ trong public HTML/API.
2. C01 tuổi <18 kết thúc flow phù hợp; không lưu hồ sơ sức khỏe.
3. C04 = Gout mở câu G01–G07; Healthy weight mở W01–W07; Sleep mở S01–S07; các chủ đề khác mở F01–F07.
4. Không bao giờ diễn giải C05 hoặc G01 là hệ thống chẩn đoán bệnh.
5. Thao tác Back/Next/Skip giữ lựa chọn, đổi câu C04 làm sạch câu trả lời nhánh cũ.
6. Các cảnh báo C24/C25/C32/C33 và G03/S06 không bị bỏ qua bởi kết quả, không tạo gợi ý dùng thuốc hoặc thực phẩm bổ sung cá nhân.
7. Có tiến trình, responsive, keyboard accessibility, empty/error/loading state.
8. Có kiểm thử unit logic nhánh/consent + lint/typecheck/build nếu môi trường hỗ trợ; ghi rõ lệnh và kết quả thực tế.
9. Quiz insomnia cũ, SEO và website hiện hữu không bị phá; không deploy.

## PHẦN 3 — OUTPUT CODEx PHẢI BÁO CÁO

Khi xong, báo bằng TIẾNG VIỆT theo cấu trúc:
(1) Đã lưu các tài liệu nào (đường dẫn tuyệt đối thực tế);
(2) Repo hiện tại và route triển khai quiz;
(3) Số câu Core / nhánh, số câu thực tế người dùng phải trả lời;
(4) Tính năng hoàn thành/chưa hoàn thành;
(5) Các migration (nếu có) và tính tương thích;
(6) Các lệnh test đã chạy và kết quả;
(7) Cách chạy local và kiểm tra màn hình public/admin;
(8) Những điểm cần người vận hành duyệt trước deployment.

KHÔNG tự làm Phase 2–5. Nếu chưa có ngân hàng câu hỏi đầy đủ, không tự bịa nội dung y khoa; hãy dùng chính tệp `HEALTHCLUES_QUIZ_BANK_V1.md` được cung cấp và lưu đầy đủ trong đặc tả trước khi code.
