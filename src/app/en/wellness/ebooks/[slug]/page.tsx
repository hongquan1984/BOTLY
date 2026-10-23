import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { EbookLeadCapture } from '@/components/wellness/EbookLeadCapture';
import { WellnessShell } from '@/components/wellness/WellnessShell';
import { findPublicEbook, recordEbookPageView } from '@/lib/ebook-catalog';
import { listPublishedArticles } from '@/lib/published-articles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await findPublicEbook(slug);
  if (!ebook) return { title: 'Wellness ebook | Botly' };
  return {
    title: ebook.public_display_title,
    description: ebook.public_subtitle || ebook.summary_short,
    alternates: { canonical: `/en/wellness/ebooks/${ebook.slug}` },
    openGraph: { title: ebook.public_display_title, description: ebook.public_subtitle || ebook.summary_short, images: ebook.cover_image_url ? [ebook.cover_image_url] : [] },
  };
}

export default async function EbookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ebook = await findPublicEbook(slug);
  if (!ebook) notFound();
  await recordEbookPageView(ebook.id, `/en/wellness/ebooks/${slug}`);
  const articles = await listPublishedArticles('en', undefined, 3).catch(() => []);
  const benefits = ebook.tags.slice(0, 4);
  return <WellnessShell locale="en">
    <main className="min-h-screen bg-[#f7faf6] text-[#18302b]">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8"><Link href="/en/wellness/ebooks" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900"><ArrowLeft className="h-4 w-4"/> Back to the ebook library</Link>
        <section className="mt-7 grid gap-10 rounded-[2rem] border border-[#dce8dc] bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-[#eaf2e8]">{ebook.cover_image_url && <Image src={ebook.cover_image_url} alt={ebook.public_display_title} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain p-5" priority/>}</div>
          <div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">{ebook.category_id.replaceAll('-', ' ')}</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{ebook.public_display_title}</h1><p className="mt-4 text-lg font-semibold text-emerald-800">{ebook.public_subtitle}</p><p className="mt-5 leading-relaxed text-[#526b62]">{ebook.summary_long || ebook.summary_short}</p>
            {benefits.length > 0 && <div className="mt-6"><h2 className="font-extrabold">What you’ll find inside</h2><ul className="mt-3 flex flex-wrap gap-2">{benefits.map((tag) => <li key={tag} className="rounded-full bg-[#edf4ec] px-3 py-1.5 text-xs font-semibold capitalize text-emerald-950">{tag}</li>)}</ul></div>}
            <div className="mt-7 max-w-md">{ebook.downloadable_file_url ? <EbookLeadCapture locale="en" variant="hero" source={`ebook_detail:${ebook.slug}`} ebookId={ebook.id} ebookTitle={ebook.public_display_title} pdfUrl={ebook.downloadable_file_url}/> : ebook.source_url ? <a href={ebook.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18302b] px-5 py-3.5 font-bold text-white hover:bg-[#25483a]">View Original Resource <ExternalLink className="h-4 w-4"/></a> : <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-950">This resource is being reviewed before release.</p>}</div>
          </div>
        </section>
        {ebook.source_url && <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#dce8dc] bg-white p-6 text-sm text-[#526b62]"><h2 className="text-lg font-extrabold text-[#18302b]">Source &amp; Credits</h2><dl className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr]"><dt className="font-semibold">Original work</dt><dd>{ebook.source_title_original || 'Source resource'}</dd>{ebook.source_author && <><dt className="font-semibold">Author / editor</dt><dd>{ebook.source_author}</dd></>}<dt className="font-semibold">Source</dt><dd>{ebook.source_site || 'Original provider'}</dd><dt className="font-semibold">Rights information</dt><dd>{ebook.source_license_type}</dd><dt className="font-semibold">What opens</dt><dd>{ebook.document_delivery_note}</dd></dl><a href={ebook.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-bold text-emerald-900 underline">Open the original resource <ExternalLink className="h-3.5 w-3.5"/></a><p className="mt-4 text-xs leading-relaxed text-[#71837b]">The cover is a Botly catalog cover. It does not imply that Botly authored or owns the source work. Where redistribution permission is not verified, the actual file stays with the source provider.</p></section>}
        {articles.length > 0 && <section className="mt-12"><h2 className="text-2xl font-extrabold">Related wellness articles</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">{articles.map((article) => <Link key={article.article_id} href={`/en/wellness/guides/${article.slug}`} className="rounded-2xl border border-[#dce8dc] bg-white p-5 hover:border-emerald-700"><p className="font-bold">{article.title}</p><p className="mt-2 line-clamp-2 text-sm text-[#526b62]">{article.description}</p></Link>)}</div></section>}
        <p className="mx-auto mt-12 max-w-3xl pb-8 text-center text-xs leading-relaxed text-[#71837b]">Botly content is educational and is not a substitute for professional medical advice. Historical remedies and traditional uses are not evidence of safety or effectiveness.</p>
      </div>
    </main>
  </WellnessShell>;
}
