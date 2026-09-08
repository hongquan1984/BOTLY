"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Globe2, Menu, X } from "lucide-react";
import { wellnessCopy, type WellnessLocale } from "@/data/wellness";

export function WellnessShell({ locale, children }: { locale: WellnessLocale; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const copy = wellnessCopy[locale];

  return (
    <div className="wellness-theme min-h-screen bg-[#f7f8f2] text-[#18302b]">
      <header className="sticky top-0 z-50 border-b border-[#18302b]/10 bg-[#f7f8f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href={locale === "en" ? "/en/wellness" : "/vi/song-khoe"} className="flex items-center gap-2 text-xl font-bold tracking-[-0.04em]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#18302b] text-[#d9f99d]">b</span>
            botly<span className="font-normal text-[#547168]">wellness</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Wellness navigation">
            {copy.nav.map(([label, href]) => <Link key={href} href={href} className="text-sm font-medium text-[#486159] transition hover:text-[#18302b]">{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href={locale === "en" ? "/en/wellness/my-plan" : "/vi/song-khoe/ke-hoach"} className="rounded-full bg-[#e6eddd] px-3 py-2 text-sm font-semibold">{locale === "en" ? "My plan" : "Kế hoạch"}</Link>
            <Link href={locale === "en" ? "/en/wellness/account" : "/vi/song-khoe/tai-khoan"} className="text-sm font-semibold text-[#60756e] hover:text-[#18302b]">{locale === "en" ? "Account" : "Tài khoản"}</Link>
            <Link href={copy.businessHref} className="text-sm text-[#60756e] hover:text-[#18302b]">{copy.businessLabel}</Link>
            <Link href={copy.languageHref} className="inline-flex items-center gap-1.5 rounded-full border border-[#18302b]/15 px-3 py-2 text-sm font-semibold"><Globe2 className="h-4 w-4" />{copy.languageLabel}</Link>
          </div>
          <button className="rounded-full border border-[#18302b]/15 p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && <div className="border-t border-[#18302b]/10 bg-[#f7f8f2] px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-4">
            {copy.nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="text-base font-semibold">{label}</Link>)}
            <Link href={locale === "en" ? "/en/wellness/my-plan" : "/vi/song-khoe/ke-hoach"}>{locale === "en" ? "My plan" : "Kế hoạch"}</Link>
            <Link href={locale === "en" ? "/en/wellness/account" : "/vi/song-khoe/tai-khoan"}>{locale === "en" ? "Account" : "Tài khoản"}</Link>
            <Link href={copy.businessHref}>{copy.businessLabel}</Link>
            <Link href={copy.languageHref} className="flex items-center gap-2"><Globe2 className="h-4 w-4" />{copy.languageLabel}</Link>
          </nav>
        </div>}
      </header>
      {children}
      <footer className="border-t border-[#18302b]/10 bg-[#18302b] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div><div className="text-2xl font-bold">botly<span className="font-normal text-[#c8e6d9]">wellness</span></div><p className="mt-3 max-w-sm text-sm leading-6 text-white/65">{copy.footerText}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9f99d]">Explore</p><div className="mt-4 flex flex-col gap-2">{copy.nav.map(([label, href]) => <Link key={href} href={href} className="text-sm text-white/70 hover:text-white">{label}</Link>)}</div></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9f99d]">Botly</p><Link href={copy.businessHref} className="mt-4 flex items-center gap-2 text-sm text-white/70 hover:text-white">{copy.businessLabel}<ArrowRight className="h-4 w-4" /></Link></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-5 py-5 text-xs text-white/45 lg:px-8"><span>© {new Date().getFullYear()} Botly</span><span>Privacy · Editorial policy · Terms</span></div>
      </footer>
    </div>
  );
}
