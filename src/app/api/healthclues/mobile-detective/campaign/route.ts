import { NextResponse } from 'next/server';
import { isApiError, requireUser } from '@/features/healthclues/server';
import { loadDetectiveCampaignFromDb, loadDetectiveProgressFromDb } from '@/lib/healthclues-detective-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const [campaign, progress] = await Promise.all([
      loadDetectiveCampaignFromDb(),
      loadDetectiveProgressFromDb(auth.id),
    ]);
    return NextResponse.json({ ...campaign, progress, totalSolved: progress.filter((item) => item.status === 'solved').length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Campaign mobile chưa sẵn sàng từ DB.' }, { status: 503 });
  }
}
