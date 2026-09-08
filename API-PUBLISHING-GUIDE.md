# Hướng dẫn các kênh tự đăng bài lên Botly — API v1

**Trạng thái: đã triển khai endpoint trong mã nguồn, đã kiểm thử local; chưa bật production.**
Endpoint: `src/app/api/v1/articles/route.ts`. Database dùng migrations `002` và `003`.
Project Supabase đã phản hồi qua public API, nhưng chưa có bảng bài viết tại lần kiểm tra.
Cần áp dụng migration, cấu hình secret key, đăng ký Page ID/cấp token và deploy
trước khi kênh gọi production. Xem `supabase/PUBLISHING-SETUP.md`.

## 1. Luồng dành cho mỗi kênh

1. Chuẩn bị nội dung bài chi tiết từ kịch bản video.
2. Đăng video Facebook thành công, lưu Page ID, post ID và permalink trả về.
3. Gửi nội dung cùng thông tin Facebook đến API Botly bên dưới.
4. Lưu `article_id` và URL bài viết từ response vào dữ liệu công việc của kênh.
5. Nếu bước website lỗi, chỉ gửi lại request Botly; không đăng lại video Facebook.

API nhận bài đã được kênh chuẩn bị; không tự viết, dịch hay kiểm chứng nội dung.
Mỗi kênh dùng cùng endpoint nhưng có token riêng, chỉ được phép ghi cho Page ID
được cấp. Botly tự chọn chuyên mục theo cấu hình kênh.

| Kênh | Category ID nội bộ | Trang tiếng Anh | Trang tiếng Việt |
| --- | --- | --- | --- |
| Health Tips | `health-tips` | `/en/wellness/health-tips` | `/vi/song-khoe/meo-suc-khoe` |
| Weight Loss | `weight` | `/en/wellness/weight-management` | `/vi/song-khoe/giam-can` |
| Healing | `healing` | `/en/wellness/healing` | `/vi/song-khoe/chua-lanh` |

## 2. Thông tin cần cấp cho người quản lý kênh

Quản trị Botly cung cấp ba giá trị sau khi triển khai:

| Biến | Ý nghĩa |
| --- | --- |
| `BOTLY_BASE_URL` | Domain Botly thực tế, dùng HTTPS và không có dấu `/` cuối |
| `BOTLY_CHANNEL_TOKEN` | Token bí mật riêng của kênh |
| `FACEBOOK_PAGE_ID` | Page ID đã được đăng ký và gắn đúng chuyên mục |

Token được cấu hình trong secret/credential của hệ thống chạy tự động, không ghi
vào bài viết, URL, Git hoặc log. Các kênh không cần Supabase service-role key.
Token dạng `botly_...` được tạo bằng script `scripts/setup-publishing-channel.mjs`;
database chỉ lưu SHA-256 trong `wellness_channel_tokens`. Thu hồi bằng cách đặt
`revoked_at` trên bản ghi token. Không dùng publishable key Supabase làm token kênh.

## 3. Endpoint và headers

```http
POST {BOTLY_BASE_URL}/api/v1/articles
Authorization: Bearer {BOTLY_CHANNEL_TOKEN}
Content-Type: application/json
```

Body là JSON UTF-8, giới hạn **512 KiB**. Endpoint thực hiện upsert:
tạo bài nếu chưa có, cập nhật nếu cùng Page ID và Facebook post ID đã tồn tại.
Không cần `Idempotency-Key` riêng; cặp ID này là khóa chống trùng.

## 4. Mẫu request Health Tips

Các ID dưới đây chỉ là ví dụ. Thay bằng ID và permalink thật của bài Facebook.
Mẫu nội dung dùng `draft` vì là dữ liệu minh họa. Để đăng công khai ngay,
gửi nội dung hoàn chỉnh và đổi `status` thành `published`.

