import catalog from './botly-ebook-catalog.json';
import type { PublicEbook } from '@/lib/ebook-catalog';
import { wellnessEbooks } from './wellness-ebooks';

const sourceMeta: Record<string, Pick<PublicEbook, 'category_id' | 'source_author' | 'source_site' | 'source_license_type' | 'document_delivery_note' | 'summary_short' | 'summary_long'>> = {
  '01': { category_id:'food-wellness', source_author:'Florence Daniel', source_site:'Project Gutenberg', source_license_type:'Public domain in the United States; territory review required', summary_short:'Explore food traditions and everyday ingredients through a historical source.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual document is “Food Remedies: Facts About Foods and Their Medicinal Uses,” hosted by Project Gutenberg. Open the source page to read or download its available formats. Botly does not host this file.', document_delivery_note:'The reader receives the original Project Gutenberg ebook from its source page, not a Botly PDF.' },
  '02': { category_id:'healthy-drinks', source_author:null, source_site:'Project Gutenberg', source_license_type:'Public domain in the United States; territory review required', summary_short:'Browse historic beverage ideas and food culture.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual document is “The Healthy Life Beverage Book.” Project Gutenberg hosts the source ebook; Botly links to its available formats and does not host this file.', document_delivery_note:'The actual document is the historical Project Gutenberg ebook; formats are provided at the source page.' },
  '03': { category_id:'wellness-history', source_author:'Thomas Jefferson Ritter', source_site:'Project Gutenberg', source_license_type:'Public domain in the United States; territory review required', summary_short:'A historical home reference, presented for cultural interest.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual source is “Mother’s Remedies,” a historical home-remedy book. Project Gutenberg hosts it; Botly links to the source and does not host the file.', document_delivery_note:'The actual document is the historical source ebook. Botly does not host or modify the source file.' },
  '04': { category_id:'herbal-traditions', source_author:'Henry William Lewer (editor)', source_site:'Project Gutenberg', source_license_type:'Public domain in the United States; territory review required', summary_short:'Read a historic collection of household recipes and plant traditions.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual source document is “A Book of Simples,” edited by Henry William Lewer. Project Gutenberg provides the source ebook and available formats; Botly does not host it.', document_delivery_note:'The actual document is the original Project Gutenberg ebook, delivered from its source page.' },
  '05': { category_id:'botanical-reference', source_author:'Nicholas Culpeper', source_site:'Project Gutenberg', source_license_type:'Public domain in the United States; territory review required', summary_short:'Explore a historic botanical reference as cultural history.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual source document is “The Complete Herbal” by Nicholas Culpeper. Project Gutenberg hosts the ebook; Botly links to its page and does not host the file.', document_delivery_note:'The actual file is the source’s historic herbal ebook, linked on Project Gutenberg.' },
  '06': { category_id:'heritage-cooking', source_author:'Hildagonda J. Duckitt', source_site:'Wellcome Collection (material provided by University of Leeds Library)', source_license_type:'Public Domain Mark; source credit required; scan and territory review required', summary_short:'Browse a digitized historical cookbook from a library collection.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual source is Wellcome Collection’s digitized “Hilda’s Where Is It? of Recipes.” The source record provides access to the scanned historical volume. Botly links to the record and does not host the scan.', document_delivery_note:'The original source page offers the digitized historical volume; Botly does not host its scan.' },
  '07': { category_id:'herbal-reference', source_author:'W. T. Fernie', source_site:'Wellcome Collection (material provided by Royal College of Physicians of Edinburgh)', source_license_type:'Public Domain Mark; source credit required; scan and territory review required', summary_short:'Explore a library-held historical botanical reference.', summary_long:'This Botly catalog cover is not a Botly-authored ebook. The actual source is Wellcome Collection’s digitized copy of “Herbal Simples: Approved for Modern Uses of Cure.” The source page provides the scanned volume; Botly links there and does not host it.', document_delivery_note:'The actual source page provides access to the digitized volume; Botly does not host it.' },
  '08': { category_id:'nutrition', source_author:'Cheryl Casey, Scott Going, Lauren McCullough, Melanie Hingle', source_site:'Open Textbook Library / University of Arizona', source_license_type:'CC BY-NC (Attribution-NonCommercial)', summary_short:'Explore a contemporary culinary medicine textbook at its publisher.', summary_long:'This Botly catalog cover is not the textbook cover and is not a Botly-authored ebook. The actual document is “Culinary Medicine - 2025 Edition,” available online and in PDF/eBook formats from the publisher under CC BY-NC. Botly links to the provider and does not host or redistribute it.', document_delivery_note:'The source offers online, PDF and eBook formats. Botly links to the provider; it does not deliver a copy.' },
  '09': { category_id:'herbal-tea', source_author:null, source_site:'Free-Ebooks.net', source_license_type:'Redistribution permission unverified; link-out only', summary_short:'Visit the publisher page for this herbal tea title.', summary_long:'This Botly catalog cover is a collection label, not the original book cover. The actual ebook is “Herbal Tea Recipes & Remedies” hosted by Free-Ebooks.net. Botly has not verified redistribution permission and does not host the file.', document_delivery_note:'The actual ebook and its download are available on the source provider’s page, subject to its terms.' },
  '10': { category_id:'tea-preparation', source_author:null, source_site:'American College of Healthcare Sciences', source_license_type:'Reuse terms not stated on reviewed page; link-out only', summary_short:'Explore the original educational page about preparing herbal teas.', summary_long:'This Botly catalog cover is not an ACHS publication cover. The actual source is ACHS’s “Preparing Herbal Teas” resource page. Follow the provider to see available materials; Botly does not host a file.', document_delivery_note:'This is a source-page resource; Botly does not deliver a downloadable copy.' },
  '11': { category_id:'resource-collection', source_author:'Individual materials have their own creators', source_site:'Grass Roots Remedies Co-operative', source_license_type:'CC BY-NC-ND (credit, non-commercial use, no derivatives)', summary_short:'A curated route into individual community herbal resources.', summary_long:'This is a resource collection, not one ebook. Grass Roots Remedies provides individual handouts and recipes under CC BY-NC-ND terms. Botly links to the resource hub and does not host or bundle its files.', document_delivery_note:'The source contains multiple separate resources; there is no single ebook file. Choose an individual item at the source under its license.' },
};

