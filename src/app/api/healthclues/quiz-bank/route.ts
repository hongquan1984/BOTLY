import { NextResponse } from "next/server";
import { getActiveQuizBank, publicQuizQuestions } from "@/features/healthclues/quiz-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bank = await getActiveQuizBank();
  return NextResponse.json({ version: bank.version, questions: publicQuizQuestions(bank.questions) }, {
    headers: { "Cache-Control": "no-store, public, max-age=0" },
  });
}
