import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { leadId?: string; ebookId?: string; sourcePage?: string };
    if (!/^[0-9a-f-]{36}$/i.test(body.leadId || '') || !/^[a-z0-9-]{1,100}$/.test(body.ebookId || ''))
      return NextResponse.json({ ok: false }, { status: 400 });
    const lead = await supabaseRequest(`ebook_email_leads?id=eq.${body.leadId}&ebook_id=eq.${body.ebookId}&select=id&limit=1`, {}, true);
    if (!lead.ok || !(await lead.json() as unknown[]).length) return NextResponse.json({ ok: false }, { status: 404 });
    const saved = await supabaseRequest('ebook_download_logs', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ lead_id: body.leadId, ebook_id: body.ebookId, source_page: (body.sourcePage || '').slice(0, 300), event: 'downloaded' }),
    }, true);
    if (!saved.ok) return NextResponse.json({ ok: false }, { status: 503 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
