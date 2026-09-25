import type { Metadata } from "next";
import { AntioxidantEbookHub } from "@/components/wellness/AntioxidantEbookHub";

export const metadata: Metadata = {
  title: "Chất Chống Oxy Hóa Trên Đĩa Ăn – Cẩm Nang Y Sinh Thực Chứng | HealthClues",
  description:
    "Sáu cặp thực phẩm quen thuộc, cơ chế hấp thu carotenoid, độ bền catechin trong trà xanh và ranh giới nghiên cứu lâm sàng. Tải cẩm nang PDF 14 trang miễn phí.",
  alternates: {
    canonical: "/vi/song-khoe/ebooks/chat-chong-oxy-hoa",
    languages: { en: "/en/wellness/ebooks/antioxidants", vi: "/vi/song-khoe/ebooks/chat-chong-oxy-hoa", "x-default": "/en/wellness/ebooks/antioxidants" },
  },
  openGraph: {
    title: "Chất Chống Oxy Hóa Trên Đĩa Ăn – Cẩm Nang Y Sinh HealthClues",
    description: "Các cặp thực phẩm hàng ngày, hoạt chất tự nhiên và những gì nghiên cứu thực sự chứng minh.",
    images: [{ url: "/ebooks/antioxidants/tomato-olive-oil-hero.png", width: 1200, height: 630, alt: "Cẩm nang chất chống oxy hóa trên đĩa ăn" }],
  },
};

export default function Page() {
  return <AntioxidantEbookHub locale="vi" />;
}
