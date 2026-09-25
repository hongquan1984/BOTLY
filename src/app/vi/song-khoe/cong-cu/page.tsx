import type { Metadata } from "next";
import { ToolsPage } from "@/components/wellness/WellnessHome";
export const metadata: Metadata = { title: "Công cụ sức khỏe", alternates: { canonical: "/vi/song-khoe/cong-cu" } };
export default function Page() { return <ToolsPage locale="vi" />; }
