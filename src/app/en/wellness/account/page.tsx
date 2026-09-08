import type { Metadata } from "next";
import { AccountPage } from "@/components/wellness/WellnessAccount";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "Botly Account", robots: { index: false, follow: false } };
export default function Page() { return <WellnessShell locale="en"><AccountPage locale="en" /></WellnessShell>; }
