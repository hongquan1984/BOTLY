"use client";

import { useState } from "react";

type Reward = { id: string; version: number; reward_type: string; title: string; eligibility: Record<string, unknown>; active: boolean; updated_at: string };
const milestoneLabel = (reward: Reward) => reward.id.startsWith("boss-keepsake-")
  ? `Boss keepsake · ${String(reward.eligibility.boss_topic ?? "Boss")}`
  : `${String(reward.eligibility.elapsed_days ?? "?")} ngày đồng hành`;

export default function HealthCluesRewardConfigPage() {
  const [token, setToken] = useState(""); const [reason, setReason] = useState(""); const [rewards, setRewards] = useState<Reward[] | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState("");
  async function load(event?: React.FormEvent) {
    event?.preventDefault(); setMessage("Đang tải cấu hình…");
    try { const response = await fetch("/api/admin/healthclues-rewards", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const data = await response.json() as { rewards?: Reward[]; error?: string }; if (!response.ok) throw new Error(data.error || "Không tải được cấu hình."); setRewards(data.rewards ?? []); setMessage("Đã tải cấu hình phần thưởng."); }
    catch (error) { setRewards(null); setMessage(error instanceof Error ? error.message : "Không tải được cấu hình."); }
  }
  async function save(reward: Reward, title: string, active: boolean) {
    if (!reason.trim()) { setMessage("Nhập lý do để ghi audit."); return; }
    setBusy(reward.id); try { const response = await fetch("/api/admin/healthclues-rewards", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: reward.id, expectedVersion: reward.version, title, active, reason }) }); const data = await response.json() as { reward?: Reward; error?: string }; if (!response.ok) throw new Error(data.error || "Không lưu được cấu hình."); setRewards(current => current?.map(item => item.id === reward.id ? { ...item, ...data.reward } : item) ?? null); setMessage(`Đã lưu ${reward.id} v${data.reward?.version}; bản ghi audit đã được tạo.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được cấu hình."); }
    finally { setBusy(""); }
  }
  return <main className="mx-auto min-h-screen max-w-4xl bg-[#f7f4e9] px-4 py-10 text-[#203b34] sm:px-8">
    <header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">HealthClues · quản trị</p><h1 className="mt-2 text-3xl font-black">Cấu hình phần thưởng</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#647469]">Reviewer chỉ đổi nhãn hiển thị hoặc bật/tắt milestone và Boss keepsake. Công thức XP, điều kiện nhận thưởng và quyền ghi reward của client không thay đổi. Tắt reward sẽ ngăn cấp phần thưởng mới; lịch sử đã cấp được giữ nguyên.</p><nav className="mt-3 flex flex-wrap gap-4 text-sm"><a href="/admin/healthclues-home" className="font-bold text-emerald-900 underline">Quản trị căn nhà & nội thất</a><a href="/admin/healthclues-content" className="font-bold text-emerald-900 underline">Hàng đợi nội dung</a><a href="/admin/healthclues-diagnostics" className="font-bold text-emerald-900 underline">Chẩn đoán vận hành</a></nav></header>
    <form onSubmit={load} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#d7cfb7] bg-white p-4"><label className="min-w-64 flex-1 text-xs font-bold">Mã reviewer<input type="password" required value={token} onChange={event => setToken(event.target.value)} autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] px-3"/></label><button className="min-h-11 self-end rounded-xl bg-[#183d36] px-5 text-sm font-bold text-white">Tải cấu hình</button></form>
    <label className="mt-4 block text-xs font-bold">Lý do thay đổi / audit<input value={reason} onChange={event => setReason(event.target.value)} maxLength={1200} className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] bg-white px-3" placeholder="Bắt buộc khi lưu"/></label><p role="status" className="mt-3 text-sm">{message}</p>
    {rewards && <section aria-label="Reward configuration" className="mt-5 space-y-3">{rewards.map(reward => <RewardRow key={reward.id} reward={reward} disabled={Boolean(busy)} onSave={save}/>)}</section>}
  </main>;
}

function RewardRow({ reward, disabled, onSave }: { reward: Reward; disabled: boolean; onSave: (reward: Reward, title: string, active: boolean) => Promise<void> }) {
  const [title, setTitle] = useState(reward.title); const [active, setActive] = useState(reward.active);
  return <article className="grid gap-3 rounded-2xl border border-[#d7cfb7] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{milestoneLabel(reward)} · {reward.reward_type} · v{reward.version}</p><label className="mt-2 block text-xs font-bold">Tên hiển thị<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} className="mt-1 min-h-10 w-full rounded-lg border px-3"/></label><label className="mt-3 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} className="h-4 w-4 accent-emerald-900"/>Cho phép cấp reward mới tại mốc này</label></div><button disabled={disabled || title.trim().length < 1} onClick={() => void onSave(reward, title, active)} className="min-h-10 rounded-lg bg-[#183d36] px-4 text-sm font-bold text-white disabled:opacity-50">Lưu cấu hình</button></article>;
}
