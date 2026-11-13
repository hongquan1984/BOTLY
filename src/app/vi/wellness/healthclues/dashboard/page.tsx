import type { Metadata } from "next";
import { HealthCluesGameShell } from "@/components/healthclues/HealthCluesGameShell";
import { HealthCluesDashboard } from "@/components/healthclues/HealthCluesDashboard";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export const metadata: Metadata = { title: "Khám phá Sức khỏe của tôi | HealthClues", description: "Tiếp tục khám phá tài liệu sức khỏe dành cho sở thích của bạn.", robots: { index: false, follow: false } };

export default function HealthCluesDashboardPage() {
  return <HealthCluesLocaleProvider initialLocale="vi"><HealthCluesGameShell current="profile"><HealthCluesDashboard /></HealthCluesGameShell></HealthCluesLocaleProvider>;
}
