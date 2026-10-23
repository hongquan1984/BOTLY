import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseConfig, supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const files: Record<string, string | string[]> = {
  'blood-sugar': 'public/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf',
  'antioxidants': 'public/ebooks/antioxidants/healthclues-antioxidant-guide.pdf',
  'liver-health': 'public/ebooks/liver-health/healthclues-liver-health-guide.pdf',
  'food-remedies': 'pg-18487.epub',
  'healthy-life-beverage-book': 'pg-78781.epub',
  'a-book-of-simples': 'pg-53951.epub',
  'complete-herbal': 'pg-49513.epub',
  'hildas-recipes': 'wellcome-b21528433.pdf',
  'herbal-simples': ['wellcome-b21908679-part-1.pdf', 'wellcome-b21908679-part-2.pdf'],
};
const formatFiles: Record<string, Partial<Record<'pdf' | 'epub', string>>> = {
  'food-remedies': { pdf: 'food-remedies-pdf.pdf', epub: 'pg-18487.epub' },
  'healthy-life-beverage-book': { pdf: 'healthy-life-beverage-book-pdf.pdf', epub: 'pg-78781.epub' },
  'a-book-of-simples': { pdf: 'a-book-of-simples-pdf.pdf', epub: 'pg-53951.epub' },
  'complete-herbal': { pdf: 'complete-herbal-pdf.pdf', epub: 'pg-49513.epub' },
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const leadId = params.get('leadId') || '';
  const ebookId = params.get('ebookId') || '';
  const part = params.get('part') || '';
  const format = params.get('format') || '';
  const variant = format === 'pdf' || format === 'epub' ? format : '';
  const expiresAt = params.get('exp') || '';
  const signature = params.get('sig') || '';
  const entry = files[ebookId];
  const filename = variant ? formatFiles[ebookId]?.[variant] || '' : Array.isArray(entry) ? (part === '1' ? entry[0] : part === '2' ? entry[1] : '') : (part ? '' : entry);
  const secret = supabaseConfig(true)?.key;
  const expiry = Number(expiresAt);
  if (!filename || !secret || !/^[0-9a-f-]{36}$/i.test(leadId) || !/^[0-9]{13}$/.test(expiresAt) || expiry <= Date.now() || expiry > Date.now() + 7 * 24 * 60 * 60 * 1000 || !/^[0-9a-f]{64}$/i.test(signature)) {
    return NextResponse.json({ error: 'Download link is invalid or expired.' }, { status: 403 });
  }
  const expected = createHmac('sha256', secret).update(`${leadId}:${ebookId}:${part || variant || 'single'}:${expiresAt}`).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'Download link is invalid or expired.' }, { status: 403 });
  }

  try {
    const leadResponse = await supabaseRequest(`ebook_email_leads?id=eq.${leadId}&ebook_id=eq.${ebookId}&select=id&limit=1`, {}, true);
    if (leadResponse.ok) {
      if (!(await leadResponse.json() as unknown[]).length) return NextResponse.json({ error: 'Download link is invalid or expired.' }, { status: 403 });
    } else if (leadResponse.status === 404) {
      const error = await leadResponse.json().catch(() => ({})) as { code?: string; message?: string; details?: string };
      const explanation = `${error.message || ''} ${error.details || ''}`.toLowerCase();
      if (error.code !== '42P01' && error.code !== 'PGRST205' && !explanation.includes('ebook_email_leads') && !explanation.includes('schema cache')) {
        return NextResponse.json({ error: 'Download link is invalid or expired.' }, { status: 403 });
      }
      console.warn('Ebook lead table is missing; validating this temporary token by signature only', { ebookId });
    } else {
      return NextResponse.json({ error: 'Download service is temporarily unavailable.' }, { status: 503 });
    }
    let body: BodyInit;
    let contentLength: string | null;
    if (filename.startsWith('public/')) {
      const assetPath = filename.slice('public'.length);
      const stored = await fetch(new URL(assetPath, request.url), { cache: 'no-store', signal: AbortSignal.timeout(60_000) });
      if (!stored.ok || !stored.body) return NextResponse.json({ error: 'Download is temporarily unavailable.' }, { status: 503 });
      body = stored.body;
      contentLength = stored.headers.get('content-length');
    } else {
      const config = supabaseConfig(true);
      if (!config) return NextResponse.json({ error: 'Download storage is not configured.' }, { status: 503 });
      const headers: Record<string, string> = { apikey: config.key };
      if (!config.key.startsWith('sb_')) headers.Authorization = `Bearer ${config.key}`;
      const stored = await fetch(`${config.url}/storage/v1/object/authenticated/ebook-downloads/${filename}`, {
        headers, cache: 'no-store', signal: AbortSignal.timeout(60_000),
      });
      if (!stored.ok || !stored.body) return NextResponse.json({ error: 'Download is temporarily unavailable.' }, { status: 503 });
      body = stored.body;
      contentLength = stored.headers.get('content-length');
    }
    await supabaseRequest('ebook_download_logs', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ lead_id: leadId, ebook_id: ebookId, source_page: 'email-gated-download', event: 'downloaded' }),
    }, true).catch(() => undefined);
    return new Response(body, {
      headers: {
        'Content-Type': filename.endsWith('.pdf') ? 'application/pdf' : 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Download is temporarily unavailable.' }, { status: 503 });
  }
}
