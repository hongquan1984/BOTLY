import { randomUUID } from "node:crypto";
import { aiWellnessPlanSchema, inferWellnessCategory, validateGeneratedWellnessPlan, type AiWellnessGoal } from "./personalized-wellness-plan.ts";
import type { HealthCluesProfile } from "../../lib/healthclues-quiz";

export type GeminiPlanFailureCategory =
  | "REQUEST_SCHEMA_INVALID"
  | "BILLING_REQUIRED"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_NETWORK_ERROR"
  | "PROVIDER_HTTP_ERROR"
  | "PROVIDER_EMPTY_RESPONSE"
  | "RESPONSE_JSON_PARSE_FAILED"
  | "RESPONSE_SCHEMA_MISMATCH"
  | "RESPONSE_SEMANTIC_INVALID"
  | "RESPONSE_SAFETY_REJECTED";

export type SanitizedSchemaIssue = {
  path: string[];
  code: string;
  expectedType?: string;
  receivedType?: string;
};

export class GeminiPlanPipelineError extends Error {
  readonly category: GeminiPlanFailureCategory;
  readonly stage: string;
  readonly upstreamHttpStatus?: number;
  readonly parserErrorType?: string;
  readonly schemaIssues?: SanitizedSchemaIssue[];
  readonly responseBytes?: number;
  readonly semanticRejectedCount?: number;
  readonly safetyRejectedCount?: number;
  readonly structuredOutputStatus: "not_sent" | "rejected" | "empty" | "invalid";

  constructor(input: {
    category: GeminiPlanFailureCategory;
    stage: string;
    upstreamHttpStatus?: number;
    parserErrorType?: string;
    schemaIssues?: SanitizedSchemaIssue[];
    responseBytes?: number;
    semanticRejectedCount?: number;
    safetyRejectedCount?: number;
    structuredOutputStatus: GeminiPlanPipelineError["structuredOutputStatus"];
  }) {
    super(input.category);
    this.name = "GeminiPlanPipelineError";
    this.category = input.category;
    this.stage = input.stage;
    this.upstreamHttpStatus = input.upstreamHttpStatus;
    this.parserErrorType = input.parserErrorType;
    this.schemaIssues = input.schemaIssues;
    this.responseBytes = input.responseBytes;
    this.semanticRejectedCount = input.semanticRejectedCount;
    this.safetyRejectedCount = input.safetyRejectedCount;
    this.structuredOutputStatus = input.structuredOutputStatus;
  }
}

const allowedTypes = new Set(["STRING", "NUMBER", "INTEGER", "BOOLEAN", "OBJECT", "ARRAY"]);

/** Local structural guard for the generateContent responseSchema, before any provider request. */
export function validateGeminiRequestSchema(value: unknown): SanitizedSchemaIssue[] {
  const issues: SanitizedSchemaIssue[] = [];
  const visit = (schema: unknown, path: string[]) => {
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      issues.push({ path, code: "schema_not_object", receivedType: Array.isArray(schema) ? "array" : typeof schema });
      return;
    }
    const node = schema as Record<string, unknown>;
    if (typeof node.type !== "string" || !allowedTypes.has(node.type)) issues.push({ path: [...path, "type"], code: "unsupported_type", expectedType: [...allowedTypes].join("|"), receivedType: typeof node.type === "string" ? node.type : typeof node.type });
    if (node.nullable !== undefined && typeof node.nullable !== "boolean") issues.push({ path: [...path, "nullable"], code: "invalid_nullable", expectedType: "boolean", receivedType: typeof node.nullable });
    if (node.type === "OBJECT") {
      if (!node.properties || typeof node.properties !== "object" || Array.isArray(node.properties)) issues.push({ path: [...path, "properties"], code: "object_properties_required", expectedType: "object", receivedType: typeof node.properties });
      else {
        const properties = node.properties as Record<string, unknown>;
        if (Array.isArray(node.required)) for (const required of node.required) if (typeof required !== "string" || !(required in properties)) issues.push({ path: [...path, "required"], code: "required_property_missing", expectedType: "listed property name", receivedType: typeof required });
        for (const [name, child] of Object.entries(properties)) visit(child, [...path, "properties", name]);
      }
    }
    if (node.type === "ARRAY") {
      if (node.items === undefined) issues.push({ path: [...path, "items"], code: "array_items_required", expectedType: "schema", receivedType: "missing" });
      else visit(node.items, [...path, "items"]);
    }
  };
  visit(value, []);
  return issues;
}

function sanitizedZodIssues(error: unknown): SanitizedSchemaIssue[] {
  const issues = error && typeof error === "object" && "issues" in error && Array.isArray(error.issues) ? error.issues : [];
  return issues.slice(0, 16).map((raw: unknown) => {
    const issue = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return {
      path: Array.isArray(issue.path) ? issue.path.map(segment => String(segment).slice(0, 80)) : [],
      code: typeof issue.code === "string" ? issue.code : "validation_error",
      ...(typeof issue.expected === "string" ? { expectedType: issue.expected } : {}),
      ...(typeof issue.received === "string" ? { receivedType: issue.received } : {}),
    };
  });
}

