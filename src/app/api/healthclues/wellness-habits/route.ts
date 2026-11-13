import { NextResponse } from "next/server";
import { isHealthCluesOwnerDemo } from "@/features/healthclues/server";
import { WELLNESS_HABIT_LIBRARY, WELLNESS_HABIT_LIBRARY_VERSION } from "@/features/healthclues/wellness-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0, private" };
  if (!isHealthCluesOwnerDemo()) return NextResponse.json({ version: WELLNESS_HABIT_LIBRARY_VERSION, availability: "editorial-review-required", items: [] }, { headers });
  return NextResponse.json({ version: WELLNESS_HABIT_LIBRARY_VERSION, availability: "test-only", items: WELLNESS_HABIT_LIBRARY }, { headers });
}
