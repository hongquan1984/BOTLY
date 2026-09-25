import type { Metadata } from "next";
import { EbookCatalogPage } from "@/components/wellness/EbookCatalogPage";

export const metadata: Metadata = {
  title: "Thư Viện Cẩm Nang Y Sinh & Ebook Thực Chứng | HealthClues Botly",
  description:
    "Thư viện cẩm nang dinh dưỡng và kết hợp thực phẩm chuẩn y sinh, đối chiếu thử nghiệm lâm sàng trên người và nguồn PubMed. Tải file PDF miễn phí.",
  alternates: {
    canonical: "/vi/song-khoe/ebooks",
    languages: { en: "/en/wellness/ebooks", vi: "/vi/song-khoe/ebooks", "x-default": "/en/wellness/ebooks" },
  },
  openGraph: {
    title: "Thư Viện Cẩm Nang Y Sinh HealthClues – Tải Ebook Miễn Phí",
    description: "Giải mã các cặp thực phẩm quen thuộc dựa trên khoa học dinh dưỡng thực chứng.",
    images: [{ url: "/ebooks/blood-sugar/lentils-rice-hero.png", width: 1200, height: 630, alt: "Thư viện Ebook HealthClues" }],
  },
};

export default function Page() {
  return <EbookCatalogPage locale="vi" />;
}
