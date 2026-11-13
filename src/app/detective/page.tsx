import type { Metadata } from "next";
import { DetectiveGameApp } from "@gametrinhtham/components/DetectiveGameApp";

export const metadata: Metadata = {
  title: "HealthClues · Thám Tử Cơ Thể (Mystery Detective)",
  description: "Khám phá hiện trường, thu thập chứng cứ và suy luận giải mã các bí ẩn sức khỏe cùng Luna.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function DetectivePage() {
  return <DetectiveGameApp />;
}
