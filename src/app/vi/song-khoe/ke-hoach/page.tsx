import type { Metadata } from "next";
import { MyPlan } from "@/components/wellness/WellnessPlanner";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "Kế hoạch Wellness của tôi", robots: { index: false, follow: false } };
export default function Page() { return <WellnessShell locale="vi"><MyPlan locale="vi" /></WellnessShell>; }
