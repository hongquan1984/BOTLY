import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';

function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
function bearer(request: Request) { const value = request.headers.get('authorization') || ''; return value.startsWith('Bearer ') ? value.slice(7).trim() : ''; }
function profileQuery(hash: string) { return `access_token_hash=eq.${encodeURIComponent(hash)}&select=id,profile,created_at,updated_at,expires_at&limit=1`; }
function fail(error: string, status: number) { return NextResponse.json({ ok: false, error }, { status }); }

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { profile?: unknown } | null;
    if (!body?.profile || typeof body.profile !== 'object') return fail('INVALID_PROFILE', 400);
    const token = randomBytes(32).toString('base64url');
    const id = randomUUID();
    const response = await supabaseRequest('night_companion_profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id, access_token_hash: tokenHash(token), profile: body.profile }) }, true);
    if (!response.ok) return fail('PROFILE_STORAGE_FAILED', 502);
    return NextResponse.json({ ok: true, profile_id: id, access_token: token });
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') return fail('PROFILE_STORAGE_NOT_CONFIGURED', 503);
    return fail('PROFILE_CREATE_FAILED', 500);
  }
}

export async function GET(request: Request) {
  const token = bearer(request);
  if (!token) return fail('MISSING_ACCESS_TOKEN', 401);
  try {
    const response = await supabaseRequest(`night_companion_profiles?${profileQuery(tokenHash(token))}`, {}, true);
    if (!response.ok) return fail('PROFILE_READ_FAILED', 502);
    const rows = await response.json() as Array<{ id: string; profile: unknown; created_at: string; updated_at: string; expires_at: string }>;
    const row = rows[0];
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) return fail('PROFILE_NOT_FOUND', 404);
    return NextResponse.json({ ok: true, profile_id: row.id, profile: row.profile, created_at: row.created_at, updated_at: row.updated_at });
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') return fail('PROFILE_STORAGE_NOT_CONFIGURED', 503);
    return fail('PROFILE_READ_FAILED', 500);
  }
}

export async function PATCH(request: Request) {
  const token = bearer(request);
  if (!token) return fail('MISSING_ACCESS_TOKEN', 401);
  try {
    const body = await request.json().catch(() => null) as { profile?: unknown } | null;
    if (!body?.profile || typeof body.profile !== 'object') return fail('INVALID_PROFILE', 400);
    const response = await supabaseRequest(`night_companion_profiles?${profileQuery(tokenHash(token)).replace('&select=id,profile,created_at,updated_at,expires_at&limit=1', '')}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ profile: body.profile, updated_at: new Date().toISOString() }) }, true);
    if (!response.ok) return fail('PROFILE_UPDATE_FAILED', 502);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') return fail('PROFILE_STORAGE_NOT_CONFIGURED', 503);
    return fail('PROFILE_UPDATE_FAILED', 500);
  }
}
