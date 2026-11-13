import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

interface PresenceRecord {
  user_id: string;
  region: string;
  nickname: string;
  avatar_key: string;
  x: number;
  y: number;
  facing: "left" | "right";
  walking: boolean;
  status_action: string | null;
  speech: string | null;
  updated_at: string;
}

// In-memory fallback cache
const memoryPresence = new Map<string, {
  userId: string;
  region: string;
  nickname: string;
  avatarKey: string;
  x: number;
  y: number;
  facing: "left" | "right";
  walking: boolean;
  action: string | null;
  speech: string | null;
  updatedAt: number;
}>();

const ALLOWED_AVATARS = new Set([
  "chibi-anna",
  "chibi-leo",
  "chibi-mia",
  "chibi-ben",
  "chibi-lily",
  "chibi-adventurer"
]);

function sanitizeAvatar(key: unknown, fallback: string): string {
  if (typeof key === "string" && ALLOWED_AVATARS.has(key)) return key;
  return fallback;
}

function sanitizeText(val: unknown, maxLen: number, fallback = ""): string {
  if (typeof val !== "string") return fallback;
  return val.trim().slice(0, maxLen);
}

function sanitizeCoord(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const region = url.searchParams.get("region") || "healthclues-realm";
  const excludeUser = url.searchParams.get("excludeUser") || "";

  const cutoffDate = new Date(Date.now() - 15000).toISOString();
  let players: Array<{
    id: string;
    nickname: string;
    avatarKey: string;
    x: number;
    y: number;
    facing: "left" | "right";
    walking: boolean;
    action: string | null;
    speech: string | null;
    updatedAt: string;
  }> = [];

  try {
    const filter = `region=eq.${encodeURIComponent(region)}&updated_at=gt.${encodeURIComponent(cutoffDate)}${excludeUser ? `&user_id=neq.${encodeURIComponent(excludeUser)}` : ""}&select=user_id,nickname,avatar_key,x,y,facing,walking,status_action,speech,updated_at&order=updated_at.desc&limit=30`;
    const rows = await serviceRest<PresenceRecord[]>(`healthclues_online_presence?${filter}`);
    if (Array.isArray(rows)) {
      players = rows.map(r => ({
        id: r.user_id,
        nickname: r.nickname,
        avatarKey: r.avatar_key,
        x: Number(r.x),
        y: Number(r.y),
        facing: (r.facing === "left" ? "left" : "right") as "left" | "right",
        walking: Boolean(r.walking),
        action: r.status_action,
        speech: r.speech,
        updatedAt: r.updated_at
      }));
    }
  } catch (err) {
    // Memory fallback
    const now = Date.now();
    players = Array.from(memoryPresence.values())
      .filter(p => p.region === region && p.userId !== excludeUser && now - p.updatedAt < 15000)
      .map(p => ({
        id: p.userId,
        nickname: p.nickname,
        avatarKey: p.avatarKey,
        x: p.x,
        y: p.y,
        facing: p.facing,
        walking: p.walking,
        action: p.action,
        speech: p.speech,
        updatedAt: new Date(p.updatedAt).toISOString()
      }));
  }

  return NextResponse.json({
    ok: true,
    region,
    onlineCount: players.length + (excludeUser ? 1 : 0),
    players
  }, { headers: noStore });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: noStore });
  }

  // Resolve user identity: authenticated user or provided guest id
  let userId = "";
  const auth = await requireUser(request);
  if (!isApiError(auth)) {
    userId = auth.id;
  } else if (typeof body.userId === "string" && body.userId.startsWith("guest-")) {
    userId = body.userId.slice(0, 80);
  } else {
    // If neither auth nor guest ID, generate or reject
    userId = typeof body.userId === "string" && body.userId.length >= 6
      ? body.userId.slice(0, 80)
      : `guest-${Math.random().toString(36).slice(2, 10)}`;
  }

  const region = sanitizeText(body.region, 60, "healthclues-realm");
  const nickname = sanitizeText(body.nickname, 30, "Lữ khách");
  const avatarKey = sanitizeAvatar(body.avatarKey, "chibi-leo");
  const x = sanitizeCoord(body.x, 20, 1900, 740);
  const y = sanitizeCoord(body.y, 20, 1000, 450);
  const facing = body.facing === "left" ? "left" : "right";
  const walking = Boolean(body.walking);
  const action = body.action ? sanitizeText(body.action, 30) : null;
  const speech = body.speech ? sanitizeText(body.speech, 120) : null;

  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  // 1. Update in-memory fallback
  memoryPresence.set(userId, {
    userId,
    region,
    nickname,
    avatarKey,
    x,
    y,
    facing,
    walking,
    action,
    speech,
    updatedAt: nowMs
  });

  // Clean memory
  for (const [key, val] of memoryPresence.entries()) {
    if (nowMs - val.updatedAt > 20000) memoryPresence.delete(key);
  }

  // 2. Upsert to Supabase
  let players: Array<{
    id: string;
    nickname: string;
    avatarKey: string;
    x: number;
    y: number;
    facing: "left" | "right";
    walking: boolean;
    action: string | null;
    speech: string | null;
    updatedAt: string;
  }> = [];

  try {
    const payload = [{
      user_id: userId,
      region,
      nickname,
      avatar_key: avatarKey,
      x,
      y,
      facing,
      walking,
      status_action: action,
      speech,
      updated_at: nowIso
    }];

    await serviceRest<unknown>("healthclues_online_presence", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(payload)
    });

    const cutoffDate = new Date(nowMs - 15000).toISOString();
    const filter = `region=eq.${encodeURIComponent(region)}&updated_at=gt.${encodeURIComponent(cutoffDate)}&user_id=neq.${encodeURIComponent(userId)}&select=user_id,nickname,avatar_key,x,y,facing,walking,status_action,speech,updated_at&order=updated_at.desc&limit=30`;
    const rows = await serviceRest<PresenceRecord[]>(`healthclues_online_presence?${filter}`);
    if (Array.isArray(rows)) {
      players = rows.map(r => ({
        id: r.user_id,
        nickname: r.nickname,
        avatarKey: r.avatar_key,
        x: Number(r.x),
        y: Number(r.y),
        facing: (r.facing === "left" ? "left" : "right") as "left" | "right",
        walking: Boolean(r.walking),
        action: r.status_action,
        speech: r.speech,
        updatedAt: r.updated_at
      }));
    }
  } catch (err) {
    // If DB has error, return from memory
    players = Array.from(memoryPresence.values())
      .filter(p => p.region === region && p.userId !== userId && nowMs - p.updatedAt < 15000)
      .map(p => ({
        id: p.userId,
        nickname: p.nickname,
        avatarKey: p.avatarKey,
        x: p.x,
        y: p.y,
        facing: p.facing,
        walking: p.walking,
        action: p.action,
        speech: p.speech,
        updatedAt: new Date(p.updatedAt).toISOString()
      }));
  }

  return NextResponse.json({
    ok: true,
    userId,
    region,
    onlineCount: players.length + 1,
    players
  }, { headers: noStore });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: noStore });
  }

  memoryPresence.delete(userId);

  try {
    await serviceRest<unknown>(`healthclues_online_presence?user_id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE"
    });
  } catch { /* Ignore on delete */ }

  return NextResponse.json({ ok: true }, { headers: noStore });
}
