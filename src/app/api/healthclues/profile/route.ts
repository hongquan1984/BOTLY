import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const worldId = new URL(request.url).searchParams.get("worldId");
  if (!validUuid(worldId)) return NextResponse.json({ error: "A valid World is required." }, { status: 400, headers });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers });
    const rows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
    const preferredLocale = rows[0]?.profile.preferredLocale === "vi" || rows[0]?.profile.preferredLocale === "en" ? rows[0].profile.preferredLocale : null;
    return NextResponse.json({ nickname: typeof rows[0]?.profile.nickname === "string" ? rows[0].profile.nickname : null, preferredLocale, ownerId: auth.id }, { headers });
  } catch { return NextResponse.json({ error: "Your private profile could not be loaded." }, { status: 503, headers }); }
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  if (!auth.emailConfirmed) return NextResponse.json({ error: "Verify your email before editing your private profile." }, { status: 403, headers });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid profile update." }, { status: 400, headers }); }
  const hasNickname = typeof body.nickname === "string";
  const hasLocale = body.preferredLocale === "en" || body.preferredLocale === "vi";
  if (!validUuid(body.worldId) || (!hasNickname && !hasLocale)) return NextResponse.json({ error: "A World and a supported profile preference are required." }, { status: 400, headers });
  const nickname = hasNickname ? (body.nickname as string).normalize("NFC").trim().replace(/\s+/g, " ") : undefined;
  if (nickname !== undefined && (nickname.length > 32 || (nickname.length > 0 && !/^[\p{L}\p{M}\p{N} _.'’-]+$/u.test(nickname)))) return NextResponse.json({ error: "Use up to 32 letters, numbers, spaces, apostrophes or hyphens." }, { status: 400, headers });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers });
    const rows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
    if (!rows.length) return NextResponse.json({ error: "Complete the Discovery Quiz before editing your profile." }, { status: 409, headers });
    const profile = { ...rows[0].profile, ...(nickname !== undefined ? { nickname: nickname || null } : {}), ...(hasLocale ? { preferredLocale: body.preferredLocale } : {}) };
    await serviceRest(`healthclues_profiles?user_id=eq.${auth.id}`, { method: "PATCH", body: JSON.stringify({ profile, updated_at: new Date().toISOString() }) });
    return NextResponse.json({ saved: true, nickname: profile.nickname ?? null, preferredLocale: profile.preferredLocale ?? null }, { headers });
  } catch { return NextResponse.json({ error: "Your private nickname could not be saved." }, { status: 503, headers }); }
}
