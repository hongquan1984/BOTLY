"use client";

import { useCallback, useState } from "react";

type Item = Record<string, unknown>;
type Queue = {
  catalog?: Array<Item & { id: string; current: Item | null }>;
  clues?: Array<Item & { clue_id: string }>;
  bosses?: Array<Item & { boss_id: string }>;
  methods?: Array<Item & { id: string; current: Item | null }>;
  recipeCombos?: Array<Item & { id: string }>;
  journeyCombos?: Array<Item & { id: string }>;
  error?: string;
};
type ContentType = "catalog" | "clue" | "boss" | "method" | "recipe_combo" | "journey_combo";
type Action = "approve" | "publish" | "recommend" | "reject" | "deactivate";

export default function HealthCluesContentReviewPage() {
  const [token, setToken] = useState(""); const [queue, setQueue] = useState<Queue | null>(null); const [confirmed, setConfirmed] = useState(false); const [reason, setReason] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState("");
  const load = useCallback(async () => { setMessage("Đang tải hàng đợi…"); try { const response = await fetch("/api/admin/healthclues-content", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const data = await response.json() as Queue; if (!response.ok) throw new Error(data.error || "Không tải được nội dung."); setQueue(data); setMessage("Hàng đợi đã cập nhật."); } catch (error) { setMessage(error instanceof Error ? error.message : "Không tải được nội dung."); } }, [token]);
  async function decide(type: ContentType, id: string, version: number, action: Action) {
    if (!reason.trim()) { setMessage("Nhập lý do để ghi audit trước khi lưu."); return; }
    setBusy(`${type}:${id}`); try { const response = await fetch("/api/admin/healthclues-content", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ contentType: type, id, version, action, reason, confirmReviewed: confirmed }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "Không lưu được quyết định."); setMessage("Đã lưu quyết định và audit. Chỉ reviewer xác nhận mới được kích hoạt nội dung."); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được quyết định."); } finally { setBusy(""); }
  }
  async function importReviewDrafts() {
    setBusy("import");
    try {
      const response = await fetch("/api/admin/healthclues-content", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_v1_review_drafts" }) });
      const data = await response.json() as { error?: string; result?: { inserted?: number; skipped_existing_drafts?: number } };
      if (!response.ok) throw new Error(data.error || "Không nạp được bản nháp.");
      setMessage(`Đã nạp ${data.result?.inserted ?? 0} bản nháp; bỏ qua ${data.result?.skipped_existing_drafts ?? 0} bản đã có. Tất cả vẫn chờ reviewer, chưa xuất bản.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không nạp được bản nháp."); }
    finally { setBusy(""); }
  }
  const renderItems = (type: ContentType, values: Item[], keyField: string) => values.map(item => {
    const id = String(item[keyField]); const version = Number(item.version ?? item.current_version); const detail = (type === "catalog" || type === "method" ? item.current ?? {} : item) as Item;
    const title = String(detail.name ?? detail.title ?? item.name ?? id);
    return <article key={`${type}:${id}:${version}`} className="rounded-2xl border border-[#d7cfb7] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{type} · v{version} · {String(item.review_status)}</p><h3 className="mt-1 text-lg font-black">{title}</h3><p className="mt-1 text-xs text-[#647469]">ID: {id} · Topic/slot: {String(item.topic_key ?? item.slot_key ?? "—")}</p></div><span className="rounded-full bg-[#f2f4ed] px-3 py-1 text-xs">{item.published || item.active ? "Đang hiển thị" : "Bản nháp"}</span></div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{String(detail.content ?? detail.description ?? detail.intro ?? (detail.instructions ? JSON.stringify(detail.instructions, null, 2) : ""))}</p>
      <details className="mt-3"><summary className="cursor-pointer text-xs font-bold">Nguồn, an toàn, thành phần và câu hỏi</summary><pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-[#f7f4e9] p-3 text-xs">{JSON.stringify({ evidence: detail.evidence_summary, sources: detail.source_references ?? detail.evidence_sources, safety: detail.safety_notes, contraindications: detail.contraindications, components: item.components, recipe: item.recipe, question: detail.question_prompt, options: detail.question_options }, null, 2)}</pre></details>
      <div className="mt-4 flex flex-wrap gap-2">{([ ["approve", "Duyệt nội dung"], ["publish", "Kích hoạt / xuất bản"], ...(type === "catalog" ? [["recommend", "Đưa vào đề xuất"] as const] : []), ["reject", "Từ chối"], ["deactivate", "Ngừng hiển thị"] ] as const).map(([action, label]) => <button key={action} type="button" disabled={Boolean(busy)} onClick={() => void decide(type, id, version, action)} className={`min-h-10 rounded-lg border px-3 text-xs font-bold disabled:opacity-50 ${action === "publish" || action === "recommend" ? "bg-[#183d36] text-white" : action === "reject" ? "border-rose-300 text-rose-900" : "border-[#bdcbb7]"}`}>{busy === `${type}:${id}` ? "Đang lưu…" : label}</button>)}</div>
    </article>;
  });

  const sections: Array<[string, Item[], string, ContentType]> = queue ? [
    ["Catalog chờ rà soát", queue.catalog ?? [], "id", "catalog"],
    ["Daily Health Clues", queue.clues ?? [], "clue_id", "clue"],
    ["Knowledge Bosses", queue.bosses ?? [], "boss_id", "boss"],
    ["Usage Methods", queue.methods ?? [], "id", "method"],
    ["Recipe Combos", queue.recipeCombos ?? [], "id", "recipe_combo"],
    ["Journey Combos", queue.journeyCombos ?? [], "id", "journey_combo"],
  ] : [];

  return <main className="mx-auto min-h-screen max-w-5xl bg-[#f7f4e9] px-4 py-10 text-[#203b34] sm:px-8">
    <header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">HealthClues · quản trị</p><h1 className="mt-2 text-3xl font-black">Rà soát nội dung và công cụ</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#647469]">Reviewer kiểm tra nguồn, hướng dẫn, thành phần và thông tin an toàn. Draft không hoạt động cho đến khi được duyệt và xuất bản rõ ràng.</p></header>
    <nav className="mt-3 flex flex-wrap gap-4 text-sm"><a href="/admin/healthclues-diagnostics" className="font-bold text-emerald-900 underline">Chẩn đoán vận hành</a><a href="/admin/healthclues-authoring" className="font-bold text-emerald-900 underline">Soạn Methods và Combos</a><a href="/admin/healthclues-rewards" className="font-bold text-emerald-900 underline">Cấu hình phần thưởng</a></nav>
    <form onSubmit={event => { event.preventDefault(); void load(); }} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#d7cfb7] bg-white p-4"><label className="min-w-64 flex-1 text-xs font-bold">Mã reviewer<input type="password" value={token} onChange={event => setToken(event.target.value)} autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] px-3"/></label><button className="min-h-11 self-end rounded-xl bg-[#183d36] px-5 text-sm font-bold text-white">Tải hàng đợi</button></form>
    <button type="button" onClick={() => void importReviewDrafts()} disabled={!token || Boolean(busy)} className="mt-3 min-h-10 rounded-xl border border-emerald-900 px-4 text-sm font-bold disabled:opacity-50">{busy === "import" ? "Đang nạp…" : "Nạp 6 bản nháp có nguồn để reviewer đánh giá"}</button>
    <label className="mt-4 block text-xs font-bold">Lý do quyết định / ghi chú audit<input value={reason} onChange={event => setReason(event.target.value)} maxLength={1200} className="mt-1 min-h-11 w-full rounded-lg border border-[#d5dacd] bg-white px-3" placeholder="Bắt buộc cho mọi quyết định"/></label>
    <label className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/><span>Tôi là reviewer và đã tự kiểm tra nội dung, nguồn tham khảo, giới hạn bằng chứng và thông tin an toàn. Chỉ xác nhận sau khi đánh giá thực tế.</span></label>
    <p role="status" className="mt-3 text-sm">{message}</p>
    {sections.map(([title, items, key, type]) => <section key={type} className="mt-8"><h2 className="mb-3 text-xl font-black">{title} ({items.length})</h2><div className="space-y-3">{renderItems(type, items, key)}</div></section>)}
  </main>;
}
