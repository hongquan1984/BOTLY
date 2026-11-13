import { AuthCallback } from "@/components/wellness/WellnessAccount";
import { WellnessShell } from "@/components/wellness/WellnessShell";
import { WorldAuthCallback } from "@/features/healthclues/WorldAuthCallback";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";
  const isPlayOrGame = next.startsWith("/play") || next.includes("play") || next.includes("wellness/healthclues/world") || next.includes("healthclues");
  const returnToJourney = next.includes("activation=complete");
  return isPlayOrGame
    ? <HealthCluesLocaleProvider initialLocale="vi"><WorldAuthCallback journeyActivation={returnToJourney}/></HealthCluesLocaleProvider>
    : <WellnessShell locale="vi"><AuthCallback locale="vi"/></WellnessShell>;
}
