import { NextResponse } from 'next/server';
import { processInsomniaQuizAnalytics } from '@/lib/quiz-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: 'Database credentials not configured' }, { status: 503 });
    }

    // Concurrently fetch get_admin_analytics RPC and Insomnia Quiz detailed analytics
    const [rpcResponse, quizStats] = await Promise.all([
      fetch(`${url}/rest/v1/rpc/get_admin_analytics`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_days: days })
      }),
      processInsomniaQuizAnalytics(url, serviceKey)
    ]);

    if (!rpcResponse.ok) {
      const errorText = await rpcResponse.text();
      console.error('get_admin_analytics RPC error:', rpcResponse.status, errorText);
      return NextResponse.json({ ok: false, error: 'Analytics RPC failure' }, { status: 502 });
    }

    const data = await rpcResponse.json();

    // Attach insomnia quiz analytics
    if (quizStats) {
      data.insomnia_quiz = quizStats;
    }

    return NextResponse.json({ ok: true, data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Analytics API handler error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
