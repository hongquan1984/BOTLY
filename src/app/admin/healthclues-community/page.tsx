"use client";

import { useState } from "react";

type Row = { id: string; public_journey_id: string; reason_code: string; details: string | null; status: string; created_at: string; resolved_at: string | null; journey: { alias: string; title: string; status: string; projection: Record<string, unknown> } | null };

export default function HealthCluesCommunityModerationPage() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [reason, setReason] = useState("Đã rà soát báo cáo theo quy trình kiểm duyệt.");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function load(event?: React.FormEvent) {
    event?.preventDefault(); setMessage("Đang tải hàng đợi báo cáo…");
    try {
      const response = await fetch("/api/admin/healthclues-community", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json() as { reports?: Row[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Không tải được hàng đợi.");
      setRows(data.reports || []); setMessage(`Đã tải ${data.reports?.length ?? 0} báo cáo.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không tải được hàng đợi."); }
  }

  async function moderate(row: Row, action: "reviewing" | "resolve" | "dismiss" | "remove") {
    setBusy(row.id); setMessage("");
    try {
      const response = await fetch("/api/admin/healthclues-community", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reportId: row.id, action, reason }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không lưu được quyết định.");
      setMessage(action === "remove" ? "Đã gỡ hành trình công khai và ghi audit." : "Đã cập nhật trạng thái báo cáo và ghi audit.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được quyết định."); }
    finally { setBusy(""); }
  }

  return <main className="mx-auto min-h-screen max-w-5xl bg-[#f7f4e9] px-4 py-10 text-[#203b34] sm:px-8"><header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">HealthClues · quản trị</p><h1 className="mt-2 text-3xl font-black">Kiểm duyệt hành trình cộng đồng</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#647469]">Chỉ xem các trường được người dùng chọn công khai và báo cáo gửi tới moderator. Quyết định được ghi audit; gỡ bài sẽ ẩn bản công khai, không sửa hành trình riêng của chủ sở hữu.</p></header><p className="mt-3 text-sm"><a href="/admin/healthclues-diagnostics" className="font-bold text-emerald-900 underline">Chẩn đoán vận hành</a></p>
    <form onSubmit={load} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#d7cfb7] bg-white p-4"><label className="min-w-64 flex-1 text-xs font-bold">Mã moderator<input type="password" value={token} onChange={event => setToken(event.target.value)} autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] px-3"/></label><button className="min-h-11 self-end rounded-xl bg-[#183d36] px-5 text-sm font-bold text-white">Tải báo cáo</button></form>
    <label className="mt-4 block text-xs font-bold">Lý do quyết định (audit)<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} className="mt-1 min-h-20 w-full rounded-xl border border-[#d5dacd] bg-white p-3 text-sm"/></label>
    <p role="status" className="mt-3 text-sm">{message}</p>
    {rows && <div className="mt-5 space-y-4">{rows.map(row => <article key={row.id} className="rounded-2xl border border-[#d7cfb7] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{row.reason_code} · {row.status}</p><h2 className="mt-1 text-lg font-black">{row.journey?.title || "Public journey unavailable"}</h2><p className="text-xs text-[#647469]">Alias: {row.journey?.alias || "—"} · {new Date(row.created_at).toLocaleString()}</p></div><span className="rounded-full bg-[#f2f4ed] px-3 py-1 text-xs">Public state: {row.journey?.status || "removed"}</span></div>{row.details && <p className="mt-3 rounded-xl bg-[#f7f4e9] p-3 text-sm">Report details: {row.details}</p>}<details className="mt-3"><summary className="cursor-pointer text-xs font-bold">Xem projection công khai đang được báo cáo</summary><pre className="mt-2 overflow-auto rounded-xl bg-[#f7f4e9] p-3 text-xs">{JSON.stringify(row.journey?.projection ?? {}, null, 2)}</pre></details><div className="mt-4 flex flex-wrap gap-2">{([ ["reviewing", "Đang xem xét"], ["resolve", "Đã xử lý"], ["dismiss", "Bỏ qua báo cáo"], ["remove", "Gỡ hành trình công khai"] ] as const).map(([action, label]) => <button key={action} type="button" disabled={Boolean(busy) || row.status === "resolved" || row.status === "dismissed"} onClick={() => void moderate(row, action)} className={`min-h-10 rounded-lg border px-3 text-xs font-bold disabled:opacity-50 ${action === "remove" ? "border-rose-300 text-rose-900" : "border-[#bdcbb7]"}`}>{busy === row.id ? "Đang lưu…" : label}</button>)}</div></article>)}</div>}
    {rows?.length === 0 && <p className="mt-5 rounded-2xl border border-dashed border-[#c9d0bd] bg-white p-5 text-sm">Chưa có báo cáo cộng đồng nào.</p>}
  </main>;
}
