import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import type { Portal } from "@/data/wellness-portals";
import type { WellnessLocale } from "@/data/wellness";
import { WellnessShell } from "./WellnessShell";
import { listPublishedArticles } from "@/lib/published-articles";
import { articlePath } from "@/lib/article-publishing";

export async function PortalHub({ locale, portal: original }: { locale: WellnessLocale; portal: Portal }) {
  const latest = await listPublishedArticles(locale, original.id);
  const portal = { ...original, stories: [...latest.map(a => ({ title: a.title,
    label: locale === 'vi' ? 'BÀI MỚI' : 'LATEST', href: articlePath(locale, a.slug) })), ...original.stories],
    videos: [...latest.filter(a => a.wellness_articles.facebook_url).slice(0, 3).map(a => ({
      title: a.title, duration: 'Facebook', href: a.wellness_articles.facebook_url!,
    })), ...original.videos].slice(0, 3) };
  const vi = locale === "vi";
  return <WellnessShell locale={locale}><main>
    <section className={`portal-hero tone-${portal.tone}`}><div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[1fr_.75fr] lg:px-8"><div><p className="section-kicker">BOTLY · {portal.name.toUpperCase()}</p><h1>{portal.tagline}</h1><p>{portal.description}</p><Link href={portal.featuredTool.href} className="wellness-button mt-7">{vi ? "Bắt đầu ngay" : "Start here"}<ArrowRight /></Link></div><div className="portal-mascot"><Image src={portal.mascot} alt={`${portal.mascotName}, ${portal.name} mascot`} width={520} height={620} priority /><span>{vi ? `Xin chào, mình là ${portal.mascotName}!` : `Hi, I'm ${portal.mascotName}!`}</span></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><p className="section-kicker">01 — {vi ? "CÔNG CỤ NỔI BẬT" : "FEATURED TOOL"}</p><div className={`featured-tool tone-${portal.tone}`}><div><span className="tool-icon"><Sparkles /></span><h2>{portal.featuredTool.title}</h2><p>{portal.featuredTool.description}</p><Link href={portal.featuredTool.href} className="wellness-button mt-6">{vi ? "Mở công cụ" : "Open the tool"}<ArrowRight /></Link></div><Image src={portal.mascot} alt="" width={260} height={320} /></div><div className="mt-5 grid gap-4 md:grid-cols-3">{portal.tools.map((tool) => <Link key={tool.title} href={tool.href} className="friendly-tool-box"><span>✦</span><h3>{tool.title}</h3><p>{tool.description}</p><ArrowRight /></Link>)}</div></section>
    <section className="bg-[#eaf0e5]"><div className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><div className="section-row"><div><p className="section-kicker">02 — VIDEO</p><h2 className="section-title">{vi ? `Xem cùng ${portal.mascotName}` : `Watch with ${portal.mascotName}`}</h2></div><span>{vi ? "Video ngắn, một ý rõ ràng" : "Short videos, one clear idea"}</span></div><div className="mt-9 grid gap-5 md:grid-cols-3">{portal.videos.map((video) => { const card = <><div className={`video-art tone-${portal.tone}`}><Image src={portal.mascot} alt="" width={190} height={220} /><span className="video-play"><Play /></span><b>{video.duration}</b></div><div className="p-5"><span className="text-[10px] font-extrabold tracking-[.16em] text-[#74867e]">{portal.name.toUpperCase()} VIDEO</span><h3 className="mt-2 text-lg font-semibold leading-6">{video.title}</h3></div></>; return video.href ? <a key={video.title} href={video.href} target="_blank" rel="noreferrer" className="video-card">{card}</a> : <article key={video.title} className="video-card">{card}</article>; })}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><div className="section-row"><div><p className="section-kicker">03 — {vi ? "BÀI MỚI" : "LATEST"}</p><h2 className="section-title">{vi ? "Đọc tiếp, hiểu rõ hơn" : "Read on, understand more"}</h2></div><ShieldCheck /></div><div className="mt-9 grid gap-4 lg:grid-cols-3">{portal.stories.map((story, index) => <Link href={story.href} key={story.title} className="story-box"><div className={`story-number tone-${portal.tone}`}>0{index + 1}</div><div><span>{story.label}</span><h3>{story.title}</h3></div><ArrowRight /></Link>)}</div></section>
  </main></WellnessShell>;
}
