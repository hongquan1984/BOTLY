import type { Metadata } from "next";
import { WellnessHome } from "@/components/wellness/WellnessHome";
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: "Wellness", description: "Healthy eating, sustainable weight goals, stress care and meditation tools for everyday life." };
export default function Page() { return <WellnessHome locale="en" />; }
