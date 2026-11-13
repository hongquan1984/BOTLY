"use client";

import { useState } from "react";

type Diagnostics = { checkedAt: string; queues: { catalogPending: number; cluesPending: number; bossesPending: number; communityOpen: number; remindersPending: number } };

const labels: Array<[keyof Diagnostics["queues"], string, string]> = [
  ["catalogPending", "Catalog cần rà soát", "catalog review"],
  ["cluesPending", "Health Clues cần rà soát", "knowledge clue review"],
  ["bossesPending", "Boss cần rà soát", "boss review"],
  ["communityOpen", "Báo cáo cộng đồng đang mở", "open moderation reports"],
  ["remindersPending", "Email nhắc đang chờ hoặc lỗi", "queued or failed mock reminders"],
];

export default function HealthCluesDiagnosticsPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Diagnostics | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setMessage("Đang kiểm tra hàng đợi và trạng thái vận hành…");
    try {
      const response = await fetch("/api/admin/healthclues-diagnostics", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await response.json() as Diagnostics & { error?: string };
      if (!response.ok) throw new Error(body.error || "Không lấy được chỉ số vận hành.");
      setData(body);
      setMessage("Đã cập nhật chỉ số. Các số liệu chỉ thể hiện lượng hàng đợi, không chứa dữ liệu cá nhân.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lấy được chỉ số vận hành.");
      setData(null);
    } finally { setBusy(false); }
  }

  return <main className="mx-auto min-h-screen max-w-5xl bg-[#f7f4e9] px-4 py-10 text-[#203b34] sm:px-8">
    <header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">HealthClues · quản trị</p><h1 className="mt-2 text-3xl font-black">Chẩn đoán vận hành</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#647469]">Chỉ số tổng hợp về hàng đợi nội dung, báo cáo cộng đồng và email nhắc. Trang không hiển thị tài khoản, nhật ký riêng tư, câu trả lời quiz hay thông tin sức khỏe cá nhân.</p></header>
    <form onSubmit={load} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#d7cfb7] bg-white p-4"><label className="min-w-64 flex-1 text-xs font-bold">Mã reviewer hoặc moderator<input type="password" value={token} onChange={event => setToken(event.target.value)} autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] px-3"/></label><button disabled={busy} className="min-h-11 self-end rounded-xl bg-[#183d36] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Đang kiểm tra…" : "Kiểm tra trạng thái"}</button></form>
    <p role="status" className="mt-3 text-sm">{message}</p>
    {data && <section aria-label="Operational queue counts" className="mt-5"><p className="text-xs text-[#647469]">Lần kiểm tra gần nhất: {new Date(data.checkedAt).toLocaleString()}</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{labels.map(([key, label, description]) => <article key={key} className="rounded-2xl border border-[#d7cfb7] bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-900">{label}</p><p className="mt-2 text-3xl font-black tabular-nums">{data.queues[key]}</p><p className="mt-1 text-xs text-[#647469]">{description}</p></article>)}</div></section>}
  </main>;
}
