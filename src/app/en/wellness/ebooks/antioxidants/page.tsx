import type { Metadata } from "next";
import { AntioxidantEbookHub } from "@/components/wellness/AntioxidantEbookHub";

export const metadata: Metadata = {
  title: "Antioxidants on the Plate – Evidence-Based Handbook | HealthClues",
  description:
    "Six everyday food combinations, carotenoid bioavailability, green tea catechin dynamics, and human clinical research. Free 14-page PDF download.",
  openGraph: {
    title: "Antioxidants on the Plate – Free HealthClues Ebook",
    description: "Everyday food combinations, compounds and what human research actually says.",
    images: [{ url: "/ebooks/antioxidants/tomato-olive-oil-hero.png", width: 1200, height: 630, alt: "Antioxidants on the Plate" }],
  },
};

export default function Page() {
  return <AntioxidantEbookHub locale="en" />;
}
