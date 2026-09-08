import { createHash, randomUUID } from 'node:crypto';
import { articlePath, articlePayloadSchema, PayloadTooLarge, readArticleBody } from '@/lib/article-publishing';
import { supabaseConfig, supabaseRequest } from '@/lib/supabase-server';
import { wellnessArticles } from '@/data/wellness-articles';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const requestId = randomUUID();
  const fail = (status: number, code: string, fields?: { path: string; message: string }[]) =>
    Response.json({ ok: false, error: { code, message: code, ...(fields ? { fields } : {}) }, request_id: requestId },
      { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) } });
  const token = /^Bearer (botly_[A-Za-z0-9_-]{43})$/i.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return fail(401, 'UNAUTHORIZED');
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    return fail(415, 'UNSUPPORTED_MEDIA_TYPE');
  let body: unknown;
  try { body = await readArticleBody(request); }
  catch (error) { return error instanceof PayloadTooLarge ? fail(413, 'PAYLOAD_TOO_LARGE') : fail(400, 'INVALID_JSON'); }
  const parsed = articlePayloadSchema.safeParse(body);
  if (!parsed.success) return fail(422, 'VALIDATION_ERROR', parsed.error.issues.map(issue => ({
    path: issue.path.join('.'), message: issue.message,
  })));
  // Existing static guides retain their URLs until an explicit content migration.
  if (parsed.data.translations.some(t => wellnessArticles.some(a => a.locale === t.locale && a.slug === t.slug)))
    return fail(409, 'SLUG_CONFLICT');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!supabaseConfig(true) || !siteUrl) return fail(503, 'NOT_CONFIGURED');
  try {
    const base = new URL(siteUrl);
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
      return fail(503, 'NOT_CONFIGURED');
    const response = await supabaseRequest('rpc/publish_wellness_article', {
      method: 'POST', body: JSON.stringify({ p_token_hash: createHash('sha256').update(token).digest('hex'), p_payload: parsed.data }),
    }, true);
    const result = await response.json();
    if (!response.ok) {
      const status: Record<string, number> = { UNAUTHORIZED: 401, CHANNEL_FORBIDDEN: 403,
        SLUG_CONFLICT: 409, SLUG_IMMUTABLE: 409, PUBLICATION_TIME_IMMUTABLE: 409,
        INVALID_PUBLICATION_STATUS: 422, RATE_LIMITED: 429 };
      if (status[result.message]) return fail(status[result.message], result.message);
      console.error('Article publishing database failure', { requestId, code: result.code, status: response.status });
      return fail(503, 'PUBLISHING_UNAVAILABLE');
    }
    return Response.json({ ...result, translations: result.translations.map((t: { locale: string; slug: string }) => {
      const path = articlePath(t.locale, t.slug);
      return { ...t, path, url: new URL(path, base).href };
    }) }, { status: result.action === 'created' ? 201 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('Article publishing connection failure', { requestId });
    return fail(503, 'PUBLISHING_UNAVAILABLE');
  }
}
