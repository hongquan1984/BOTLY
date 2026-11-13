export function getTodayLocalDate(tz?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function computeConsecutiveStreak(checkins: Array<{ local_date: string }>, tz?: string): number {
  if (!checkins || checkins.length === 0) return 0;
  const dates = new Set(checkins.map(c => c.local_date));
  const todayStr = getTodayLocalDate(tz);
  const [ty, tm, td] = todayStr.split("-").map(Number);

  let streak = 0;
  let checkDate = new Date(Date.UTC(ty, tm - 1, td));

  if (dates.has(todayStr)) {
    streak = 1;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  } else {
    const yesterday = new Date(Date.UTC(ty, tm - 1, td));
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (!dates.has(yStr)) {
      return 0;
    }
    streak = 1;
    checkDate = yesterday;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  while (streak < 7) {
    const dStr = checkDate.toISOString().slice(0, 10);
    if (dates.has(dStr)) {
      streak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function parseGoalStatusesFromNote(note?: string | null): Record<string, "done" | "not_yet"> {
  if (!note) return {};
  const match = note.match(/\[Trạng thái mục tiêu:\s*([^\]]+)\]/i);
  if (!match || !match[1]) return {};

  const result: Record<string, "done" | "not_yet"> = {};
  const entries = match[1].split(",");
  for (const entry of entries) {
    const [id, status] = entry.split("=").map(s => s.trim());
    if (id && (status === "done" || status === "not_yet")) {
      result[id] = status;
    }
  }
  return result;
}

export function calculateStars(done: number, total: number): number {
  if (total <= 0) return 0;
  if (done === total) return 5;
  if (done <= 0) return 0;
  return Math.min(4, Math.max(1, Math.round((done / total) * 5)));
}

export type GoalUsageStatus = "done" | "not_yet" | "unsure";

export function computeInitialStatuses(
  items: Array<{ id: string; isGoal?: boolean; rawGoal?: { templateId?: string | null }; rawEntry?: { catalog_item_id?: string | null } }>,
  entries: Array<{ id: string; catalog_item_id: string | null }>,
  note?: string | null,
  statuses?: Record<string, string>
): Record<string, GoalUsageStatus> {
  const initial: Record<string, GoalUsageStatus> = {};
  const parsedFromNote = parseGoalStatusesFromNote(note);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (parsedFromNote[it.id]) {
      initial[it.id] = parsedFromNote[it.id] as GoalUsageStatus;
    } else if (statuses && statuses[it.id]) {
      initial[it.id] = statuses[it.id] as GoalUsageStatus;
    } else if (it.isGoal && it.rawGoal?.templateId) {
      const matchingEntry = entries.find(e => e.catalog_item_id === it.rawGoal?.templateId);
      if (matchingEntry && statuses && statuses[matchingEntry.id]) {
        initial[it.id] = statuses[matchingEntry.id] as GoalUsageStatus;
      }
    }
  }
  return initial;
}

export function parseReasonsAndPersonalNote(
  note: string | null | undefined,
  items: Array<{ id: string; title: string }>
): { reasonsMap: Record<string, string>; personalNote: string } {
  const reasonsMap: Record<string, string> = {};
  let remainingNote = note || "";
  if (remainingNote) {
    remainingNote = remainingNote
      .replace(/\[Đánh giá ngày:\s*\d(?:\.\d)?\/5\s*sao\]/gi, "")
      .replace(/\[Trạng thái mục tiêu:\s*[^\]]+\]/gi, "")
      .trim();

    const reasonHeader = "Lý do chưa hoàn thành:";
    const reasonIdx = remainingNote.indexOf(reasonHeader);
    if (reasonIdx !== -1) {
      const after = remainingNote.slice(reasonIdx + reasonHeader.length);
      const lines = after.split("\n");
      const remainingLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          const content = trimmed.replace(/^[-•]\s*/, "");
          const colonIdx = content.indexOf(":");
          if (colonIdx !== -1) {
            const habitName = content.slice(0, colonIdx).trim().toLowerCase();
            const reasonText = content.slice(colonIdx + 1).trim();
            const matchedItem = items.find(it => it.title.toLowerCase().includes(habitName) || habitName.includes(it.title.toLowerCase()));
            if (matchedItem) {
              reasonsMap[matchedItem.id] = reasonText;
            }
          }
        } else if (trimmed) {
          remainingLines.push(trimmed);
        }
      }
      remainingNote = remainingLines.join("\n");
    }
  }
  return { reasonsMap, personalNote: remainingNote };
}
