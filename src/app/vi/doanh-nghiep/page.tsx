import type { Metadata } from "next";
import { BusinessLanding } from "@/components/business/BusinessLanding";

export const metadata: Metadata = {
  title: "Giải pháp AI Automation cho doanh nghiệp",
  description: "AI Automation, AI Livestream và tự động hóa quy trình từ Botly.",
  alternates: {
    canonical: "/vi/doanh-nghiep",
    languages: { en: "/en/business", vi: "/vi/doanh-nghiep", "x-default": "/en/business" },
  },
};

export default function VietnameseBusinessPage() {
  return <BusinessLanding />;
}
