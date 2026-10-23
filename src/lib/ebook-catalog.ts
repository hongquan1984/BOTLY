import 'server-only';
import { supabaseConfig, supabaseRequest } from './supabase-server';
import { fallbackPublicEbooks, findFallbackEbook } from '@/data/ebook-library';

export type PublicEbook = {
  id: string;
  public_display_title: string;
  public_subtitle: string;
  slug: string;
  summary_short: string;
  summary_long: string;
  cover_image_url: string | null;
  category_id: string;
  tags: string[];
  downloadable_file_url: string | null;
  source_url?: string | null;
  source_title_original?: string | null;
  source_author?: string | null;
  source_site?: string | null;
  source_license_type?: string;
  document_delivery_note?: string;
  featured: boolean;
  status: 'published';
};

function publicCardRows(rows: PublicEbook[]): PublicEbook[] {
  return rows.map(({ source_url, source_title_original, source_author, source_site, source_license_type, document_delivery_note, ...publicFields }) => publicFields);
}

export async function listPublicEbooks(): Promise<PublicEbook[]> {
  if (!supabaseConfig()) return publicCardRows(fallbackPublicEbooks());
  try {
    const response = await supabaseRequest('public_ebook_catalog?select=id,public_display_title,public_subtitle,slug,summary_short,summary_long,cover_image_url,category_id,tags,downloadable_file_url,featured,status&order=featured.desc,slug');
    if (!response.ok) return publicCardRows(fallbackPublicEbooks());
    return publicCardRows(await response.json() as PublicEbook[]);
  } catch {
    return publicCardRows(fallbackPublicEbooks());
  }
}

export async function findPublicEbook(slug: string): Promise<PublicEbook | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (!supabaseConfig(true)) return findFallbackEbook(slug);
  try {
    const response = await supabaseRequest(`wellness_ebooks?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,public_display_title,public_subtitle,slug,summary_short,summary_long,cover_image_url,category_id,tags,downloadable_file_url,source_url,source_title_original,source_author,source_site,source_license_type,document_delivery_note,featured,status&limit=1`, {}, true);
    if (!response.ok) return findFallbackEbook(slug);
    const rows = await response.json() as PublicEbook[];
    return rows[0] || findFallbackEbook(slug);
  } catch { return findFallbackEbook(slug); }
}

export async function recordEbookPageView(ebookId: string, sourcePage: string) {
  if (!supabaseConfig(true)) return;
  try {
    await supabaseRequest('ebook_page_views', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ ebook_id: ebookId, source_page: sourcePage.slice(0, 300) }),
    }, true);
  } catch { /* Keep page rendering available if analytics storage is offline. */ }
}
