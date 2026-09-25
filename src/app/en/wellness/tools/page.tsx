import type { Metadata } from "next";
import { ToolsPage } from "@/components/wellness/WellnessHome";
export const metadata: Metadata = { title: "Wellness Tools", alternates: { canonical: "/en/wellness/tools" } };
export default function Page() { return <ToolsPage locale="en" />; }
