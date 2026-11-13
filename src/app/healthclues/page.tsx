import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import { HealthCluesLandingPage } from "@/components/healthclues/HealthCluesLandingPage";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthClues — Cuộc Phiêu Lưu Sức Khỏe & Game Nhập Vai Dưỡng Sinh",
  description: "Vượt qua nỗi lo sức khỏe. Mở khóa hành trình của bạn cùng Lumi & Luna trong thế giới Swiss Alpine Fantasy RPG.",
  openGraph: {
    title: "HealthClues — Cuộc Phiêu Lưu Sức Khỏe",
    description: "Khám phá cơ thể, thực hiện nhiệm vụ và rèn luyện thói quen sống khỏe cùng linh thú Lumi.",
    images: ["/landing/hero-wellness-world.jpg"],
  },
};

export const dynamic = "force-dynamic";

export default function HealthCluesRoute() {
  return (
    <div className={`${plusJakarta.variable} ${cinzel.variable}`}>
      <HealthCluesLandingPage />
    </div>
  );
}
