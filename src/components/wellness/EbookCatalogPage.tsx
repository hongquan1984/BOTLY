"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, CheckCircle2, ExternalLink, Search, Sparkles } from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { wellnessEbooks } from "@/data/wellness-ebooks";
import type { PublicEbook } from "@/lib/ebook-catalog";
import { WellnessShell } from "./WellnessShell";
import { EbookLeadCapture } from "./EbookLeadCapture";

const categoryLabels: Record<string, string> = {
  'food-wellness':'Food & Wellness','healthy-drinks':'Healthy Drinks','wellness-history':'Wellness History',
  'herbal-traditions':'Herbal Traditions','botanical-reference':'Botanical Reference','heritage-cooking':'Heritage Cooking',
  'herbal-reference':'Herbal Reference','nutrition':'Nutrition','herbal-tea':'Herbal Tea',
  'tea-preparation':'Tea Preparation','resource-collection':'Resource Collection',
  'healthy-recipes':'Healthy Recipes','sleep-support':'Sleep Support','natural-remedies':'Traditional Wellness',
};

export function EbookCatalogPage({ locale, ebooks = [] }: { locale: WellnessLocale; ebooks?: PublicEbook[] }) {
  const [category, setCategory] = useState("All guides");
  const [search, setSearch] = useState("");
  const library = ebooks.length ? ebooks.map((ebook) => ({
    id: ebook.id, slug: ebook.slug, titleEn: ebook.public_display_title, subtitleEn: ebook.public_subtitle,
    categoryEn: categoryLabels[ebook.category_id] || ebook.category_id.replaceAll('-', ' '), descriptionEn: ebook.summary_short || ebook.summary_long,
    coverImage: ebook.cover_image_url || '/ebooks/covers/vol3-weight-management.png',
    status: 'available' as const, pdfUrl: ebook.downloadable_file_url || undefined,
    sourceUrl: undefined, featured: ebook.featured,
  })) : wellnessEbooks.map((ebook) => ({
    id: ebook.id, slug: ebook.slugEn, titleEn: ebook.titleEn, subtitleEn: ebook.subtitleEn,
    categoryEn: ebook.id === 'better-sleep' ? 'Sleep Support' : ['blood-sugar', 'antioxidants', 'weight-management'].includes(ebook.id) ? 'Healthy Recipes' : 'Traditional Wellness',
    descriptionEn: ebook.descriptionEn, coverImage: ebook.coverImage, status: ebook.status,
    pdfUrl: ['blood-sugar', 'antioxidants', 'liver-health'].includes(ebook.id) ? ebook.pdfUrl : undefined,
    sourceUrl: undefined, featured: ebook.id === 'blood-sugar' || ebook.id === 'antioxidants',
  }));
  const categories = ['All guides', ...Array.from(new Set(library.map(ebook => ebook.categoryEn)))];
  const visible = library.filter((ebook) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${ebook.titleEn} ${ebook.subtitleEn} ${ebook.categoryEn} ${ebook.descriptionEn}`.toLowerCase().includes(term);
    const matchesCategory = category === "All guides" || category === ebook.categoryEn;
    return matchesSearch && matchesCategory;
  });

  return <WellnessShell locale={locale}>
    <main className="min-h-screen bg-[#f7faf6] text-[#18302b]">
      <section className="relative overflow-hidden border-b border-[#d8e4d8] bg-gradient-to-br from-[#eaf4e9] via-[#f7faf6] to-[#f7f2e6]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-900"><Sparkles className="h-4 w-4"/> BOTLY WELLNESS EBOOK LIBRARY</div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">Small, thoughtful guides for everyday wellness</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#526b62] sm:text-lg">Explore practical food, drink and wellbeing guides, created to make good information easier to use. Verified ebooks can be downloaded after email capture; other resources open at their original source.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-[#526b62]"><span className="rounded-full bg-white/80 px-4 py-2">Carefully curated</span><span className="rounded-full bg-white/80 px-4 py-2">Email delivery</span><span className="rounded-full bg-white/80 px-4 py-2">English editions</span></div>
          </div>
          <div className="hidden justify-self-end rounded-[2rem] border border-white/80 bg-white/60 p-4 shadow-xl sm:block">
            <Image src="/ebooks/blood-sugar/lentils-rice-hero.png" alt="A colorful, balanced meal with lentils and rice" width={440} height={340} className="h-[300px] w-[400px] rounded-[1.5rem] object-cover" priority />
            <div className="px-2 pb-1 pt-4"><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Featured collection</p><p className="mt-1 text-xl font-extrabold">Everyday food pairings</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Explore the library</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Guides for your everyday</h2></div>
          <label className="flex w-full items-center gap-3 rounded-2xl border border-[#d6e3d6] bg-white px-4 py-3 md:max-w-sm"><Search className="h-4 w-4 shrink-0 text-emerald-800"/><span className="sr-only">Search ebooks</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guides and topics" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></label>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter ebooks by category">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${category === item ? "bg-[#18302b] text-white" : "border border-[#d6e3d6] bg-white text-[#526b62] hover:border-emerald-700"}`}>{item}</button>)}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ebook) => {
            const href = ebook.id === "blood-sugar" ? "/en/wellness/ebooks/blood-sugar-pairings" : ebook.id === "antioxidants" ? "/en/wellness/ebooks/antioxidants" : ebooks.length && ebook.slug ? `/en/wellness/ebooks/${ebook.slug}` : null;
            return <article key={ebook.id} className="flex flex-col overflow-hidden rounded-3xl border border-[#d6e3d6] bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
              <div className="relative h-56 bg-[#eaf2e8]"><Image src={ebook.coverImage} alt={ebook.titleEn} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-contain p-3"/><span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold capitalize text-emerald-900">{ebook.categoryEn}</span>{ebook.pdfUrl && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#18302b] px-3 py-1.5 text-[11px] font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5"/> Free download</span>}</div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-extrabold leading-snug">{ebook.titleEn}</h3>
                <p className="mt-2 text-sm font-semibold text-emerald-800">{ebook.subtitleEn}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#526b62]">{ebook.descriptionEn}</p>
                <div className="mt-6 space-y-2">
                  {ebook.status === "available" && ebook.pdfUrl && <EbookLeadCapture locale="en" variant="inline" source={`ebook_library:${ebook.id}`} ebookId={ebook.id} ebookTitle={ebook.titleEn} pdfUrl={ebook.pdfUrl} />}
                  {href && <Link href={href} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d6e3d6] px-4 py-3 text-sm font-bold text-[#18302b] hover:bg-[#f4f8f4]"><BookOpen className="h-4 w-4"/>{ebook.pdfUrl ? 'Explore this guide' : 'View Source & Credits'}</Link>}
                </div>
              </div>
            </article>;
          })}
        </div>
        {visible.length === 0 && <p className="py-16 text-center text-[#526b62]">No guides match that search. Try another topic.</p>}
        <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-[#71837b]">Botly’s wellness content is for general educational purposes and is not a substitute for professional medical advice. Historical source material is linked for cultural interest and should not be used as treatment guidance.</p>
      </section>
      <section className="mx-auto max-w-5xl px-5 pb-16"><div className="rounded-3xl bg-[#18302b] p-7 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-emerald-200">A note on our sources</p><h2 className="mt-3 text-2xl font-extrabold">Thoughtful reading, with context</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-50/80">Some books in our collection are historical works held by libraries and publishers. We keep their source records for review and send readers to the original provider when redistribution terms are unclear or restricted.</p><Link href="/en/wellness/guides" className="mt-5 inline-flex items-center gap-2 font-bold text-amber-300 hover:text-amber-200">Browse wellness articles <ExternalLink className="h-4 w-4"/></Link></div></section>
    </main>
  </WellnessShell>;
}
