import { NextResponse } from "next/server";
import { isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import sourceQuestionBank from "@/data/healthclues-quiz-bank.json";
import reviewerQuestionBank from "@/data/healthclues-quiz-admin.json";
import { serviceRest } from "@/features/healthclues/server";
import type { QuizBankQuestion } from "@/features/healthclues/quiz-bank";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const questionSchema = z.object({
  id: z.string().min(1).max(80), group: z.string().min(1).max(40), stage: z.enum(["onboarding", "deep"]),
  type: z.enum(["single", "country", "multi", "text_or_none"]), text: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(160)).min(1).max(20), note_vi: z.string().max(1200).optional(),
}).strict();
const saveSchema = z.object({
  action: z.enum(["save_draft", "publish"]), expectedActiveVersion: z.number().int().min(0),
  reason: z.string().trim().min(3).max(1200), confirmReviewed: z.boolean().optional(),
  questions: z.array(questionSchema).min(1).max(100).optional(),
}).strict();
const reviewerNotes = new Map((reviewerQuestionBank as QuizBankQuestion[]).filter(question => question.note_vi).map(question => [question.id, question.note_vi]));
const initialReviewerBank = (sourceQuestionBank as QuizBankQuestion[]).map(question => ({
  ...question,
  ...(reviewerNotes.has(question.id) ? { note_vi: reviewerNotes.get(question.id) } : {}),
}));

function validateStableQuestionShape(questions: QuizBankQuestion[]) {
  const baseline = initialReviewerBank;
  if (questions.length !== baseline.length) return false;
  const byId = new Map(baseline.map(question => [question.id, question]));
  return questions.every(question => {
    const original = byId.get(question.id);
    return original && original.group === question.group && original.stage === question.stage && original.type === question.type;
  }) && new Set(questions.map(question => question.id)).size === baseline.length;
}

export async function GET(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer preview is not configured." }, { status: 503 });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [published, draft, audit] = await Promise.all([
      serviceRest<Array<{ version: number; questions: QuizBankQuestion[] }>>("healthclues_quiz_bank_versions?status=eq.published&select=version,questions&limit=1"),
      serviceRest<Array<{ version: number; questions: QuizBankQuestion[] }>>("healthclues_quiz_bank_versions?status=eq.draft&select=version,questions&limit=1"),
      serviceRest<Array<{ id: number; version: number; action: string; reason: string; actor_identity: string; occurred_at: string }>>("healthclues_quiz_bank_audit?select=id,version,action,reason,actor_identity,occurred_at&order=id.desc&limit=50"),
    ]);
    return NextResponse.json({
      questions: published[0]?.questions ?? initialReviewerBank,
      activeVersion: published[0]?.version ?? 0,
      draft: draft[0] ?? null,
      audit,
      persistenceAvailable: true,
    }, { headers: { "Cache-Control": "no-store, private" } });
  } catch {
    return NextResponse.json({ questions: initialReviewerBank, activeVersion: 0, draft: null, audit: [], persistenceAvailable: false }, { headers: { "Cache-Control": "no-store, private" } });
  }
}

export async function POST(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer preview is not configured." }, { status: 503 });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid quiz bank change.", issues: parsed.error.issues.map(issue => ({ path: issue.path, code: issue.code })) }, { status: 400 });
  const body = parsed.data;
  if (body.action === "save_draft" && (!body.questions || !validateStableQuestionShape(body.questions))) {
    return NextResponse.json({ error: "Quiz question IDs, branches and answer types are fixed in V1; edit wording, options and reviewer notes only." }, { status: 422 });
  }
  if (body.action === "publish" && body.confirmReviewed !== true) return NextResponse.json({ error: "Explicit reviewer confirmation is required to publish a quiz version." }, { status: 422 });
  try {
    const result = await serviceRest<Record<string, unknown>>("rpc/healthclues_save_quiz_bank_v1", {
      method: "POST",
      body: JSON.stringify({ p_questions: body.action === "save_draft" ? body.questions : null, p_action: body.action, p_reason: body.reason, p_expected_active_version: body.expectedActiveVersion }),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz bank could not be saved.";
    const conflict = message.includes("40001");
    return NextResponse.json({ error: conflict ? "The active quiz version changed. Reload the bank and retry." : "Quiz bank could not be saved." }, { status: conflict ? 409 : 400, headers: { "Cache-Control": "no-store" } });
  }
}
