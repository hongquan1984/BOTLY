"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import type { UsageStatus } from "./toolkit-domain";
import { localizedPlanGoalCopy, type WellnessPlanGoal } from "./wellness-plan";
import {
  parseGoalStatusesFromNote,
  calculateStars,
  computeInitialStatuses,
  parseReasonsAndPersonalNote,
} from "./daily-care-domain";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

type Entry = { id: string; catalog_item_id: string | null; slot_key: string };
type Tool = { id: string; name: string };

type Props = {
  open: boolean;
  date: string;
  journeyPrompt?: string;
  entries: Entry[];
  tools: Tool[];
  goals?: WellnessPlanGoal[];
  note: string;
  statuses: Record<string, UsageStatus>;
  counts: Record<string, number>;
  busy: boolean;
  loaded: boolean;
  onClose: () => void;
  onNote: (value: string) => void;
  onStatus: (entryId: string, value: UsageStatus) => void;
  onCount: (entryId: string, value: number | null) => void;
  onSave: (compiledNote?: string) => void;
  onRecommendationFeedback?: (catalogItemId: string, feedback: "too_difficult" | "no_time" | "want_alternative") => void;
};

export function getDisplayGoalTitle(goal: WellnessPlanGoal, locale: "en" | "vi" = "vi"): string {
  const copy = localizedPlanGoalCopy(goal, locale);
  let chosen = "";
  // 1. If user typed a custom note/target (e.g. "Đi dạo 20 phút", "5 phút")
  if (goal.originalNote && goal.originalNote.trim()) {
    chosen = goal.originalNote.trim();
  }
  // 2. The exact specific action description the user ticked (contains specific minutes, e.g. "20 phút", "5-10 phút", "8 cốc")
  else if (copy.trackingDefinition && copy.trackingDefinition.trim() && !copy.trackingDefinition.startsWith("Personal note saved") && !copy.trackingDefinition.startsWith("Saved for later") && !copy.trackingDefinition.startsWith("Unconfigured personal goal") && !copy.trackingDefinition.startsWith("Skipped during")) {
    chosen = copy.trackingDefinition.trim();
  }
  // 3. If targetValue and targetUnit exist
  else if (goal.targetValue !== null && goal.targetValue !== undefined && goal.targetUnit) {
    chosen = `${copy.optionTitle || copy.title} ${goal.targetValue} ${goal.targetUnit}`.trim();
  }
  // 4. Fallback to option title if different from main title
  else if (copy.optionTitle && copy.optionTitle !== copy.title) {
    chosen = copy.optionTitle.trim();
  }
  // 5. Fallback to main category title
  else {
    chosen = copy.title.trim();
  }
  return chosen.trim().replace(/\.+$/, "");
}

export {
  calculateStars,
  computeInitialStatuses,
  parseReasonsAndPersonalNote,
  parseGoalStatusesFromNote,
} from "./daily-care-domain";

export function DailyCheckinDialog(props: Props) {
  return props.open ? <OpenDailyCheckin key={props.date} {...props} /> : null;
}