```json
{
  "facebook_page_id": "123456789012345",
  "facebook_post_id": "123456789012345_987654321098765",
  "facebook_url": "https://www.facebook.com/123456789012345/posts/987654321098765",
  "facebook_published_at": "2026-09-05T09:00:00+07:00",
  "translations": [
    {
      "locale": "vi",
      "slug": "cach-doc-mot-meo-suc-khoe-tren-mang",
      "title": "Cách đọc một mẹo sức khỏe trên mạng",
      "description": "Bài viết đi kèm video Health Tips, giúp người đọc xem lại thông tin và các nguồn liên quan.",
      "eyebrow": "MẸO SỨC KHỎE",
      "takeaway": "Xem cả nguồn và bối cảnh trước khi chia sẻ một tuyên bố.",
      "sections": [
        {
          "title": "Video đang nói đến điều gì?",
          "paragraphs": [
            "Đây là đoạn minh họa cấu trúc API. Kênh thay bằng phần giải thích đầy đủ từ nội dung video trước khi xuất bản."
          ]
        },
        {
          "title": "Thông tin cần đối chiếu",
          "paragraphs": ["Trình bày nguồn và giới hạn của thông tin trong video."],
          "bullets": ["Nguồn gốc tuyên bố", "Bối cảnh áp dụng", "Điều chưa được xác nhận"]
        }
      ],
      "sources": [],
      "reading_minutes": 3,
      "tool": "remedy-checker",
      "status": "draft"
    }
  ]
}
```

Muốn đăng cả Anh–Việt: thêm một phần tử `locale: "en"` với nội dung tiếng Anh
và slug riêng vào `translations`. Không cần gọi API hai lần. Cũng có thể gửi
bản dịch còn lại sau, với nguyên Page ID và post ID.

## 5. Các trường cấp bài viết

| Trường | Bắt buộc | Quy tắc |
| --- | --- | --- |
| `facebook_page_id` | Có | Chuỗi chỉ gồm số; phải khớp quyền token và kênh đang enabled |
| `facebook_post_id` | Có | Chuỗi ID chuẩn lưu từ kết quả đăng Facebook, 1–200 ký tự |
| `facebook_url` | Có | Permalink HTTPS, hostname `facebook.com` hoặc subdomain của nó |
| `facebook_published_at` | Không | ISO 8601 có múi giờ; thời gian đăng Facebook, không phải giờ đăng website |
| `cover_image_url` | Không | URL HTTPS ảnh công khai, ổn định; API không upload ảnh; tối đa 2.048 ký tự |
| `translations` | Có | Mảng 1–2 bản dịch, không trùng locale |

Giữ ID dưới dạng **string**, không chuyển sang number. Không dùng share URL
hoặc đổi qua lại giữa video ID và post ID để nhận diện cùng bài.
Nếu luồng Facebook chỉ cung cấp video ID, phải bổ sung bước lấy và lưu post ID
chuẩn trước khi gọi hợp đồng API này.

Không gửi `category_id`, `channel_id`, `article_id`, `created_at`, `updated_at`.
Server quyết định các trường này. Trường không có trong hợp đồng bị trả `422`.
Giới hạn URL nói chung là 2.048 ký tự.

## 6. Các trường trong mỗi bản dịch

| Trường | Bắt buộc | Quy tắc |
| --- | --- | --- |
| `locale` | Có | `en` hoặc `vi` |
| `slug` | Có | 1–180 ký tự, chữ thường ASCII/số, ngăn bằng `-`; không dấu, không khoảng trắng |
| `title` | Có | 1–240 ký tự, không chỉ chứa khoảng trắng |
| `description` | Có | Tóm tắt 1–1.000 ký tự |
| `sections` | Có | 1–50 phần nội dung; cấu trúc bên dưới |
| `eyebrow` | Không | Nhãn nhỏ phía trên tiêu đề, tối đa 100 ký tự |
| `takeaway` | Không | Ý chính, tối đa 2.000 ký tự |
| `sources` | Không | Tối đa 30 nguồn `{ "label": "Tên nguồn", "url": "https://..." }` |
| `cover_image_alt` | Không | Mô tả ảnh, tối đa 500 ký tự |
| `reading_minutes` | Không | Số nguyên 1–120 |
| `evidence` | Không | `supported`, `promising`, `limited`; bỏ qua nếu chưa đánh giá |
| `reviewed_at` | Không | ISO 8601 có múi giờ; chỉ gửi khi thực sự đã rà soát |
| `tool` | Không | Một trong các mã công cụ liệt kê bên dưới |
| `seo_title` | Không | Tối đa 240 ký tự |
| `seo_description` | Không | Tối đa 1.000 ký tự |
| `status` | Không | `draft`, `published`, `archived`; bài dịch mới mặc định `draft` |
| `published_at` | Không | ISO 8601 có múi giờ; chỉ thiết lập lần đầu xuất bản |

Mỗi section có `title` dài 1–240 ký tự, `paragraphs` là mảng 1–30 đoạn văn
không rỗng, mỗi đoạn tối đa 10.000 ký tự; `bullets` tùy chọn, tối đa 30 chuỗi,
mỗi chuỗi dài 1–2.000 ký tự. Source label dài 1–240 ký tự, URL phải là HTTPS.
Nội dung là text thuần, không phải HTML hoặc Markdown.

