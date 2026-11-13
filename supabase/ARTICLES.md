# Botly: bài viết từ Facebook vào Supabase

Cập nhật: API đã được triển khai trong code và kiểm thử PostgreSQL local.
Hướng dẫn cấu hình/cấp token mới nhất: `PUBLISHING-SETUP.md`.

## Áp dụng

Legacy migration `legacy_migrations/002_wellness_articles.sql` is retained for reference only; do not execute it again.
The timestamped Botly schema baseline in `supabase/migrations/` represents the current application schema.
File chạy trong transaction: nếu lỗi, toàn bộ thay đổi trong migration được rollback.
Chưa áp dụng migration lên Supabase từ workspace này.

## Bốn bảng

| Bảng | Vai trò |
| --- | --- |
| `wellness_categories` | Ba chuyên mục, tên và slug Anh–Việt; đã seed dữ liệu thật theo route hiện tại |
| `wellness_channels` | Facebook Page ID → chuyên mục; chỉ server được đọc/ghi |
| `wellness_articles` | Danh tính bài, chuyên mục, Facebook post ID/URL và ảnh đại diện |
| `wellness_article_translations` | Nội dung, SEO, nguồn tham khảo và trạng thái riêng cho mỗi ngôn ngữ |

Quan hệ: chuyên mục → nhiều kênh và bài viết; một bài → tối đa hai bản dịch.
Page ID chưa được cung cấp nên migration không tạo kênh giả.
`category_id` dùng `weight`, `healing`, `health-tips`, khớp portal hiện tại;
không dùng taxonomy cũ `nourish/calm/mindful` để định tuyến bài mới.

## Hợp đồng cho API sẽ triển khai

1. Xác thực request từ hệ thống đăng video bằng secret riêng ở server.
2. Nhận Facebook Page ID, post ID chuẩn từ kết quả đăng Facebook, permalink,
   thời gian đăng, ảnh và danh sách bản dịch. Dùng nhất quán ID trả về từ API
   Facebook, không trộn video ID, post ID và share URL làm khóa.
3. Tra kênh đang `enabled`; lấy chuyên mục từ mapping, không tin chuyên mục
   tự gửi lên. Khóa ngoại ghép cũng chặn bài thuộc sai chuyên mục của kênh.
4. Trong một transaction/RPC, upsert bài theo `(channel_id, facebook_post_id)`,
   rồi upsert bản dịch theo `(article_id, locale)`. Không xóa ngôn ngữ bị bỏ qua.
   Unique constraint chống tạo trùng khi retry; API cần giữ nguyên slug và
   `published_at` khi chỉ cập nhật lại nội dung. Slug trùng bài khác phải trả 409
   hoặc được tạo hậu tố ổn định; không ghi đè bài khác.
5. Có thể xuất bản ngay với `status = published` và `published_at = now()`;
   mặc định database là `draft` để bản ghi chưa hoàn chỉnh không hiển thị.
   Hai ngôn ngữ được xuất bản độc lập. Thời điểm tương lai chỉ hiển thị khi đến giờ.
6. Trả article ID và URL từng bản dịch, để luồng tự động lưu kết quả và retry
   riêng bước website nếu Facebook đã đăng thành công. Không đăng lại Facebook.

API/RPC đã được viết trong migration 003 và `src/app/api/v1/articles/route.ts`.
Không coi nhiều REST request riêng lẻ là một transaction.
Chỉ backend giữ `SUPABASE_SERVICE_ROLE_KEY`; trình duyệt không được ghi bài.
RLS cho khách đọc chuyên mục và nội dung đã xuất bản, không đọc bản nháp.
Thiết kế quyền dựa trên [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Nội dung và hiển thị

`sections` giữ cấu trúc hiện tại, ví dụ:

```json
[{"title":"Điều cần biết","paragraphs":["Nội dung chi tiết."],"bullets":["Ý chính"]}]
```

`sources`: `[{"label":"Tên nguồn","url":"https://example.org/article"}]`.
API phải kiểm tra schema các phần tử, độ dài payload và URL trước khi lưu;
database hiện kiểm tra kiểu mảng và điều kiện tối thiểu để xuất bản.
Render nội dung dạng text, không chèn HTML thô. `reviewed_at` chỉ ghi khi
thực sự đã được kiểm tra; không tự gắn nhãn chứng cứ hoặc ngày duyệt.

Trang danh sách lọc `category_id` + `locale`, sắp xếp theo `published_at` của
bản dịch. Trang chi tiết tra `(locale, slug)`; tìm bản dịch bằng cùng `article_id`.
Giữ URL `/en/wellness/guides/[slug]` và `/vi/song-khoe/huong-dan/[slug]`.
Frontend cần thay nguồn dữ liệu tĩnh bằng truy vấn Supabase, cập nhật sitemap
và cơ chế cache để bài mới xuất hiện mà không phải deploy.

## Kiểm tra trước khi nối production

- Migration chạy thành công trên project thử nghiệm.
- Retry cùng Page/post không tạo bài mới; một bài có cả EN và VI.
- Bài sai mapping kênh/chuyên mục và slug trùng bị từ chối.
- Role `anon`/`authenticated` chỉ đọc bản published đã đến giờ, không ghi bài
  và không đọc bảng channels. Kiểm tra cả bài chỉ có draft và bài EN published/VI draft.
- Lỗi một bản dịch phải rollback toàn bộ transaction nhập bài.

Đã kiểm thử migration và luồng ghi trên PostgreSQL 15 local bằng `tests/publishing.sql`.
Chưa hoàn tất cấu hình/migration Supabase cloud.
