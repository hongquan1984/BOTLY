import type { Metadata } from "next";
import { EbookCatalogPage } from "@/components/wellness/EbookCatalogPage";
import { listPublicEbooks } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Botly Wellness Ebook Library | Free Food & Wellness Guides",
  description:
    "Explore practical Botly guides for everyday food, drinks and wellness. Get free English ebooks by email or visit original historical sources.",
  alternates: {
    canonical: "/en/wellness/ebooks",
    languages: { en: "/en/wellness/ebooks", vi: "/vi/song-khoe/ebooks", "x-default": "/en/wellness/ebooks" },
  },
  openGraph: {
    title: "HealthClues Evidence Ebook Library – Free Nutritional Handbooks",
    description: "Practical guides for everyday food, drinks and wellness.",
    images: [{ url: "/ebooks/blood-sugar/lentils-rice-hero.png", width: 1200, height: 630, alt: "HealthClues Ebook Library" }],
  },
};

export default async function Page() {
  const ebooks = await listPublicEbooks();
  return <EbookCatalogPage locale="en" ebooks={ebooks} />;
}
