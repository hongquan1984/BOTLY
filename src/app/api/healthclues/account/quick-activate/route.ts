import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quick-activate bypass has been permanently removed per product security requirements.
 * All demo and production authentications must proceed through verified email magic link via Auth/Mailpit.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Instant activation bypass is permanently disabled. Verify your email via Auth/Mailpit to proceed." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Instant activation bypass is permanently disabled. Verify your email via Auth/Mailpit to proceed." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}

