import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const expected = process.env.EBOOK_ADMIN_TOKEN;
  if (!expected) return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  const supplied = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '')?.[1] || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await supabaseRequest('rpc/get_ebook_admin_summary', { method: 'POST', body: '{}' }, true);
    if (!response.ok) return NextResponse.json({ error: 'Không đọc được báo cáo. Kiểm tra migration và cấu hình Supabase.' }, { status: 503 });
    return NextResponse.json({ ok: true, data: await response.json() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Dịch vụ báo cáo tạm thời không khả dụng.' }, { status: 503 });
  }
}
