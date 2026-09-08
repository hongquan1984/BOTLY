import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { guideCards, pillars, type WellnessLocale } from "@/data/wellness";
import { WellnessShell } from "./WellnessShell";

export function PillarPage({ locale, slug }: { locale: WellnessLocale; slug: string }) {
  const vi = locale === "vi";
  const pillar = pillars[locale].find((item) => item.slug === slug) ?? pillars[locale][0];
  const Icon = pillar.icon;
  const toolsHref = vi ? "/vi/song-khoe/cong-cu" : "/en/wellness/tools";
  return <WellnessShell locale={locale}><main>
    <section className={`pillar-hero tone-${pillar.tone}`}><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-[1fr_.8fr] lg:px-8"><div><p className="section-kicker">BOTLY WELLNESS · {pillar.name.toUpperCase()}</p><h1>{pillar.kicker}</h1><p>{pillar.description}</p><Link href={toolsHref} className="wellness-button mt-7">{vi ? "Thử công cụ miễn phí" : "Try a free tool"}<ArrowRight /></Link></div><div className="pillar-symbol"><Icon /></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="section-kicker">{vi ? "KHÁM PHÁ" : "EXPLORE"}</p><h2 className="section-title">{vi ? "Bắt đầu từ điều phù hợp với bạn" : "Start with what fits your day"}</h2><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillar.topics.map((topic, index) => <div key={topic} className="rounded-3xl border border-[#18302b]/10 bg-white p-6"><span className="text-xs font-bold text-[#809188]">0{index + 1}</span><h3 className="mt-8 text-lg font-semibold">{topic}</h3><p className="mt-2 text-sm leading-6 text-[#61756e]">{vi ? "Hướng dẫn rõ ràng và bước thực hành nhỏ để bắt đầu." : "Clear guidance and one small practice to begin."}</p></div>)}</div></section>
    <section className="bg-[#eaf0e5]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-2"><div><p className="section-kicker">{vi ? "CÁCH BOTLY TIẾP CẬN" : "THE BOTLY APPROACH"}</p><h2 className="section-title">{vi ? "Thực tế, nhẹ nhàng, trung thực." : "Practical, gentle and honest."}</h2></div><div className="space-y-5">{(vi ? ["Không hứa hẹn chữa bệnh hay kết quả tức thì", "Nêu rõ giới hạn và mức độ bằng chứng", "Ưu tiên thói quen có thể duy trì trong đời sống"] : ["No cure claims or instant-result promises", "Clear limits and evidence context", "Habits designed to fit into everyday life"]).map(x => <p key={x} className="flex gap-3 text-[#4e665d]"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#5f826f]" />{x}</p>)}</div></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="section-kicker">{vi ? "ĐỌC TIẾP" : "KEEP EXPLORING"}</p><div className="mt-8 grid gap-5 lg:grid-cols-3">{guideCards[locale].map((guide) => <Link href={`${vi ? "/vi/song-khoe/huong-dan" : "/en/wellness/guides"}/${guide.slug}`} key={guide.title} className="guide-card p-6"><p className="text-xs font-bold tracking-widest text-[#718179]">{guide.tag}</p><h3 className="mt-3 text-xl font-semibold leading-7">{guide.title}</h3><p className="mt-7 flex justify-between text-sm text-[#6c7d77]">{guide.meta}<ArrowRight className="h-4 w-4" /></p></Link>)}</div></section>
  </main></WellnessShell>;
}
