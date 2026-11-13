import type { Metadata } from "next";
import { WellnessWorldGame } from "@/features/healthclues/WellnessWorldGame";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export const metadata: Metadata = { title: "Thế giới Sức khỏe của tôi | HealthClues", description: "Khám phá thế giới sức khỏe riêng tư theo nhịp độ của bạn.", robots: { index: false, follow: false } };

export default async function WellnessWorldPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requestedQuest = typeof params.quest === "string" ? params.quest : "health-concern";
  const initialQuest = requestedQuest === "sleep-better" ? "health-concern" : requestedQuest;
  const entryQuest = typeof params.quest === "string" ? (params.quest === "sleep-better" ? "health-concern" : params.quest) : undefined;
  const onboardingBackpack = params.onboarding === "backpack";
  const autoOpenCheckin = params.checkin === "1" || params.panel === "checkin" || params.action === "checkin";
  return (
    <HealthCluesLocaleProvider initialLocale="vi">
      <WellnessWorldGame
        initialQuest={initialQuest}
        entryQuest={entryQuest}
        onboardingBackpack={onboardingBackpack}
        autoOpenCheckin={autoOpenCheckin}
      />
    </HealthCluesLocaleProvider>
  );
}
