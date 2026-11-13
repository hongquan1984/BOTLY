import type { Metadata } from "next";
import { HealthCluesPlayEntry } from "@/components/healthclues/HealthCluesPlayEntry";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export const metadata: Metadata = {
  title: "HealthClues · Your Wellness Adventure",
  description: "Enter your personal HealthClues Wellness World.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function HealthCluesPlayPage() {
  return <HealthCluesLocaleProvider><HealthCluesPlayEntry /></HealthCluesLocaleProvider>;
}
