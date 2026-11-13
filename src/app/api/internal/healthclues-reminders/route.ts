import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MailpitReminder = { delivery_id: string; recipient_email: string; nickname: string };

function tokenMatches(value: string | null, expected: string) {
  if (!value) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const expected = process.env.HEALTHCLUES_REMINDER_JOB_TOKEN || (process.env.HEALTHCLUES_OWNER_DEMO === "1" ? "local-reminder-secret-token-3329" : "");
  const provider = process.env.HEALTHCLUES_EMAIL_PROVIDER || (process.env.HEALTHCLUES_OWNER_DEMO === "1" ? "mailpit" : "mock");
  const mailpitOnly = (provider === "mailpit" || provider === "mailpit-local") && process.env.HEALTHCLUES_OWNER_DEMO === "1";
  if ((provider !== "mock" && !mailpitOnly) || !expected || !tokenMatches(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, expected)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  let body: { runAt?: unknown; limit?: unknown; simulateTransientFailure?: unknown };
  try { body = await request.json(); } catch { body = {}; }
  const runAt = body.runAt === undefined ? new Date().toISOString() : body.runAt;
  const limit = body.limit === undefined ? 50 : body.limit;
  if (typeof runAt !== "string" || !Number.isFinite(Date.parse(runAt)) || typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Invalid reminder worker request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (body.simulateTransientFailure === true && process.env.HEALTHCLUES_MOCK_FAILURE_TESTS !== "true") return NextResponse.json({ error: "Mock failure simulation is disabled." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (mailpitOnly && body.simulateTransientFailure === true) return NextResponse.json({ error: "Failure simulation is available only for the mock provider." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const normalizedRunAt = new Date(runAt).toISOString();
    const requeued = await serviceRest<number>("rpc/healthclues_requeue_failed_reminders_v1", { method: "POST", body: JSON.stringify({ p_run_at: normalizedRunAt, p_limit: limit }) });
    const queued = await serviceRest<number>("rpc/healthclues_queue_daily_reminders_v1", { method: "POST", body: JSON.stringify({ p_run_at: normalizedRunAt }) });
    if (body.simulateTransientFailure === true) {
      const failed = await serviceRest<number>("rpc/healthclues_mock_fail_due_reminders_v1", { method: "POST", body: JSON.stringify({ p_run_at: normalizedRunAt, p_limit: limit }) });
      return NextResponse.json({ queued, requeued, failed, claimed: 0, sent: 0, provider: "mock" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (mailpitOnly) {
      const claimed = await serviceRest<MailpitReminder[]>("rpc/healthclues_claim_mailpit_reminders_v1", { method: "POST", body: JSON.stringify({ p_run_at: normalizedRunAt, p_limit: limit }) });
      let sent = 0;
      let failed = 0;
      for (const reminder of claimed) {
        const name = reminder.nickname || "bạn";
        const playUrl = `http://127.0.0.1:${process.env.HEALTHCLUES_OWNER_DEMO_PORT || "3000"}/vi/wellness/healthclues/world?quest=health-concern&checkin=1`;
        const text = `Chào ${name} thân mến,\n\nMột ngày mới tràn ngập năng lượng lại bắt đầu rồi! ☀️\n\nLumi ghé qua để nhắc bạn khởi động các thói quen sống khỏe hôm nay. Nếu hôm qua bạn bận chưa kịp ghi nhận điểm danh (check-in), hãy dành 1 phút ghé thăm Cõi Sống Khỏe để lưu lại tiến trình và nhận thêm điểm EXP nhé!\n\nVào Cõi Sống Khỏe cùng Lumi: ${playUrl}\n\nChúc bạn một ngày tràn đầy hứng khởi và an lành!\nThương mến, Lumi 🦊✨`;
        const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0c2319; color: #f5f8f6; border-radius: 16px; border: 1px solid #234e3a;">
          <h2 style="color: #ffd868; font-size: 20px; margin-top: 0;">Chào ${escapeHtml(name)} thân mến, ngày mới tốt lành nhé! ☀️</h2>
          <p style="color: #d1e2d9; line-height: 1.6; font-size: 15px;">Một ngày mới tràn ngập năng lượng lại bắt đầu rồi. Lumi ghé qua để cùng bạn khởi động các mục tiêu sống khỏe hôm nay nè!</p>
          <p style="color: #d1e2d9; line-height: 1.6; font-size: 15px;">📋 <strong>Nhắc nhở nhẹ từ Lumi:</strong> Nếu hôm qua bạn bận rộn và chưa kịp điểm danh (check-in), hãy dành 1 phút ghé vào Cõi Sống Khỏe để ghi nhận tiến trình và nhận thêm điểm EXP nhé 🌿✨</p>
          <div style="text-align: center; margin: 26px 0;">
            <a href="${playUrl}" style="background: #2a6f4e; color: #fff8db; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block;">Khởi động thói quen &amp; Điểm danh ngay ☀️</a>
          </div>
          <p style="color: #a4c2b2; font-size: 14px; margin-bottom: 4px;">Chúc bạn có một ngày mới thật nhiều niềm vui và sức khỏe dồi dào! 🌟</p>
          <p style="color: #749683; font-size: 13px; margin-top: 0;"><em>Thương mến,</em><br><strong style="color: #ffd868;">Lumi 🦊✨</strong><br>Bạn đồng hành của bạn tại HealthClues</p>
        </div>`;
        let messageId: string | null = null;
        let errorCode: "mailpit_unavailable" | "mailpit_rejected" | "mailpit_timeout" = "mailpit_unavailable";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const response = await fetch("http://127.0.0.1:54324/api/v1/send", {
            method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ From: { Email: "demo@healthclues.local", Name: "HealthClues" }, To: [{ Email: reminder.recipient_email }], Subject: `HealthClues: Chào buổi sáng ${name} ☀️ Nhắc nhở thói quen & điểm danh`, Text: text, HTML: html, Headers: { "Message-ID": `<healthclues-${reminder.delivery_id}@localhost>` } }),
          });
          clearTimeout(timeout);
          if (!response.ok) errorCode = "mailpit_rejected";
          else {
            const result = await response.json() as { ID?: unknown };
            messageId = typeof result.ID === "string" ? result.ID : null;
            if (!messageId) errorCode = "mailpit_rejected";
          }
        } catch (error) { if (error instanceof Error && error.name === "AbortError") errorCode = "mailpit_timeout"; }
        const updated = await serviceRest<boolean>("rpc/healthclues_finish_mailpit_reminder_v1", {
          method: "POST", body: JSON.stringify({ p_delivery_id: reminder.delivery_id, p_sent: Boolean(messageId), p_message_id: messageId, p_error_code: messageId ? null : errorCode, p_run_at: normalizedRunAt }),
        });
        if (!updated) throw new Error("mailpit_reminder_state_conflict");
        if (messageId) sent += 1; else failed += 1;
      }
      return NextResponse.json({ queued, requeued, claimed: claimed.length, sent, failed, provider: "mailpit-local" }, { headers: { "Cache-Control": "no-store" } });
    }
    const dispatched = await serviceRest<{ claimed: number; sent: number; provider: "mock" }>("rpc/healthclues_dispatch_mock_reminders_v1", { method: "POST", body: JSON.stringify({ p_run_at: normalizedRunAt, p_limit: limit }) });
    return NextResponse.json({ queued, requeued, ...dispatched }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("HealthClues mock reminder worker failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Reminder worker is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}
