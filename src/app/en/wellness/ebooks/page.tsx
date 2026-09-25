import type { Metadata } from "next";
import { EbookCatalogPage } from "@/components/wellness/EbookCatalogPage";

export const metadata: Metadata = {
  title: "Evidence Handbooks & Ebooks Library | HealthClues by Botly",
  description:
    "Explore printable, evidence-based nutrition handbooks grounded in human clinical trials and PubMed research. Free PDF downloads for everyday wellness.",
  alternates: {
    canonical: "/en/wellness/ebooks",
    languages: { en: "/en/wellness/ebooks", vi: "/vi/song-khoe/ebooks", "x-default": "/en/wellness/ebooks" },
  },
  openGraph: {
    title: "HealthClues Evidence Ebook Library – Free Nutritional Handbooks",
    description: "Separating whole-food science from marketing myths with human clinical crossover trials.",
    images: [{ url: "/ebooks/blood-sugar/lentils-rice-hero.png", width: 1200, height: 630, alt: "HealthClues Ebook Library" }],
  },
};

export default function Page() {
  return <EbookCatalogPage locale="en" />;
}
