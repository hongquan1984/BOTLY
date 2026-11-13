import type { Metadata } from "next";
import { HealthCluesGameShell } from "@/components/healthclues/HealthCluesGameShell";
import { HealthCluesQuiz } from "@/components/healthclues/HealthCluesQuiz";
import { validateQuizAttribution } from "@/lib/healthclues-quiz";
import { getActiveQuizBank } from "@/features/healthclues/quiz-bank";
import { HealthCluesLocaleProvider } from "@/components/healthclues/HealthCluesLocaleProvider";

export const metadata: Metadata = {
  title: "Free Wellness Discovery Quiz | HealthClues",
  description: "Explore wellness topics, everyday preferences, and resources that fit your interests. This quiz does not diagnose or provide medical advice.",
  alternates: { canonical: "/en/wellness/healthclues/quiz" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function HealthCluesQuizPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const attribution = validateQuizAttribution(params);
  const quizBank = await getActiveQuizBank();
  const initialView = params.step === "discovery" ? "discovery" : params.step === "quest" ? "quest" : params.step === "reveal" ? "result" : "intro";
  const initialQuest = typeof params.quest === "string" ? params.quest : "";
  return <HealthCluesLocaleProvider initialLocale="en"><HealthCluesGameShell current="quest"><HealthCluesQuiz attribution={attribution} questionBank={quizBank.questions} quizVersion={quizBank.version} initialView={initialView} initialQuest={initialQuest} /></HealthCluesGameShell></HealthCluesLocaleProvider>;
}
