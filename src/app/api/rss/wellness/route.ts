import { listPublishedArticles } from '@/lib/published-articles';
import { siteConfig } from '@/data/site';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute

function escapeCdata(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/]]>/g, ']]]]><![CDATA[>');
}

function escapeXmlAttr(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveCoverUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return `${siteConfig.url}/og-image.jpg`;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  if (rawUrl.startsWith('/articles/')) {
    return `https://rswmadukvegraxfcdbcb.supabase.co/storage/v1/object/public${rawUrl}`;
  }
  return `${siteConfig.url}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'en') as 'en' | 'vi';
    const category = (searchParams.get('category') || 'healing') as any;
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 5), 50);

    const articles = await listPublishedArticles(locale, category || undefined, limit);

    const feedUrl = `${siteConfig.url}/api/rss/wellness${locale === 'vi' ? '?locale=vi' : ''}`;
    const siteTitle = locale === 'vi' 
      ? 'Botly - Sống Khỏe & Giấc Ngủ Tự Nhiên' 
      : 'Botly Sleep Wellness & Insomnia Relief';
    const siteDesc = locale === 'vi'
      ? 'Khoa học giấc ngủ, điều hòa hệ thần kinh và phục hồi nhịp sinh học tự nhiên.'
      : 'Evidence-based sleep science, bedtime somatic resets, and circadian alignment guides.';
    const feedHome = `${siteConfig.url}/${locale === 'vi' ? 'vi/song-khoe' : 'en/wellness'}`;
    const quizUrl = `${siteConfig.url}/quiz-insomnia`;

    const itemsXml = articles.map(article => {
      const slug = article.slug;
      const articleUrl = `${siteConfig.url}/${locale === 'vi' ? 'vi/song-khoe/huong-dan' : 'en/wellness/guides'}/${slug}`;
      const pubDate = new Date(article.published_at).toUTCString();
      const rawCover = resolveCoverUrl(article.wellness_articles?.cover_image_url);
      const safeCoverAttr = escapeXmlAttr(rawCover);
      const safeArticleUrl = escapeXmlAttr(articleUrl);
      const title = article.title;
      const description = article.description || article.takeaway || '';
      
      const ctaText = locale === 'vi'
        ? `Làm bài kiểm tra giấc ngủ 2 phút miễn phí để nhận diện hồ sơ cortisol ban đêm: ${quizUrl}`
        : `Take the Free 2-Minute Sleep Quiz to identify your nocturnal cortisol profile: ${quizUrl}`;

      const fullDescription = `${description} — ${ctaText}`;
      const htmlBody = `
        <p>${escapeCdata(description)}</p>
        <p><img src="${safeCoverAttr}" alt="${escapeCdata(article.cover_image_alt || title)}" /></p>
        <p><a href="${quizUrl}"><strong>Take the Free 2-Minute Sleep Quiz &rarr;</strong></a></p>
        <p><a href="${articleUrl}">Read full guide on Botly &rarr;</a></p>
      `.trim();

      return `
    <item>
      <title><![CDATA[${escapeCdata(title)}]]></title>
      <link>${safeArticleUrl}</link>
      <guid isPermaLink="true">${safeArticleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[Botly Science Team]]></dc:creator>
      <description><![CDATA[${escapeCdata(fullDescription)}]]></description>
      <content:encoded><![CDATA[${htmlBody}]]></content:encoded>
      <enclosure url="${safeCoverAttr}" type="image/jpeg" length="102400" />
      <media:content url="${safeCoverAttr}" medium="image" type="image/jpeg">
        <media:title><![CDATA[${escapeCdata(title)}]]></media:title>
        <media:description><![CDATA[${escapeCdata(description)}]]></media:description>
      </media:content>
      <media:thumbnail url="${safeCoverAttr}" />
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${escapeCdata(siteTitle)}]]></title>
    <link>${escapeXmlAttr(feedHome)}</link>
    <description><![CDATA[${escapeCdata(siteDesc)}]]></description>
    <language>${locale === 'vi' ? 'vi-VN' : 'en-US'}</language>
    <atom:link href="${escapeXmlAttr(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteConfig.url}/og-image.jpg</url>
      <title><![CDATA[${escapeCdata(siteTitle)}]]></title>
      <link>${escapeXmlAttr(feedHome)}</link>
    </image>
${itemsXml}
  </channel>
</rss>`.trim();

    return new Response(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error generating wellness RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
