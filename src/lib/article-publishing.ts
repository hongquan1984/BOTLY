import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const httpsUrl = z.string().max(2048).url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'HTTPS URL without credentials required');
const mediaUrl = z.string().max(2048).refine(value => {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'HTTPS URL or site path required');
const timestamp = z.string().datetime({ offset: true });
export const trustMeterSchema = z.object({
  score: z.number().min(0).max(10),
  verdict: text(500),
  primary_benefit: text(500),
  risk_level: z.enum(['low', 'moderate', 'high']),
}).strict();

export const quickRecipeSchema = z.object({
  badge: z.string().max(100).optional(),
  servings: z.string().max(100).optional(),
  ingredients: z.array(z.object({
    item: text(200),
    amount: text(100),
    note: z.string().max(200).optional(),
  }).strict()).max(30).optional(),
  steps: z.array(text(1000)).max(20).optional(),
  best_time: text(500).optional(),
  donts: z.array(text(500)).max(10).optional(),
}).strict();

export const factCheckItemSchema = z.object({
  myth: text(1000),
  reality: text(2000),
}).strict();

export const faqItemSchema = z.object({
  question: text(500),
  answer: text(3000),
}).strict();

export const safetyQuizSchema = z.object({
  title: text(240).optional(),
  subtitle: text(500).optional(),
  questions: z.array(z.object({
    id: text(50),
    question: text(300),
    options: z.array(z.object({
      label: text(200),
      is_contraindicated: z.boolean().optional(),
      warning: z.string().max(500).optional(),
    })).min(2).max(5),
  })).min(1).max(5),
  safe_verdict: text(500).optional(),
  caution_verdict: text(500).optional(),
  contraindicated_verdict: text(500).optional(),
}).strict();

export const translationSchema = z.object({
  locale: z.enum(['en', 'vi']),
  slug: text(180).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: text(240), description: text(1000),
  sections: z.array(z.object({
    title: text(240), paragraphs: z.array(text(10000)).min(1).max(30),
    bullets: z.array(text(2000)).max(30).optional(),
    image_url: mediaUrl.optional(),
    image_alt: z.string().max(500).optional(),
  }).strict()).min(1).max(50),
  eyebrow: z.string().max(100).optional(), takeaway: z.string().max(2000).optional(),
  sources: z.array(z.object({ label: text(240), url: httpsUrl }).strict()).max(30).optional(),
  cover_image_alt: z.string().max(500).optional(),
  reading_minutes: z.number().int().min(1).max(120).nullable().optional(),
  evidence: z.enum(['supported', 'promising', 'limited']).nullable().optional(),
  reviewed_at: timestamp.nullable().optional(),
  tool: z.enum(['calorie-needs', 'stress-check', 'meditation-timer', 'food-combinations',
    'remedy-checker', 'wellness-planner']).nullable().optional(),
  seo_title: z.string().max(240).nullable().optional(),
  seo_description: z.string().max(1000).nullable().optional(),
  trust_meter: trustMeterSchema.nullable().optional(),
  quick_recipe: quickRecipeSchema.nullable().optional(),
  fact_checks: z.array(factCheckItemSchema).max(20).nullable().optional(),
  faqs: z.array(faqItemSchema).max(30).nullable().optional(),
  safety_quiz: safetyQuizSchema.nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  published_at: timestamp.optional(),
}).strict();
export const articlePayloadSchema = z.object({
  facebook_page_id: text(100).regex(/^[0-9]+$/),
  facebook_post_id: text(200),
  facebook_url: httpsUrl.refine(value => {
    const host = new URL(value).hostname;
    return host === 'facebook.com' || host.endsWith('.facebook.com');
  }, 'Facebook permalink required'),
  facebook_published_at: timestamp.nullable().optional(),
  cover_image_url: mediaUrl.nullable().optional(),
  translations: z.array(translationSchema).min(1).max(2)
    .refine(items => new Set(items.map(item => item.locale)).size === items.length, 'Duplicate locale'),
}).strict();

export const MAX_ARTICLE_BYTES = 512 * 1024;
export class PayloadTooLarge extends Error {}
export async function readArticleBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > MAX_ARTICLE_BYTES) throw new PayloadTooLarge();
  if (!request.body) throw new SyntaxError('Missing body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_ARTICLE_BYTES) { await reader.cancel(); throw new PayloadTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function articlePath(locale: string, slug: string) {
  return `${locale === 'vi' ? '/vi/song-khoe/huong-dan' : '/en/wellness/guides'}/${slug}`;
}