Mã `tool`: `calorie-needs`, `stress-check`, `meditation-timer`,
`food-combinations`, `remedy-checker`, `wellness-planner`.

Không tự tạo nguồn, gắn nhãn chứng cứ hay ngày rà soát chưa có thật.
Giới hạn API có thể chặt hơn constraint database; backend phải validate đầy đủ.

## 7. Xuất bản, cập nhật và chống trùng

- Tạo mới: trường tùy chọn bị bỏ qua dùng default database hoặc null.
- Cập nhật: gửi lại đầy đủ các trường bắt buộc của mỗi bản dịch muốn sửa.
  Trường tùy chọn bị bỏ qua giữ nguyên giá trị cũ; mảng được gửi thay toàn bộ
  mảng cũ. Gửi `sources: []` để xóa danh sách nguồn.
- `null` chỉ được chấp nhận với trường nullable: thời gian Facebook, ảnh,
  reading minutes, evidence, reviewed_at, tool và hai trường SEO. Các trường
  text không nullable có thể xóa bằng chuỗi rỗng nếu không phải trường bắt buộc.
- Bản dịch không xuất hiện trong request được giữ nguyên.
- `slug` của bản dịch đã tồn tại phải giữ nguyên; khác slug trả `409 SLUG_IMMUTABLE`.
  Slug trùng bài khác cùng locale trả `409 SLUG_CONFLICT`; kênh chọn slug mới
  (ví dụ thêm hậu tố post ID) rồi gửi lại cùng cặp ID Facebook.
- Lần đầu chuyển sang `published`, server dùng giờ hiện tại nếu không gửi
  `published_at`. Có thể gửi giờ tương lai để lên lịch hiển thị.
- Sau khi `published_at` đã được thiết lập, retry/cập nhật giữ nguyên thời điểm;
  gửi thời điểm khác trả `409 PUBLICATION_TIME_IMMUTABLE`. Không gửi null.
  Không nhận `published_at` khi status hiệu lực chưa phải `published`.
- `archived` hoặc `draft` ẩn bản dịch khỏi khách đọc. Xuất bản lại giữ ngày cũ.
- Một request phải ghi bài và toàn bộ bản dịch trong **một transaction**:
  lỗi một phần thì không lưu phần nào. Chống trùng phải hoạt động khi gửi đồng thời.
- Cùng cặp ID là cùng bài, không phải khóa đóng băng payload. Hai cập nhật khác
  nhau áp dụng theo thứ tự commit; mỗi kênh phải tuần tự hóa cập nhật cho cùng
  post và không retry payload cũ sau khi đã gửi phiên bản mới thành công.

## 8. Response thành công

Tạo mới article trả HTTP `201`; article đã tồn tại trả HTTP `200`.
Thêm ngôn ngữ vào article cũ cũng trả `200`. Mẫu cho bài đã xuất bản:

```json
{
  "ok": true,
  "action": "created",
  "article_id": "9b33b20e-ae49-4ebd-a683-f43cf0bfb5ef",
  "category_id": "health-tips",
  "facebook_page_id": "123456789012345",
  "facebook_post_id": "123456789012345_987654321098765",
  "translations": [
    {
      "locale": "vi",
      "slug": "cach-doc-mot-meo-suc-khoe-tren-mang",
      "status": "published",
      "published_at": "2026-09-05T02:05:00Z",
      "visible": true,
      "path": "/vi/song-khoe/huong-dan/cach-doc-mot-meo-suc-khoe-tren-mang",
      "url": "https://YOUR-BOTLY-DOMAIN/vi/song-khoe/huong-dan/cach-doc-mot-meo-suc-khoe-tren-mang"
    }
  ]
}
```

`action` là `created` hoặc `updated` theo article gốc. Response trả các bản dịch
được gửi trong request. `visible` chỉ true khi published và đã đến giờ;
URL không phải preview link và không đảm bảo truy cập công khai khi visible=false.
Domain response phải lấy từ cấu hình production tin cậy của Botly.

