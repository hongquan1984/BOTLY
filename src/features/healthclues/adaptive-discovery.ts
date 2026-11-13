import { z } from "zod";

export const adaptiveAnswerSchema = z.object({
  questionId: z.string().regex(/^q-[a-z0-9-]{2,48}$/),
  prompt: z.string().trim().min(8).max(180),
  answerIds: z.array(z.string().regex(/^a-[a-z0-9-]{1,48}$/)).min(1).max(5),
  answerLabels: z.array(z.string().trim().min(1).max(100)).min(1).max(5),
  optionalText: z.string().trim().max(180).optional(),
}).strict().superRefine((answer, context) => {
  if (answer.answerIds.length !== answer.answerLabels.length) context.addIssue({ code: "custom", message: "answer_label_mismatch" });
  if (new Set(answer.answerIds).size !== answer.answerIds.length) context.addIssue({ code: "custom", message: "duplicate_answer_id" });
});

export const adaptiveDiscoveryRequestSchema = z.object({
  requestId: z.string().uuid(),
  locale: z.enum(["en", "vi"]),
  focusId: z.enum(["sleep", "weight-fitness", "health-concern", "beauty-skin", "healthy-aging", "stress", "other"]),
  focusLabel: z.string().trim().min(1).max(100),
  concernDetail: z.string().trim().max(100).default(""),
  answeredQuestions: z.array(adaptiveAnswerSchema).max(8),
}).strict();

const adaptiveChoiceSchema = z.object({ id: z.string().regex(/^a-[a-z0-9-]{1,48}$/), label: z.string().trim().min(1).max(90) }).strict();
export const adaptiveQuestionSchema = z.object({
  questionId: z.string().regex(/^q-[a-z0-9-]{2,48}$/),
  prompt: z.string().trim().min(8).max(180),
  choices: z.array(adaptiveChoiceSchema).min(3).max(5),
  allowMultiple: z.boolean(),
  allowSkip: z.boolean(),
}).strict().superRefine((question, context) => {
  if (new Set(question.choices.map(choice => choice.id)).size !== question.choices.length) context.addIssue({ code: "custom", message: "duplicate_choice_id" });
});

export const adaptiveDiscoveryResponseSchema = z.object({
  locale: z.enum(["en", "vi"]),
  done: z.boolean(),
  question: adaptiveQuestionSchema.nullable(),
}).strict().superRefine((result, context) => {
  if (result.done !== (result.question === null)) context.addIssue({ code: "custom", message: "question_done_mismatch" });
});

export type AdaptiveDiscoveryRequest = z.infer<typeof adaptiveDiscoveryRequestSchema>;
export type AdaptiveDiscoveryResponse = z.infer<typeof adaptiveDiscoveryResponseSchema>;
export type AdaptiveQuestion = z.infer<typeof adaptiveQuestionSchema>;

export function validateAdaptiveDiscoveryResponse(value: unknown, request: AdaptiveDiscoveryRequest): AdaptiveDiscoveryResponse {
  const result = adaptiveDiscoveryResponseSchema.parse(value);
  if (result.locale !== request.locale) throw new Error("INVALID_SCHEMA");
  if (result.question && request.answeredQuestions.some(answer => answer.questionId === result.question?.questionId)) throw new Error("INVALID_SCHEMA");
  if (result.done && request.answeredQuestions.length < 2) throw new Error("INVALID_SCHEMA");
  if (!result.done && request.answeredQuestions.length >= 8) throw new Error("INVALID_SCHEMA");
  return result;
}
