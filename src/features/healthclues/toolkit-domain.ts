/** Canonical Wellness Toolkit domain rules. Client supplied descriptions are never canonical identities. */
export type ToolkitSlot = "consume" | "reduce" | "practice";
export type CatalogKind = "food_ingredient" | "herbal_ingredient" | "recipe" | "nutrition_habit" | "reduce_habit" | "movement" | "breathing" | "mindfulness" | "lifestyle";
export type ReviewStatus = "draft" | "needs_review" | "reviewed" | "rejected" | "retired";
export type ToolkitStatus = "equipped" | "in_collection" | "paused" | "archived";
export type UsageStatus = "done" | "not_yet" | "skipped" | "not_suitable" | "unsure";

export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  kind: CatalogKind;
  slot: ToolkitSlot;
  reviewStatus: ReviewStatus;
  active: boolean;
  currentVersion: number;
  evidenceSummary: string | null;
  safetyNotes: string | null;
  recommendationEligible: boolean;
};

export type SelectedTool = { catalogItemId: string; methodId?: string; version: number; slot: ToolkitSlot };

const slotKinds: Record<ToolkitSlot, readonly CatalogKind[]> = {
  consume: ["food_ingredient", "herbal_ingredient", "recipe", "nutrition_habit"],
  reduce: ["reduce_habit"],
  practice: ["movement", "breathing", "mindfulness", "lifestyle"],
};

export function catalogItemEligible(item: CatalogItem, slot?: ToolkitSlot): boolean {
  return item.active && item.reviewStatus === "reviewed" && item.recommendationEligible && (!slot || (item.slot === slot && slotKinds[slot].includes(item.kind)));
}

export function validateStartingSelection(items: CatalogItem[], selected: SelectedTool[]): { ok: true } | { ok: false; reason: string } {
  if (selected.length > 3) return { ok: false, reason: "Choose up to one starting tool per slot." };
  const slots = new Set<ToolkitSlot>();
  const ids = new Set<string>();
  for (const selection of selected) {
    const item = items.find(candidate => candidate.id === selection.catalogItemId);
    if (!item || !catalogItemEligible(item, selection.slot)) return { ok: false, reason: "One selected tool is unavailable or not eligible for this slot." };
    if (slots.has(selection.slot)) return { ok: false, reason: "Each starting slot can contain at most one tool." };
    if (ids.has(item.id)) return { ok: false, reason: "A tool can only be selected once in the starting loadout." };
    if (selection.version !== item.currentVersion) return { ok: false, reason: "A tool changed while you were choosing. Review the latest version." };
    slots.add(selection.slot);
    ids.add(item.id);
  }
  return { ok: true };
}

/** A missing check-in is absence of a record, never a synthetic skipped/not-done record. */
export function localDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (key: string) => parts.find(part => part.type === key)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export type UsageInput = { status: UsageStatus; occurrenceCount?: number | null; occurrenceTimes?: string[]; note?: string | null };
export function validateUsageInput(input: UsageInput): { ok: true; normalized: UsageInput } | { ok: false; reason: string } {
  const count = input.occurrenceCount ?? null;
  if (count !== null && (!Number.isInteger(count) || count < 0 || count > 100)) return { ok: false, reason: "Occurrence count must be a self-reported integer between 0 and 100." };
  if (input.occurrenceTimes && input.occurrenceTimes.length > 100) return { ok: false, reason: "Too many occurrence records for one day." };
  if (input.note && input.note.length > 4000) return { ok: false, reason: "Notes must be 4,000 characters or fewer." };
  return { ok: true, normalized: { ...input, occurrenceCount: count, note: input.note?.trim() || null } };
}
