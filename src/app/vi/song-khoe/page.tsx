import type { Metadata } from "next";
import { WellnessHome } from "@/components/wellness/WellnessHome";
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Sống khỏe",
  description: "Ăn uống lành mạnh, quản lý cân nặng, stress và thiền định trong đời sống hằng ngày.",
  alternates: { canonical: "/vi/song-khoe" },
};
export default function Page() { return <WellnessHome locale="vi" />; }
