# Bật API đăng bài Botly

## Tình trạng

- Endpoint POST `/api/v1/articles` đã được viết; có validation, token theo Page,
  chống trùng, transaction và rate limit theo kênh.
- Homepage, chuyên mục, trang bài và sitemap đọc bài từ Supabase bằng public key/RLS.
  Bài đã xuất bản xuất hiện khi tải trang mới, không cần deploy lại.
- Các hướng dẫn tĩnh cũ vẫn giữ nguyên URL; API không được ghi đè slug của chúng.
- Video đi kèm được gắn bằng nút mở Facebook; chưa nhúng Facebook player.
- Migration và kiểm thử SQL đã chạy trên PostgreSQL 15 local riêng.
- Supabase cloud đã xác nhận truy cập được nhưng chưa có bảng bài viết;
  chưa chạy migration cloud, chưa cấp token thật hoặc deploy bản này.
- Secret key đã được lưu vào `.env.local` và xác thực REST thành công (HTTP 200).
  Còn thiếu thông tin Session pooler để chạy migration và Page ID để cấp token.

## 1. Biến môi trường

Thông tin đã cấp được lưu ở `.env.local`, bị Git bỏ qua. Không gửi file này cho kênh.

```dotenv
NEXT_PUBLIC_SITE_URL=https://botly.vn
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY_OR_LEGACY_SERVICE_ROLE_KEY
```

Code cũng nhận tên biến mới `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` và `SUPABASE_SECRET_KEY`.
Tên mới được ưu tiên khi có cả hai. `SUPABASE_JWKS_URL` đã được lưu để dùng
khi cần xác minh JWT; API đăng bài hiện dùng token riêng của kênh, không dùng JWKS.

Tên biến ANON_KEY được giữ để tương thích code cũ; chấp nhận `sb_publishable_...`.
Biến SERVICE_ROLE_KEY chấp nhận secret key `sb_secret_...` hoặc legacy service-role JWT.
Không dùng mật khẩu database hoặc publishable key thay cho secret key server.
Cấu hình cùng các biến này trên hosting khi deploy.

Mật khẩu database/PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE/PGSSLMODE chỉ phục vụ
migration local, không cần đưa lên hosting. Direct host project chỉ có IPv6;
nếu máy không có IPv6, lấy **Session pooler** trong Supabase Connect, thay PGHOST,
PGPORT, PGUSER theo chuỗi đó. Giữ SSL và không log chuỗi kết nối có mật khẩu.

## 2. Tạo bảng cloud

Trong Supabase SQL Editor, chạy lần lượt:

1. `migrations/002_wellness_articles.sql`.
2. `migrations/003_article_publishing.sql`.

Hoặc chạy file gộp `SETUP-ARTICLES.sql` một lần trên project chưa có các bảng này.
Không chạy lại file bootstrap/tests trên cloud. Migration 001 dành cho kế hoạch
và newsletter, độc lập với bài viết; chưa áp dụng trong luồng này.

Nếu có psql và đã cấu hình các biến PG, có thể chạy hai file migration bằng psql.
Mỗi migration có transaction riêng; nếu 003 lỗi sau khi 002 đã thành công,
chỉ sửa/chạy lại 003. Không chạy lại 002 vì bảng đã tồn tại.

## 3. Kiểm tra kết nối

Tại thư mục dự án:

```powershell
node --env-file=.env.local scripts/check-supabase.mjs
```

Script chỉ in trạng thái bảng/RPC, không in key. Tất cả mục phải OK.

## 4. Đăng ký kênh và tạo token

Thay `PAGE_ID_THAT` bằng Page ID chỉ gồm số:

```powershell
node --env-file=.env.local scripts/setup-publishing-channel.mjs PAGE_ID_THAT health-tips "Health Tips"
```

Category hợp lệ: `health-tips`, `weight`, `healing`.
Script tạo mapping Page → chuyên mục và một token ngẫu nhiên 256 bit; token chỉ
được lưu nguyên bản trong file `secrets/*.env` bị Git bỏ qua. Database lưu hash.
Script in đường dẫn file và token ID, không in token. Không tự bật lại kênh bị khóa
hoặc đổi category của kênh đang có bài.

Giao riêng file credential này cùng `API-PUBLISHING-GUIDE.md` cho bot của kênh.
Nếu chạy script lần nữa sẽ tạo token bổ sung; token cũ không tự thu hồi.
Muốn thu hồi, đặt `revoked_at = now()` cho token ID tương ứng trong SQL Editor.
Muốn khóa cả kênh, đặt `wellness_channels.enabled = false`.

## 5. Kiểm thử và triển khai

```powershell
node scripts/test-article-payload.mjs
node scripts/test-article-api.mjs
npm run lint
npm run build
```

API test dùng database stub để kiểm tra HTTP contract. SQL integration test thật
ở `tests/publishing.sql` kiểm tra transaction, retry, quyền token và RLS; chạy
trong PostgreSQL dùng một lần sau bootstrap và migration 002/003.

Deploy ứng dụng lên hosting hiện có sau khi cấu hình môi trường. Dùng token thật
đăng một draft lên domain thật, xác nhận URL chưa public; sau đó xuất bản nội dung
đã hoàn chỉnh và kiểm tra chuyên mục, link Facebook, sitemap, gửi lại và thu hồi token.
Đừng coi build local thành công là đã deploy production.

Quyền RPC dùng SECURITY INVOKER và chỉ cấp EXECUTE cho service_role theo
[Supabase database functions](https://supabase.com/docs/guides/database/functions).
