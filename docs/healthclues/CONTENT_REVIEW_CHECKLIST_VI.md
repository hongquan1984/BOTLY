# Checklist rà soát nội dung HealthClues

Ngày cập nhật: 2026-10-26

## Kết quả kiểm kê mã nguồn

Nguồn seed tĩnh hiện có **14 mục**, không phải 15: 8 bài hướng dẫn tiếng Anh và 6 ebook khả dụng. Không tự tạo mục thứ 15 để đủ số lượng. Cơ sở dữ liệu Botly được cấu hình cục bộ còn có 73 bản dịch bài viết tiếng Anh đã xuất bản; chúng là ứng viên động riêng, không mặc nhiên được duyệt. Mọi mục khi nhập phải bắt đầu ở `needs_review` + `draft`.

## Checklist bắt buộc cho từng mục

- [ ] Xác minh URL nguồn mở đúng nội dung và nội dung còn hiện hành.
- [ ] Xác minh quyền sử dụng nội dung, trích dẫn, hình ảnh và ebook.
- [ ] Ghi rõ từng tuyên bố thực tế; đối chiếu nguồn gốc hỗ trợ trực tiếp từng tuyên bố.
- [ ] Phân biệt mối quan tâm wellness với chẩn đoán cá nhân.
- [ ] Kiểm tra ngôn ngữ có hứa hẹn chữa bệnh, giảm chỉ số, thay thế thuốc, liều dùng, tương tác thuốc hoặc hiệu quả lâm sàng không.
- [ ] Kiểm tra đối tượng phù hợp, ngoại lệ, giới hạn và cảnh báo an toàn.
- [ ] Xác minh thời gian và từng bước thực hiện trước khi phân loại là hoạt động/công thức.
- [ ] Gắn chủ đề đúng nội dung thực tế; không gắn Gout, Sleep hoặc Healthy Weight chỉ vì từ khóa phụ.
- [ ] Ghi người rà soát, thời gian và quyết định. Chỉ kích hoạt sau khi hoàn thành mọi mục trên.

## Danh sách ứng viên và hướng rà soát

