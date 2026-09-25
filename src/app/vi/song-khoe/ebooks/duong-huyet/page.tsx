import type { Metadata } from "next";
import { BloodSugarEbookHub } from "@/components/wellness/BloodSugarEbookHub";

export const metadata: Metadata = {
  title: "Đường Huyết & Bữa Ăn Hàng Ngày – Cẩm Nang Y Sinh Thực Chứng | HealthClues",
  description:
    "Bốn cặp thực phẩm quen thuộc, cơ chế phân tử và kết quả từ thử nghiệm lâm sàng đối chứng trên người về chỉ số đường huyết sau ăn. Tải cẩm nang PDF 11 trang miễn phí.",
  alternates: { canonical: "/vi/song-khoe/ebooks/duong-huyet" },
  openGraph: {
    title: "Đường Huyết & Bữa Ăn Hàng Ngày – Cẩm Nang Y Sinh HealthClues",
    description: "Sự thật về glucose, chất xơ và khoa học sắp đặt một đĩa ăn.",
    images: [{ url: "/ebooks/blood-sugar/lentils-rice-hero.png", width: 1200, height: 630, alt: "Cẩm nang đường huyết và kết hợp thực phẩm" }],
  },
};

export default function Page() {
  return <BloodSugarEbookHub locale="vi" />;
}
