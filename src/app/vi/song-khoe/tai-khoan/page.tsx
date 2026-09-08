import type { Metadata } from "next";
import { AccountPage } from "@/components/wellness/WellnessAccount";
import { WellnessShell } from "@/components/wellness/WellnessShell";
export const metadata: Metadata = { title: "Tài khoản Botly", robots: { index: false, follow: false } };
export default function Page() { return <WellnessShell locale="vi"><AccountPage locale="vi" /></WellnessShell>; }
