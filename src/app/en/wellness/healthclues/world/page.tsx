import type { Metadata } from "next";
import { WellnessWorldGame } from "@/features/healthclues/WellnessWorldGame";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export const metadata: Metadata = {
  title: "My Wellness World | HealthClues",
  description: "Choose reviewed wellness tools, build a personal world map, and keep a private journey at your own pace.",
  robots: { index: false, follow: false },
};

export default async function WellnessWorldPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requestedQuest = typeof params.quest === "string" ? params.quest : "health-concern";
  const initialQuest = requestedQuest === "sleep-better" ? "health-concern" : requestedQuest;
  const entryQuest = typeof params.quest === "string" ? (params.quest === "sleep-better" ? "health-concern" : params.quest) : undefined;
  const onboardingBackpack = params.onboarding === "backpack";
  const autoOpenCheckin = params.checkin === "1" || params.panel === "checkin" || params.action === "checkin";
  return (
    <HealthCluesLocaleProvider initialLocale="en">
      <WellnessWorldGame
        initialQuest={initialQuest}
        entryQuest={entryQuest}
        onboardingBackpack={onboardingBackpack}
        autoOpenCheckin={autoOpenCheckin}
      />
    </HealthCluesLocaleProvider>
  );
}
