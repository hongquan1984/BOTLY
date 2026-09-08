import type { Metadata } from "next";
import { MyPlan } from "@/components/wellness/WellnessPlanner";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "My Wellness Plan", robots: { index: false, follow: false } };
export default function Page() { return <WellnessShell locale="en"><MyPlan locale="en" /></WellnessShell>; }
