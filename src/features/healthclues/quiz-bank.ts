import "server-only";
import sourceQuestionBank from "@/data/healthclues-quiz-bank.json";
import { serviceRest } from "@/features/healthclues/server";

export type QuizBankQuestion = {
  id: string;
  group: string;
  stage: string;
  type: string;
  text: string;
  options: string[];
  note_vi?: string;
};

type BankRow = { version: number; questions: QuizBankQuestion[] };

export async function getActiveQuizBank(): Promise<{ version: number; questions: QuizBankQuestion[] }> {
  try {
    const rows = await serviceRest<BankRow[]>("healthclues_quiz_bank_versions?status=eq.published&select=version,questions&limit=1");
    if (rows[0]?.questions?.length) return { version: rows[0].version, questions: rows[0].questions };
  } catch {
    // Keep the reviewed, bundled baseline available before the additive quiz-bank migration is installed.
  }
  return { version: 0, questions: sourceQuestionBank as QuizBankQuestion[] };
}

export function publicQuizQuestions(questions: QuizBankQuestion[]) {
  return questions.map(question => {
    const publicQuestion = { ...question };
    delete publicQuestion.note_vi;
    return publicQuestion;
  });
}
