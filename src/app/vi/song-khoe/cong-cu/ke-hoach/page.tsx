import type { Metadata } from "next";
import { WellnessPlanner } from "@/components/wellness/WellnessPlanner";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "Kế hoạch Wellness 7 ngày", description: "Tạo kế hoạch nhẹ nhàng bảy ngày cho dinh dưỡng, stress và chánh niệm." };
export default function Page() { return <WellnessShell locale="vi"><main className="mx-auto max-w-4xl px-5 py-16 lg:px-8"><p className="section-kicker">KẾ HOẠCH BOTLY</p><h1 className="section-title !text-5xl">Một kế hoạch vừa với đời sống thật.</h1><p className="section-subtitle">Mỗi ngày ba bước nhẹ nhàng về dinh dưỡng, thư giãn và chánh niệm.</p><WellnessPlanner locale="vi" /></main></WellnessShell>; }
