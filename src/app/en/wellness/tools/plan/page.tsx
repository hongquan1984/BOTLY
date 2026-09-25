import type { Metadata } from "next";
import { WellnessPlanner } from "@/components/wellness/WellnessPlanner";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "7-Day Wellness Planner", description: "Build a gentle seven-day plan for healthy eating, stress care and mindfulness.", alternates: { canonical: "/en/wellness/tools/plan" } };
export default function Page() { return <WellnessShell locale="en"><main className="mx-auto max-w-4xl px-5 py-16 lg:px-8"><p className="section-kicker">BOTLY WELLNESS PLAN</p><h1 className="section-title !text-5xl">A plan that fits real life.</h1><p className="section-subtitle">Three gentle steps a day across nourishment, calm and mindfulness.</p><WellnessPlanner locale="en" /></main></WellnessShell>; }