export function classifyGeminiProviderError(error: unknown): GeminiPlanPipelineError {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const cause = value.cause && typeof value.cause === "object" ? value.cause as Record<string, unknown> : {};
  const response = value.response && typeof value.response === "object" ? value.response as Record<string, unknown> : {};
  const statusCandidate = [value.status, value.statusCode, cause.status, cause.statusCode, response.status].find(item => typeof item === "number");
  const status = typeof statusCandidate === "number" ? statusCandidate : undefined;
  const category: GeminiPlanFailureCategory = status === 402 ? "BILLING_REQUIRED"
    : status === 429 ? "RATE_LIMITED"
      : status === 503 ? "PROVIDER_UNAVAILABLE"
        : status === undefined ? "PROVIDER_NETWORK_ERROR" : "PROVIDER_HTTP_ERROR";
  return new GeminiPlanPipelineError({
    category, stage: "PROVIDER_REQUEST_STARTED", upstreamHttpStatus: status,
    structuredOutputStatus: "rejected",
  });
}

export type GeminiPipelineStage = "PROVIDER_REQUEST_STARTED" | "PROVIDER_RESPONSE_RECEIVED" | "JSON_EXTRACTION_STARTED" | "JSON_PARSED" | "SCHEMA_VALIDATED" | "SAFETY_VALIDATED";
export type GeminiStageObserver = (stage: GeminiPipelineStage, details?: { providerStatus?: number }) => void;

export async function runGeminiPlanPipeline<T extends { text?: string | null }>(input: {
  request: () => Promise<T>;
  profile: HealthCluesProfile;
  onStage?: GeminiStageObserver;
}) {
  input.onStage?.("PROVIDER_REQUEST_STARTED");
  let response: T;
  try { response = await input.request(); }
  catch (error) { throw classifyGeminiProviderError(error); }
  input.onStage?.("PROVIDER_RESPONSE_RECEIVED", { providerStatus: 200 });
  return { response, parsed: parseGeminiWellnessPlanResponse(response.text, input.profile, input.onStage) };
}

export function parseGeminiWellnessPlanResponse(raw: unknown, profile: HealthCluesProfile, onStage?: GeminiStageObserver) {
  onStage?.("JSON_EXTRACTION_STARTED");
  if (typeof raw !== "string" || !raw.trim()) throw new GeminiPlanPipelineError({ category: "PROVIDER_EMPTY_RESPONSE", stage: "JSON_EXTRACTION_STARTED", responseBytes: typeof raw === "string" ? Buffer.byteLength(raw, "utf8") : 0, structuredOutputStatus: "empty" });
  const responseBytes = Buffer.byteLength(raw, "utf8");
  if (responseBytes > 24_000) throw new GeminiPlanPipelineError({ category: "RESPONSE_SCHEMA_MISMATCH", stage: "JSON_EXTRACTION_STARTED", responseBytes, structuredOutputStatus: "invalid" });
  let json: unknown;
  try { json = JSON.parse(raw); }
  catch (error) { throw new GeminiPlanPipelineError({ category: "RESPONSE_JSON_PARSE_FAILED", stage: "JSON_EXTRACTION_STARTED", parserErrorType: error instanceof Error ? error.name : "UnknownParseError", responseBytes, structuredOutputStatus: "invalid" }); }
  onStage?.("JSON_PARSED");
  const parsed = aiWellnessPlanSchema.safeParse(json);
  if (!parsed.success) throw new GeminiPlanPipelineError({ category: "RESPONSE_SCHEMA_MISMATCH", stage: "SCHEMA_VALIDATED", schemaIssues: sanitizedZodIssues(parsed.error), responseBytes, structuredOutputStatus: "invalid" });
  onStage?.("SCHEMA_VALIDATED");

  const validation = validateGeneratedWellnessPlan(parsed.data, profile);
  if (parsed.data.goals.length && !validation.goals.length) {
    const safetyRejected = validation.safetyRejectedCount > 0;
    throw new GeminiPlanPipelineError({ category: safetyRejected ? "RESPONSE_SAFETY_REJECTED" : "RESPONSE_SEMANTIC_INVALID", stage: "SAFETY_VALIDATED", responseBytes, semanticRejectedCount: validation.semanticRejectedCount, safetyRejectedCount: validation.safetyRejectedCount, structuredOutputStatus: "invalid" });
  }
  onStage?.("SAFETY_VALIDATED");
  return {
    ...validation,
    goals: validation.goals.map(goal => ({
      ...goal,
      goalId: `ai:${randomUUID()}`,
      category: goal.category || inferWellnessCategory(profile),
      iconKey: goal.iconKey,
    })),
    responseBytes,
    structuredOutputStatus: "accepted" as const,
  };
}

export type ParsedGeminiPlan = ReturnType<typeof parseGeminiWellnessPlanResponse>;
export type ParsedGeminiGoal = AiWellnessGoal;
