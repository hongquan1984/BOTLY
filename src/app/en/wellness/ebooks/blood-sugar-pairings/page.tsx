import type { Metadata } from "next";
import { BloodSugarEbookHub } from "@/components/wellness/BloodSugarEbookHub";

export const metadata: Metadata = {
  title: "Blood Sugar & Everyday Pairings – Evidence-Based Handbook | HealthClues",
  description:
    "Four familiar pairings, the compounds and nutrients inside them, and what human clinical trials actually measured on postprandial glucose curves. Free 11-page PDF download.",
  alternates: { canonical: "/en/wellness/ebooks/blood-sugar-pairings" },
  openGraph: {
    title: "Blood Sugar & Everyday Pairings – Free HealthClues Ebook",
    description: "What food combinations teach us about glucose, fibre and the science of a meal.",
    images: [{ url: "/ebooks/blood-sugar/lentils-rice-hero.png", width: 1200, height: 630, alt: "Blood Sugar & Everyday Pairings" }],
  },
};

export default function Page() {
  return <BloodSugarEbookHub locale="en" />;
}
