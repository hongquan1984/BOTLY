# AIFlow Automation

Website landing page bán dịch vụ **AI Automation** và **AI Livestream** dành cho doanh nghiệp vừa và nhỏ.

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · React Hook Form · Zod · Lucide**

---

## Tính năng chính

- Landing page đầy đủ: Hero, pain points, services, AI Livestream demo UI, automation flow, ROI calculator, use cases, case studies, pricing, FAQ, form liên hệ
- Header sticky + mobile drawer
- Floating actions (chat, call, Zalo, đặt lịch)
- Sticky CTA trên mobile
- Demo popup sau ~60% scroll (lưu trạng thái đóng bằng `localStorage`)
- Cookie notice, back-to-top, active section nav
- SEO metadata, Open Graph, sitemap, robots, JSON-LD (Organization, WebSite, Service, FAQPage)
- Responsive desktop / tablet / mobile
- Tôn trọng `prefers-reduced-motion`

---

## Cài đặt

```bash
# Yêu cầu: Node.js 18+
npm install
```

Nếu máy hết dung lượng ổ C, cấu hình cache npm sang ổ khác:

```bash
npm config set cache "D:\npm-cache"
```

---

## Chạy local

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Build production

```bash
npm run build
npm start
```

---

## Biến môi trường

Sao chép `.env.example` → `.env.local` nếu cần:

| Biến | Mô tả |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | URL production (metadata, sitemap) |
| `NEXT_PUBLIC_LEAD_API_URL` | (Tuỳ chọn) API nhận form lead |

Form liên hệ hiện **mock submit** (console + toast). Nối backend tại:

- `src/components/sections/FinalCta.tsx` → `onSubmit`
- `src/components/layout/DemoPopup.tsx` → `onSubmit`

---

## Cấu trúc thư mục

```
src/
  app/                 # App Router: layout, page, sitemap, robots, CSS
  components/
    layout/            # Header, Footer, popup, floating CTA...
    sections/          # Từng section landing page
    shared/            # Logo, Section, ScrollReveal...
    ui/                # Button, Input, Accordion...
  data/                # Nội dung demo (dễ chỉnh sửa)
  hooks/               # useActiveSection, useLocalStorage
  lib/                 # utils, validations
```

---

## Vị trí chỉnh nội dung quan trọng

| Nội dung | File |
|----------|------|
| Tên brand, email, SĐT, Zalo, social | `src/data/site.ts` |
| Menu | `src/data/site.ts` → `navItems` |
| Dịch vụ | `src/data/services.ts` |
| FAQ | `src/data/faq.ts` |
| Pricing | `src/data/pricing.ts` |
| Case study | `src/data/case-studies.ts` |
| Use cases theo ngành | `src/data/use-cases.ts` |
| Logo icon | `src/components/shared/Logo.tsx` |
| Màu sắc / theme | `src/app/globals.css` |

---

## Ghi chú thiết kế

- Nền tối (`#050816`), accent cyan / blue / purple
- Không dùng ảnh bản quyền — UI dựng bằng CSS + SVG + Lucide
- Case study & testimonial được gắn nhãn **minh họa** khi chưa có dữ liệu thật
- ROI calculator có disclaimer rõ ràng

---

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm start` | Chạy build |
| `npm run lint` | ESLint |

---

## License

Private / nội bộ — tuỳ chỉnh theo nhu cầu dự án.
