"use client";

import { useState } from "react";
import type { WellnessLocale } from "@/data/wellness";
import { trackWellness } from "@/lib/wellness-analytics";

export function NewsletterForm({ locale, placeholder, buttonLabel }: { locale: WellnessLocale; placeholder: string; buttonLabel: string }) {
  const vi = locale === "vi"; const [email, setEmail] = useState(""); const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setStatus("loading"); const form = event.currentTarget as HTMLFormElement; const website = new FormData(form).get("website") as string; try { const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale, website }) }); if (!response.ok) throw new Error(); setStatus("done"); trackWellness("newsletter_submitted", { locale }); } catch { setStatus("error"); } };
  if (status === "done") return <div className="rounded-2xl bg-white/10 p-4 text-sm font-semibold">✓ {vi ? "Đã đăng ký. Hẹn gặp bạn vào Chủ nhật!" : "You’re in. See you on Sunday!"}</div>;
  return <form onSubmit={submit} className="flex max-w-md flex-col gap-3 sm:flex-row"><input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={placeholder} aria-label={placeholder} /><button disabled={status === "loading"} type="submit">{status === "loading" ? "..." : buttonLabel}</button>{status === "error" && <span className="text-xs text-[#ffd6cf] sm:absolute sm:mt-14">{vi ? "Chưa thể đăng ký. Vui lòng thử lại." : "Could not subscribe. Please try again."}</span>}</form>;
}
