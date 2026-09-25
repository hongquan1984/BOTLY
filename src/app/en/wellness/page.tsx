import type { Metadata } from "next";
import { WellnessHome } from "@/components/wellness/WellnessHome";
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Wellness",
  description: "Healthy eating, sustainable weight goals, stress care and meditation tools for everyday life.",
  alternates: {
    canonical: "/en/wellness",
    languages: { en: "/en/wellness", vi: "/vi/song-khoe", "x-default": "/en/wellness" },
  },
};
export default function Page() { return <WellnessHome locale="en" />; }