export const suppliedEbookCatalog: PublicEbook[] = catalog.map((record) => {
  const meta = sourceMeta[record.id];
  return {
    id: record.id === '01' ? 'food-remedies' : record.id === '02' ? 'healthy-life-beverage-book' : record.id === '03' ? 'mothers-remedies' : record.id === '04' ? 'a-book-of-simples' : record.id === '05' ? 'complete-herbal' : record.id === '06' ? 'hildas-recipes' : record.id === '07' ? 'herbal-simples' : record.id === '08' ? 'culinary-medicine-2025' : record.id === '09' ? 'herbal-tea-recipes-remedies' : record.id === '10' ? 'preparing-herbal-teas' : 'grass-roots-remedies',
    public_display_title: record.display_title,
    public_subtitle: record.subtitle,
    slug: record.slug,
    summary_short: meta.summary_short,
    summary_long: (Number(record.id) <= 5 && record.id !== '03')
      ? `This Botly catalog cover is separate from the source ebook. After email capture, readers can choose the original Project Gutenberg EPUB or a PDF reading copy generated from it. The original EPUB and its source credits/license are retained. Historical health statements are not current medical guidance.`
      : (Number(record.id) === 6 || Number(record.id) === 7)
        ? `This Botly catalog cover is separate from the digitised source work. After email capture, Botly delivers the Wellcome Collection scan as PDF volumes. The source marks this work Public Domain Mark; source credit is shown below.`
        : meta.summary_long,
    cover_image_url: `/ebooks/library/${record.cover_file}`,
    category_id: meta.category_id,
    tags: [record.category.toLowerCase()],
    downloadable_file_url: (Number(record.id) <= 5 && record.id !== '03') || Number(record.id) === 6 || Number(record.id) === 7 ? 'email-gated' : null,
    source_url: record.source_url,
    source_title_original: record.id === '08' ? 'Culinary Medicine – 2025 Edition' : record.source_title,
    source_author: meta.source_author,
    source_site: meta.source_site,
    source_license_type: Number(record.id) <= 5 && record.id !== '03'
      ? 'Project Gutenberg labels this ebook public domain in the United States; Botly provides the source EPUB unchanged with its embedded license. Local rights review is documented internally.'
      : Number(record.id) === 6 || Number(record.id) === 7 ? 'Public Domain Mark; Wellcome states the work may be used for any purpose without restriction under copyright law. Credit Wellcome Collection.' : meta.source_license_type,
    document_delivery_note: Number(record.id) <= 5 && record.id !== '03'
      ? 'After email capture, choose either the original Project Gutenberg EPUB or a PDF reading copy generated from that EPUB. The original file and its embedded source credits/license are retained; the Botly cover is a separate catalog image.'
      : Number(record.id) === 6 || Number(record.id) === 7 ? (Number(record.id) === 7 ? 'The 459-page scan is delivered in two PDF volumes (pages 1–230 and 231–459) because of the storage file-size limit. The page content is retained. The supplied Botly cover is a separate catalog image.' : 'The actual file delivered is Wellcome Collection’s complete digitised scan PDF. It is source-generated and unmodified; the supplied Botly cover is a separate catalog image.') : meta.document_delivery_note,
    featured: Number(record.id) <= 3,
    status: 'published',
  };
});

export function fallbackPublicEbooks(): PublicEbook[] {
  const botlyEbooks: PublicEbook[] = wellnessEbooks.filter(ebook => ['blood-sugar','antioxidants','liver-health'].includes(ebook.id)).map(ebook => ({
    id: ebook.id, public_display_title: ebook.titleEn, public_subtitle: ebook.subtitleEn,
    slug: ebook.id === 'blood-sugar' ? 'everyday-food-pairings' : ebook.id === 'antioxidants' ? 'colorful-food-pairings' : 'everyday-foods-liver-health',
    summary_short: ebook.descriptionEn, summary_long: ebook.descriptionEn, cover_image_url: ebook.coverImage,
    category_id: 'healthy-recipes', tags: ebook.featuredPairingsEn, status: 'published',
    downloadable_file_url: ebook.pdfUrl || null, source_url: null, source_title_original: null, source_author: null,
    source_site: 'Botly', source_license_type: 'Botly-created educational guide',
    document_delivery_note: 'This is a Botly-created PDF guide. Enter your email to unlock the download.', featured: ebook.id !== 'liver-health',
  }));
  return [...botlyEbooks, ...suppliedEbookCatalog];
}

export function findFallbackEbook(slug: string): PublicEbook | null {
  return fallbackPublicEbooks().find(ebook => ebook.slug === slug) || null;
}
