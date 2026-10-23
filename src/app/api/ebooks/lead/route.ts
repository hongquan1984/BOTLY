import { createHash, createHmac, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseConfig, supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fallbackRequests = new Map<string, number[]>();
const fallbackDownloadableEbooks = new Set([
  'blood-sugar', 'antioxidants', 'liver-health', 'food-remedies', 'healthy-life-beverage-book', 'a-book-of-simples',
  'complete-herbal', 'hildas-recipes', 'herbal-simples',
]);

function isMissingEbookRpc(status: number, result: Record<string, unknown>) {
  const code = typeof result.code === 'string' ? result.code : '';
  const message = `${result.message || ''} ${result.details || ''}`.toLowerCase();
  return status === 404 && (code === 'PGRST202' || message.includes('capture_ebook_lead') || message.includes('schema cache'));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      email?: string; name?: string; ebookId?: string; locale?: string;
      sourcePage?: string; deliveryConsent?: boolean; marketingConsent?: boolean; website?: string;
    };
    if (body.website) return NextResponse.json({ ok: true });
    const email = body.email?.trim().toLowerCase();
    const ebookId = body.ebookId?.trim();
    if (!email || email.length > 254 || !emailPattern.test(email) || !ebookId || !/^[a-z0-9-]{1,100}$/.test(ebookId))
      return NextResponse.json({ error: 'Invalid form' }, { status: 400 });
    if (body.deliveryConsent !== true) return NextResponse.json({ error: 'Delivery consent is required' }, { status: 400 });
    const serviceConfig = supabaseConfig(true);
    if (!serviceConfig) return NextResponse.json({ error: 'Download service is not configured' }, { status: 503 });
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const secret = serviceConfig.key;
    const bucketHash = createHash('sha256').update(`${secret}:${ip}`).digest('hex');
    const response = await supabaseRequest('rpc/capture_ebook_lead', {
      method: 'POST', body: JSON.stringify({
        p_email: email, p_name: (body.name || '').trim().slice(0, 120) || null,
        p_ebook_id: ebookId, p_locale: body.locale === 'vi' ? 'vi' : 'en',
        p_source_page: (body.sourcePage || '').slice(0, 300),
        p_marketing: body.marketingConsent === true, p_bucket_hash: bucketHash,
      }),
    }, true);
    const result = await response.json().catch(() => ({})) as Record<string, any>;
    let leadId = typeof result.lead_id === 'string' ? result.lead_id : '';
    let downloadUrl = result.download_url;
    let downloadUrls: { label: string; url: string }[] | undefined;
    if (!response.ok) {
      const message = result.message || result.details || '';
      if (message.includes('RATE_LIMITED')) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      if (message.includes('LINK_OUT_ONLY')) return NextResponse.json({ error: 'This resource is available from its original source.' }, { status: 409 });
      if (message.includes('EBOOK_NOT_FOUND')) return NextResponse.json({ error: 'This ebook is not available.' }, { status: 404 });
      if (message.includes('INVALID_EMAIL')) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      if (isMissingEbookRpc(response.status, result)) {
        if (!fallbackDownloadableEbooks.has(ebookId)) return NextResponse.json({ error: 'This resource is not cleared for direct download.' }, { status: 409 });
        // Keep email delivery usable while the database migration is pending. This
        // temporary path only mints a short-lived download token; it never opts
        // the address into marketing. Persistent lead/reporting needs the RPC.
        const timestamps = (fallbackRequests.get(bucketHash) || []).filter((time) => Date.now() - time < 60 * 60 * 1000);
        if (timestamps.length >= 10) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        timestamps.push(Date.now()); fallbackRequests.set(bucketHash, timestamps);
        leadId = randomUUID();
        downloadUrl = 'email-gated';
        console.warn('Ebook database migration is missing; issuing temporary download token', { ebookId });
      } else {
      console.error('Ebook lead capture failed', { status: response.status, code: result.code });
      return NextResponse.json({ error: 'Could not unlock this ebook right now.' }, { status: 502 });
      }
    }
    if (downloadUrl === 'email-gated' && leadId) {
      const makeUrl = (part?: string, format?: 'pdf' | 'epub') => {
        const expiresAt = String(Date.now() + 24 * 60 * 60 * 1000);
        const signature = createHmac('sha256', secret).update(`${leadId}:${ebookId}:${part || format || 'single'}:${expiresAt}`).digest('hex');
        const url = new URL('/api/ebooks/file', request.url);
        url.searchParams.set('leadId', leadId);
        url.searchParams.set('ebookId', ebookId);
        if (part) url.searchParams.set('part', part);
        if (format) url.searchParams.set('format', format);
        url.searchParams.set('exp', expiresAt);
        url.searchParams.set('sig', signature);
        return url.toString();
      };
      if (['food-remedies', 'healthy-life-beverage-book', 'a-book-of-simples', 'complete-herbal'].includes(ebookId)) {
        downloadUrls = [
          { label: 'Download PDF', url: makeUrl(undefined, 'pdf') },
          { label: 'Download EPUB', url: makeUrl(undefined, 'epub') },
        ];
        downloadUrl = undefined;
      } else if (ebookId === 'herbal-simples') {
        downloadUrls = [
          { label: 'Download Volume 1 (pages 1–230)', url: makeUrl('1') },
          { label: 'Download Volume 2 (pages 231–459)', url: makeUrl('2') },
        ];
        downloadUrl = undefined;
      } else downloadUrl = makeUrl();
    }
    return NextResponse.json({ ok: true, downloadUrl, downloadUrls, leadId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
