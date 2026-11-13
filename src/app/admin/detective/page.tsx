import type { Metadata } from "next";
import { DetectiveCaseEditor } from "@gametrinhtham/admin/DetectiveCaseEditor";

export const metadata: Metadata = {
  title: "Admin · HealthClues Mystery Detective Case Editor",
  description: "Trang quản trị hồ sơ vụ án và định vị hotspot trực quan.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminDetectivePage() {
  return <DetectiveCaseEditor />;
}
