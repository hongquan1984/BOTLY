"use client";

import { useEffect, useState } from "react";
import type { CloudSession } from "@/lib/wellness-cloud";

type DeletionRequest = { status: "requested"; requested_at: string; recovery_until: string; purge_after: string };

export function HealthCluesDataControls({ session, locale }: { session: CloudSession; locale: "en" | "vi" }) {
  const vi = locale === "vi";
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const response = await fetch("/api/healthclues/account", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
        const body = await response.json() as { deletionRequest?: DeletionRequest | null; error?: string };
        if (!response.ok) throw new Error(body.error || "Could not load deletion status.");
        if (current) setRequest(body.deletionRequest ?? null);
      } catch (cause) {
        if (current) setError(cause instanceof Error ? cause.message : "Could not load deletion status.");
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [session.access_token]);

  async function requestDeletion() {
    const confirmed = window.confirm(vi
      ? "HealthClues khóa quyền truy cập ngay, thu hồi chia sẻ và hủy email nhắc. Bạn có 30 ngày để khôi phục; dữ liệu chính được lên lịch xóa muộn nhất vào ngày 60. Đăng nhập Botly vẫn hoạt động. Tiếp tục?"
      : "HealthClues will lock access immediately, revoke sharing, and cancel reminder emails. You can recover for 30 days; primary data is scheduled for purge by day 60. Your Botly sign-in remains. Continue?");
    if (!confirmed) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/account", { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await response.json() as { deletionRequest?: DeletionRequest; error?: string };
      if (!response.ok) throw new Error(body.error || "Deletion request could not be created.");
      setRequest(body.deletionRequest ?? null);
      setMessage(vi ? "Đã ghi nhận yêu cầu xóa. Quyền truy cập bị khóa, chia sẻ đã thu hồi và email nhắc đã dừng." : "Deletion is scheduled. Access is locked, sharing is revoked, and reminder emails are stopped.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Deletion request could not be created."); }
    finally { setBusy(false); }
  }

  async function cancelDeletion() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/account", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Deletion request could not be canceled.");
      setRequest(null);
      setMessage(vi ? "Đã hủy yêu cầu. Chia sẻ và email nhắc vẫn tắt; bạn có thể bật lại riêng." : "Request canceled. Sharing and reminder emails remain off; you can re-enable them separately.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Deletion request could not be canceled."); }
    finally { setBusy(false); }
  }

  const date = (value: string) => new Date(value).toLocaleDateString(vi ? "vi-VN" : "en-US", { dateStyle: "medium" });
  return <section className="account-sync mt-5" aria-labelledby="healthclues-data-controls-title">
    <h2 id="healthclues-data-controls-title">{vi ? "Dữ liệu và quyền riêng tư HealthClues" : "HealthClues data and privacy"}</h2>
    <p>{vi ? "Yêu cầu xóa sẽ khóa HealthClues ngay, thu hồi chia sẻ công khai và hủy email đang chờ. Có 30 ngày để khôi phục; dữ liệu chính được lên lịch xóa muộn nhất vào ngày 60. Tài khoản Botly vẫn hoạt động." : "A deletion request immediately locks HealthClues, revokes public sharing, and cancels queued reminders. You have 30 days to recover; primary data is scheduled for purge by day 60. Your Botly account remains active."}</p>
    {loading ? <p role="status" className="mt-3 text-sm">{vi ? "Đang kiểm tra trạng thái…" : "Checking request status…"}</p> : request ? <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-bold">{vi ? `Đang chờ xóa · Có thể khôi phục đến ${date(request.recovery_until)}` : `Deletion pending · Recovery available until ${date(request.recovery_until)}`}</p>
      <p className="mt-1 text-xs">{vi ? `Dự kiến xóa dữ liệu chính trước ${date(request.purge_after)}.` : `Primary data purge is scheduled by ${date(request.purge_after)}.`}</p>
      <button type="button" disabled={busy} onClick={() => void cancelDeletion()} className="wellness-button-secondary mt-3">{vi ? "Hủy yêu cầu xóa" : "Cancel deletion request"}</button>
    </div> : <button type="button" disabled={busy || loading} onClick={() => void requestDeletion()} className="wellness-button-secondary mt-4">{vi ? "Yêu cầu xóa dữ liệu HealthClues" : "Request HealthClues data deletion"}</button>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
  </section>;
}