## 9. Response lỗi và gửi lại

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid article payload",
    "fields": [{"path": "translations.0.title", "message": "Required"}]
  },
  "request_id": "server-generated-request-id"
}
```

| HTTP | Code | Kênh cần làm |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Sửa JSON, không tự retry |
| 401 | `UNAUTHORIZED` | Kiểm tra token thiếu/sai/đã thu hồi |
| 403 | `CHANNEL_FORBIDDEN` | Kiểm tra quyền token, Page ID, đăng ký kênh và enabled |
| 409 | `SLUG_CONFLICT`, `SLUG_IMMUTABLE`, `PUBLICATION_TIME_IMMUTABLE` | Sửa trường xung đột theo mục 7 |
| 413 | `PAYLOAD_TOO_LARGE` | Giảm payload, không gửi file ảnh/video trong JSON |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Dùng `application/json` |
| 422 | `VALIDATION_ERROR` | Sửa trường được chỉ rõ |
| 422 | `INVALID_PUBLICATION_STATUS` | Chỉ gửi published_at khi bản dịch có status hiệu lực published |
| 429 | `RATE_LIMITED` | Chờ theo header `Retry-After` |
| 503 | `NOT_CONFIGURED` | Báo quản trị bổ sung cấu hình Supabase và site URL |
| 500/502/503/504 | `PUBLISHING_UNAVAILABLE`, `INTERNAL_ERROR` hoặc lỗi proxy | Retry cùng payload và cặp ID |

Timeout/mất kết nối không có nghĩa là chưa lưu. Retry cùng cặp ID để tránh trùng.
Giới hạn hiện tại: 30 lần ghi thành công/phút/kênh, dùng chung giữa các token.
Payload sai bị từ chối trước RPC; đây không thay thế giới hạn HTTP/WAF của hosting.
Đề xuất timeout 30 giây; tối đa 5 lần retry sau lần đầu, chờ 10, 30, 60, 120,
300 giây và thêm độ trễ ngẫu nhiên nhỏ. Với 429 ưu tiên `Retry-After`.
Hết lượt thì giữ payload trong hàng đợi lỗi và báo người vận hành.
Lưu request ID, mã lỗi và post ID; không log Authorization.
Proxy có thể trả lỗi không phải JSON, workflow cần xử lý trường hợp này.

## 10. Gọi từ workflow hoặc script

Với workflow dùng HTTP Request: chọn POST, URL từ mục 3, cấu hình Bearer token
bằng credential, chọn JSON body và map các trường từ kết quả đăng Facebook cùng
nội dung bài đã tạo. Chỉ chạy bước này sau khi có kết quả Facebook thành công.

Ví dụ Node.js, lưu payload mục 4 thành `article.json` và đặt hai biến môi trường
`BOTLY_BASE_URL`, `BOTLY_CHANNEL_TOKEN` trong môi trường chạy:

```js
// publish-article.mjs — một lần gửi; workflow bên ngoài quản lý retry.
import { readFile } from 'node:fs/promises';

const baseUrl = process.env.BOTLY_BASE_URL?.replace(/\/$/, '');
const token = process.env.BOTLY_CHANNEL_TOKEN;
if (!baseUrl || !token) throw new Error('Missing Botly configuration');
const payload = JSON.parse(await readFile('article.json', 'utf8'));
const response = await fetch(`${baseUrl}/api/v1/articles`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30000)
});
const text = await response.text();
let result;
try { result = JSON.parse(text); } catch { result = null; }
if (!response.ok) {
  // Không in response body/payload/token vào log mặc định.
  console.error({
    status: response.status,
    code: result?.error?.code ?? 'NON_JSON_ERROR',
    request_id: result?.request_id,
    retry_after: response.headers.get('retry-after')
  });
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(result, null, 2));
}
```

## 11. Điều kiện hoàn thành phía Botly trước khi giao API cho kênh

- Áp dụng migration, đăng ký Page ID thật và chuyên mục của từng kênh.
- Cấp token riêng có thể thu hồi; xác thực token và giới hạn đúng Page ID.
- Viết endpoint đúng hợp đồng, validate, rate limit và transaction/RPC chỉ server gọi.
- Không cho phép kênh gọi Supabase bằng service-role key trực tiếp.
- Nối trang chuyên mục, trang bài và sitemap với database; xử lý cache để
  bài mới/cập nhật/ẩn bài phản ánh trên website và bài hẹn giờ hiện đúng lúc.
- Test: đăng Health Tips, thêm bản dịch, retry sau timeout, hai request đồng thời,
  sai token/Page ID, trùng slug, rollback khi bản dịch lỗi, ẩn draft và archived.
- Cung cấp domain thật, token và xác nhận endpoint đã sẵn sàng cho từng kênh.

Hợp đồng này không bao gồm API upload video Facebook, upload ảnh, tự sinh bài
hoặc chuyển dữ liệu bài viết cũ. Những bước đó thuộc luồng chuẩn bị/tích hợp riêng.