function OpenDailyCheckin({
  date,
  entries,
  tools,
  goals = [],
  note,
  statuses,
  busy,
  loaded,
  onClose,
  onNote,
  onStatus,
  onSave,
}: Props) {
  const { locale, text } = useHealthCluesLocale();

  // Normalize items to check in: prefer active confirmed plan goals, fallback to equipped tools
  const items = useMemo(() => {
    if (goals && goals.length > 0) {
      return goals.map(goal => ({
        id: goal.goalId,
        title: getDisplayGoalTitle(goal, locale),
        subtitle: goal.trackingDefinition || (goal.frequency ? text(goal.frequency) : ""),
        isGoal: true as const,
        rawGoal: goal,
      }));
    }
    return entries.map(entry => {
      const tool = tools.find(t => t.id === entry.catalog_item_id);
      return {
        id: entry.id,
        title: tool?.name || text("Personal tool"),
        subtitle: text(entry.slot_key.replaceAll("_", " ")),
        isGoal: false as const,
        rawEntry: entry,
      };
    });
  }, [goals, entries, tools, locale, text]);

  // Track items explicitly modified by the user so late network responses do not overwrite active edits
  const userDirtiedStatusesRef = useRef<Set<string>>(new Set());
  const userDirtiedReasonsRef = useRef<Set<string>>(new Set());
  const userDirtiedNoteRef = useRef<boolean>(false);

  const [localStatuses, setLocalStatuses] = useState<Record<string, UsageStatus>>(() => {
    return computeInitialStatuses(items, entries, note, statuses) as Record<string, UsageStatus>;
  });

  const parsedNote = useMemo(() => parseReasonsAndPersonalNote(note, items), [note, items]);
  const [reasons, setReasons] = useState<Record<string, string>>(() => parsedNote.reasonsMap);
  const [personalNote, setPersonalNote] = useState<string>(() => parsedNote.personalNote);

  // When loaded transitions to true or saved props update, hydrate fields the user hasn't explicitly dirtied
  useEffect(() => {
    const incomingStatuses = computeInitialStatuses(items, entries, note, statuses) as Record<string, UsageStatus>;
    const { reasonsMap, personalNote: incomingNote } = parseReasonsAndPersonalNote(note, items);

    setLocalStatuses(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [id, val] of Object.entries(incomingStatuses)) {
        if (!userDirtiedStatusesRef.current.has(id)) {
          if (next[id] !== val) {
            next[id] = val;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });

    setReasons(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [id, val] of Object.entries(reasonsMap)) {
        if (!userDirtiedReasonsRef.current.has(id)) {
          if (next[id] !== val) {
            next[id] = val;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });

    if (!userDirtiedNoteRef.current) {
      setPersonalNote(incomingNote);
    }
  }, [loaded, note, statuses, items, entries]);

  const handleToggleStatus = (itemId: string, requestedStatus: "done" | "not_yet") => {
    userDirtiedStatusesRef.current.add(itemId);
    const current = localStatuses[itemId];
    const nextStatus: UsageStatus = current === requestedStatus ? "not_yet" : requestedStatus;

    setLocalStatuses(prev => ({
      ...prev,
      [itemId]: nextStatus,
    }));

    const item = items.find(it => it.id === itemId);
    if (!item) return;

    if (!item.isGoal) {
      // Direct toolkit entry item
      onStatus(item.id, nextStatus);
    } else if (item.rawGoal?.templateId) {
      // Only sync to toolkit entry if the plan goal directly matches an equipped tool
      const matchingEntry = entries.find(e => e.catalog_item_id === item.rawGoal.templateId);
      if (matchingEntry) {
        onStatus(matchingEntry.id, nextStatus);
      }
    }
  };

  const totalItems = items.length;
  const doneCount = items.filter(it => localStatuses[it.id] === "done").length;
  const liveStars = calculateStars(doneCount, totalItems);

  const handleSave = () => {
    const lines: string[] = [];
    lines.push(locale === "vi" ? `[Đánh giá ngày: ${liveStars}/5 sao]` : `[Daily rating: ${liveStars}/5 stars]`);

    // Record explicit goal statuses so they persist across reloads
    const goalStatusEntries = items.map(it => `${it.id}=${localStatuses[it.id] || "not_yet"}`);
    if (goalStatusEntries.length > 0) {
      lines.push(locale === "vi" ? `[Trạng thái mục tiêu: ${goalStatusEntries.join(",")}]` : `[Goal status: ${goalStatusEntries.join(",")}]`);
    }

    const uncompletedWithReason = items
      .filter(it => localStatuses[it.id] === "not_yet" && reasons[it.id]?.trim())
      .map(it => `- ${it.title}: ${reasons[it.id].trim()}`);

    if (uncompletedWithReason.length > 0) {
      lines.push(locale === "vi" ? "Lý do chưa hoàn thành:" : "Reason not completed:");
      lines.push(...uncompletedWithReason);
    }

    if (personalNote.trim()) {
      lines.push(personalNote.trim());
    }

    const compiledNote = lines.join("\n");
    onNote(compiledNote);
    onSave(compiledNote);
  };

  return (
    <div className="hc-game-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="hc-checkin-title" className="hc-game-modal hc-checkin-dialog">
        <header className="hc-game-modal-header">
          <div>
            <p>{text("PRIVATE JOURNAL")} · {date}</p>
            <h2 id="hc-checkin-title">{text("Today's Check-in")}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={text("Close check-in")}><X size={19}/></button>
        </header>

        <div className="hc-game-modal-body">
          {/* Minimal Clean Status Bar */}
          <div className="hc-checkin-summary-bar" role="status" aria-live="polite">
            <div className="flex items-center justify-between w-full">
              <span className="hc-checkin-count-pill">
                <strong>{doneCount}</strong> / {totalItems} {text("goals completed")}
              </span>
              {doneCount === totalItems && totalItems > 0 ? (
                <span className="text-xs font-medium text-emerald-400">🎉 {locale === "vi" ? "Đã hoàn thành tất cả" : text("Completed all goals")}</span>
              ) : (
                <span className="text-xs text-[#a6b8ad]">{locale === "vi" ? `Còn ${totalItems - doneCount} mục tiêu` : `${totalItems - doneCount} ${text("Not completed").toLowerCase()}`}</span>
              )}
            </div>
          </div>

          {!loaded ? (
            <p role="status" className="hc-checkin-empty">{text("Opening your private check-in…")}</p>
          ) : items.length ? (
            <div className="hc-checkin-goals-list">
              {items.map(item => {
                const status = localStatuses[item.id];
                const isDone = status === "done";
                const isNotYet = status === "not_yet";
                const cleanTitle = item.title.trim().replace(/\.+$/, "").toLowerCase();
                const cleanSub = (item.subtitle || "").trim().replace(/\.+$/, "").toLowerCase();
                const isDuplicateOrRedundant =
                  !cleanSub ||
                  cleanSub === cleanTitle ||
                  cleanTitle.includes(cleanSub) ||
                  cleanSub.includes(cleanTitle);
                const showSubtitle = !isDuplicateOrRedundant;

                return (
                  <article
                    key={item.id}
                    className={`hc-checkin-goal-card ${isDone ? "is-done" : isNotYet ? "is-not-yet" : ""}`}
                  >
                    <div className="hc-checkin-card-main">
                      <div className="hc-checkin-goal-info">
                        <h4 className="hc-checkin-goal-title">{item.title}</h4>
                        {showSubtitle && <p className="hc-checkin-goal-sub">{item.subtitle}</p>}
                      </div>
                      <div className="hc-checkin-binary-group" role="group" aria-label={item.title}>
                        <button
                          type="button"
                          className={`hc-checkin-btn is-done ${isDone ? "is-active" : ""}`}
                          aria-pressed={isDone}
                          onClick={() => handleToggleStatus(item.id, "done")}
                        >
                          <Check size={14} />
                          <span>{text("Completed")}</span>
                        </button>
                        <button
                          type="button"
                          className={`hc-checkin-btn is-not-yet ${isNotYet ? "is-active" : ""}`}
                          aria-pressed={isNotYet}
                          onClick={() => handleToggleStatus(item.id, "not_yet")}
                        >
                          <X size={14} />
                          <span>{text("Not completed")}</span>
                        </button>
                      </div>
                    </div>

                    {isNotYet && (
                      <div className="hc-checkin-reason-input-wrap">
                        <label htmlFor={`reason-${item.id}`} className="hc-reason-label">
                          + {text("Reason not completed:")}
                        </label>
                        <input
                          id={`reason-${item.id}`}
                          type="text"
                          className="hc-reason-input"
                          value={reasons[item.id] || ""}
                          onChange={e => {
                            userDirtiedReasonsRef.current.add(item.id);
                            setReasons(prev => ({ ...prev, [item.id]: e.target.value }));
                          }}
                          placeholder={text("Enter reason (e.g. busy, tired, forgot...)")}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="hc-checkin-empty">
              {text("Your Toolkit is open. You can still make a private reflection today.")}
            </p>
          )}

          <label className="hc-checkin-note">
            <span>{text("Extra private note for today...")}</span>
            <textarea
              rows={2}
              maxLength={2000}
              value={personalNote}
              onChange={event => {
                userDirtiedNoteRef.current = true;
                setPersonalNote(event.target.value);
              }}
              placeholder={text("A small note for yourself…")}
            />
          </label>

          <p className="hc-checkin-privacy">
            {text("Private by default. Never appears in community sharing or reminder emails. A missed check-in does not imply anything about your care.")}
          </p>

          <div className="hc-checkin-buttons">
            <button type="button" onClick={onClose}>{text("Cancel")}</button>
            <button type="button" data-save-checkin disabled={busy || !loaded} onClick={handleSave}>
              {busy ? text("Saving…") : !loaded ? (locale === "vi" ? "Đang tải…" : "Loading…") : text("Save check-in")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