| ID nguồn | Nội dung | Phân loại ban đầu | Việc cần làm trước khi xem xét kích hoạt |
|---|---|---|---|
| `static-article-balanced-plate-simple` | A balanced plate that keeps healthy eating simple | Có thể trình biên tập rà soát thông thường | Xác minh nguồn, quyền sử dụng, tính linh hoạt khẩu phần và câu cảnh báo nhu cầu y tế cá nhân. Chỉ dùng như nội dung đọc; chưa phải công thức có hướng dẫn. |
| `static-article-three-minute-stress-reset` | A three-minute reset for an overloaded afternoon | Có thể trình rà soát wellness thông thường | Kiểm chứng thời gian thật, bước thực hiện, cảnh báo dừng nếu khó chịu; không mô tả là điều trị lo âu. |
| `static-article-meditation-for-restless-beginners` | Meditation for beginners who think they cannot meditate | Có thể trình biên tập/wellness rà soát | Kiểm tra hướng dẫn, cách diễn đạt về sức khỏe tâm thần và lựa chọn dừng/bỏ qua. |
| `static-article-blood-sugar-pairings` | Blood Sugar & Everyday Pairings: What Food Combinations Teach Us | Cần người có chuyên môn rà soát | Kiểm chứng nghiên cứu ở người, giới hạn kết luận về glucose/insulin và không cá nhân hóa khẩu phần điều trị. |
| `static-article-lentils-rice-blood-sugar` | What happens when lentils replace part of the rice on your plate? | Cần người có chuyên môn rà soát | Kiểm tra thiết kế nghiên cứu, kết cục đo, đối tượng và không gợi ý thay đổi thuốc/điều trị. |
| `static-article-oats-berries-blood-sugar` | What does human research actually say about oats and blood sugar? | Cần người có chuyên môn rà soát | Xác minh nguồn nghiên cứu, liều/lượng trong nghiên cứu không được biến thành chỉ định cá nhân. |
| `static-article-onion-honey-blood-sugar` | Onion and honey: does combining them make sense for blood sugar? | Cần chỉnh sửa và chuyên môn rà soát | Kiểm tra nguy cơ diễn giải thành bài thuốc; xác minh đường huyết và cảnh báo đặc biệt với mật ong/đường. Từ chối nếu nguồn không đủ. |
| `static-article-beans-toast-blood-sugar` | What can beans change in a high-carbohydrate breakfast? | Cần người có chuyên môn rà soát | Xác minh kết luận nghiên cứu, khẩu phần và giới hạn áp dụng; không coi là phương pháp điều trị. |
| `ebook-blood-sugar` | Blood Sugar & Everyday Pairings | Cần người có chuyên môn rà soát | Kiểm tra toàn bộ 15 trích dẫn, quyền PDF và mọi tuyên bố về glucose/insulin; chỉ là tài liệu đọc. |
| `ebook-antioxidants` | Antioxidants on the Plate | Cần người có chuyên môn rà soát | Kiểm tra tuyên bố hấp thu/hiệu quả sinh học, nguồn lâm sàng và quyền sử dụng. Không gọi pairing là liệu pháp. |
| `ebook-weight-management` | Food Combinations for Weight Management | Cần chuyên môn và có thể cần chỉnh sửa | Kiểm tra tuyên bố no/khẩu phần/cân nặng, nguy cơ ngôn ngữ gây hại và quyền tài liệu. Không hứa giảm cân. |
| `ebook-better-sleep` | Food Combinations for Better Sleep | Cần người có chuyên môn rà soát | Phân biệt nghiên cứu dinh dưỡng với điều trị mất ngủ; xác minh nguồn và quyền PDF. |
| `ebook-gout-support` | Food & Gout: What the Evidence Actually Says | Cần bác sĩ/chuyên gia phù hợp rà soát | Kiểm tra purine, acid uric, cherries, vitamin C, tương tác/nguy cơ và câu khẳng định bệnh; không thay thế thuốc hay chăm sóc lâm sàng. |
| `ebook-liver-health` | Food & Liver Health: Beyond Detox Claims | Cần bác sĩ/chuyên gia phù hợp rà soát | Kiểm tra tuyên bố detox, enzyme gan, sulforaphane, nitrate, cà phê và nguy cơ bệnh gan; loại bỏ ngôn ngữ chữa trị không được chứng minh. |

Các ebook trong bảng hiện chưa có danh sách nguồn kiểm chứng trong seed nội dung discovery và không có nguyên liệu, bước thực hiện hay thời lượng. Không trình bày ebook nào như công thức, hoạt động có thời lượng, hoặc lời khuyên cá nhân.

## Quyết định rà soát

- **Duyệt:** Chỉ nội dung đã xác minh nguồn/quyền, chính xác, phù hợp chủ đề, đủ cảnh báo; người rà soát ghi danh tính và thời gian.
- **Yêu cầu chỉnh sửa:** Thiếu nguồn, thiếu giới hạn, diễn đạt quá mức hoặc cần tách phần wellness khỏi tuyên bố y khoa. Vẫn giữ `draft` và không phân phối.
- **Chuyển chuyên môn:** Bất kỳ nội dung nào về bệnh, chỉ số sinh học, thảo dược, tương tác thuốc, giảm cân/điều trị hay hiệu quả lâm sàng. Chưa xác minh chuyên gia thì không duyệt.
- **Từ chối:** Nội dung không có quyền sử dụng, nguồn không thể kiểm chứng, tuyên bố gây hiểu nhầm/điều trị không an toàn, hoặc không thể chỉnh để phù hợp. Giữ không hoạt động.

Đây là checklist hỗ trợ chủ website và người rà soát; không thay cho thẩm định y khoa. Không có mục nào được đánh dấu đã duyệt trong tài liệu này.
