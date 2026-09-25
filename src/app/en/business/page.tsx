import type { Metadata } from "next";
import { BusinessLanding } from "@/components/business/BusinessLanding";

export const metadata: Metadata = {
  title: "AI Automation for Business",
  description: "AI automation, AI livestream and workflow solutions by Botly.",
  alternates: {
    canonical: "/en/business",
    languages: { en: "/en/business", vi: "/vi/doanh-nghiep", "x-default": "/en/business" },
  },
};

export default function EnglishBusinessPage() {
  return <BusinessLanding />;
}
