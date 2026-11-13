"use client";

import { useMemo, useState } from "react";
import type { DiscoveryContent, DiscoveryReviewStatus } from "@/data/healthclues-discoveries";

type SaveAction = "submitted" | "approved" | "activated" | "changes_requested" | "rejected" | "deactivated";
type Editable = DiscoveryContent & { _confirmed?: boolean; _reason?: string };
type AuditEvent = {
  id: number; content_id: string; action: SaveAction; old_status: string | null; new_status: string;
  occurred_at: string; reason: string; actor_identity: string; content_version: number;
};

const actionLabels: Record<SaveAction, string> = {
  submitted: "Gửi bản nháp", approved: "Đã duyệt", activated: "Đã kích hoạt",
  changes_requested: "Yêu cầu chỉnh sửa", rejected: "Từ chối", deactivated: "Vô hiệu hóa",
};

export default function HealthCluesDiscoveryReviewPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<Editable[] | null>(null);
  const [persistenceAvailable, setPersistenceAvailable] = useState(false);
  const [credentialIdentity, setCredentialIdentity] = useState("");
  const [audit, setAudit] = useState<Record<string, AuditEvent[]>>({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const visible = useMemo(() => items?.filter(item =>
    `${item.title} ${item.topicTags.join(" ")} ${item.contentType}`.toLowerCase().includes(search.toLowerCase())
  ) ?? [], [items, search]);
  const counts = useMemo(() => ({
    total: items?.length ?? 0,
    pending: items?.filter(item => item.reviewStatus === "needs_review" || item.reviewStatus === "changes_requested").length ?? 0,
    approved: items?.filter(item => item.reviewStatus === "reviewed").length ?? 0,
    active: items?.filter(item => item.reviewStatus === "reviewed" && item.status === "published").length ?? 0,
    rejected: items?.filter(item => item.reviewStatus === "rejected").length ?? 0,
    staticSeeds: items?.filter(item => item.id.startsWith("static-article-") || item.id.startsWith("ebook-")).length ?? 0,
  }), [items]);

  async function loadCandidates() {
    setMessage("Đang tải danh sách ứng viên…");
    try {
      const response = await fetch("/api/admin/healthclues-discoveries", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không tải được danh sách.");
      setItems(result.candidates as Editable[]);
      setPersistenceAvailable(Boolean(result.persistenceAvailable));
      setCredentialIdentity(result.credentialIdentity || "");
      setMessage(result.persistenceAvailable
        ? "Đã kết nối kho nội dung. Nội dung chưa duyệt không xuất hiện với khách."
        : "Danh sách chỉ đọc; chưa thể lưu vì catalog hoặc cấu hình lưu trữ chưa sẵn sàng.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được danh sách.");
    }
  }

  async function load(event: React.FormEvent) {
    event.preventDefault();
    await loadCandidates();
  }

  function change(id: string, update: Partial<Editable>) {
    setItems(previous => previous?.map(item => item.id === id ? { ...item, ...update } : item) ?? null);
  }

  async function importStaticCandidates() {
    if (!persistenceAvailable || !window.confirm(`Nhập ${counts.staticSeeds} ứng viên tĩnh ở trạng thái needs_review / draft? Các mục đã có sẽ được giữ nguyên.`)) return;
    setBusy("import");
    setMessage("Đang nhập ứng viên chờ rà soát…");
    try {
      const response = await fetch("/api/admin/healthclues-discoveries", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_static_candidates", confirmPendingImport: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không nhập được ứng viên.");
      await loadCandidates();
      setMessage(`Đã thêm ${result.insertedCount} / ${result.candidateCount} ứng viên còn thiếu. Tất cả ở trạng thái chờ rà soát và bản nháp.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không nhập được ứng viên.");
    } finally {
      setBusy("");
    }
  }

  async function save(item: Editable, action: SaveAction) {
    if (!persistenceAvailable) {
      setMessage("Chưa thể lưu: catalog hoặc cấu hình server chưa sẵn sàng.");
      return;
    }
    if (!item._reason?.trim()) {
      setMessage("Hãy ghi lý do hoặc ghi chú rà soát để lưu lịch sử.");
      return;
    }
    const needsConfirmation = action === "approved" || action === "activated";
    if (needsConfirmation && !item._confirmed) {
      setMessage("Xác nhận đã rà soát nguồn, tuyên bố, đối tượng phù hợp và cảnh báo an toàn trước khi duyệt.");
      return;
    }
    const clientOnlyFields = new Set(["_confirmed", "_reason", "reviewStatus", "reviewedBy", "reviewedAt", "status"]);
    const content = Object.fromEntries(Object.entries(item).filter(([key]) => !clientOnlyFields.has(key)));
    setBusy(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/healthclues-discoveries", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ item: content, action, reason: item._reason.trim(), confirmReviewed: needsConfirmation && Boolean(item._confirmed) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không lưu được thay đổi.");
      const nextReview: DiscoveryReviewStatus = action === "approved" || action === "activated" || action === "deactivated" ? "reviewed"
        : action === "changes_requested" ? "changes_requested" : action === "rejected" ? "rejected" : "needs_review";
      const nextStatus = action === "activated" ? "published" : action === "rejected" || action === "deactivated" ? "archived" : "draft";
      setItems(previous => previous?.map(existing => existing.id === item.id
        ? { ...item, reviewStatus: nextReview, status: nextStatus, reviewedBy: nextReview === "reviewed" ? result.credentialIdentity : null, reviewedAt: nextReview === "reviewed" ? new Date().toISOString() : null, _confirmed: false }
        : existing) ?? null);
      setAudit(previous => ({ ...previous, [item.id]: [] }));
      await loadAudit(item.id);
      setMessage(`${item.title}: ${actionLabels[action]}. Lịch sử đã lưu bởi ${result.credentialIdentity}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được thay đổi.");
    } finally {
      setBusy("");
    }
  }

  async function loadAudit(id: string) {
    try {
      const response = await fetch(`/api/admin/healthclues-discoveries?auditContentId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không tải được lịch sử.");
      setAudit(previous => ({ ...previous, [id]: result.audit as AuditEvent[] }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được lịch sử.");
    }
  }

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#18302b] sm:px-8"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">HEALTHCLUES · QUẢN TRỊ</p>
    <h1 className="mt-2 text-3xl font-black">Rà soát thư viện nội dung Discovery</h1>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#526b62]">Chỉ reviewer HealthClues có mã reviewer riêng mới được xem và thay đổi nội dung. Hệ thống ghi nhận vai trò reviewer; mã không xác định cá nhân.</p>
    {!items && <form onSubmit={load} className="mt-7 max-w-xl rounded-2xl border border-[#dce8dc] bg-white p-5">
      <label className="block text-sm font-semibold">Mã reviewer HealthClues<input type="password" required autoComplete="current-password" value={token} onChange={event => setToken(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#cbd9cb] px-3" /></label>
      <button className="mt-4 min-h-11 rounded-xl bg-[#18302b] px-5 font-bold text-white">Mở danh sách</button>
      <p className="mt-3 text-xs text-[#526b62]">Mã chỉ được gửi trong Authorization header và giữ trong bộ nhớ của trang hiện tại.</p>
    </form>}
    {items && <>
      <p className="mt-4 rounded-xl border border-[#dce8dc] bg-white p-3 text-sm">Nhật ký ghi nhận: <strong>{credentialIdentity}</strong> · phiên bản nội dung được tăng tự động.</p>
      <section aria-label="Thống kê rà soát" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[['Tổng ứng viên', counts.total], ['Chờ rà soát', counts.pending], ['Đã duyệt', counts.approved], ['Đang kích hoạt', counts.active], ['Đã từ chối', counts.rejected]].map(([label, count]) => <div key={label} className="rounded-xl border border-[#dce8dc] bg-white p-4"><p className="text-xs text-[#526b62]">{label}</p><p className="mt-1 text-2xl font-black">{count}</p></div>)}
      </section>
      <div className="sticky top-0 z-10 mt-6 flex flex-col gap-3 border-y border-[#dce8dc] bg-[#f5f7f2]/95 py-4 backdrop-blur sm:flex-row sm:items-center">
        <label className="flex-1 text-xs font-bold">Tìm theo tiêu đề, chủ đề hoặc loại nội dung<input value={search} onChange={event => setSearch(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#cbd9cb] bg-white px-3 text-sm font-normal" /></label>
        <button type="button" disabled={!persistenceAvailable || busy === "import"} onClick={() => void importStaticCandidates()} className="min-h-10 rounded-lg bg-[#18302b] px-4 text-sm font-bold text-white disabled:opacity-50">Nhập ứng viên tĩnh ({counts.staticSeeds})</button>
        <button type="button" onClick={() => { setItems(null); setAudit({}); setToken(""); }} className="min-h-10 rounded-lg border border-[#b8cbbb] px-4 text-sm font-bold">Đăng xuất</button>
      </div>
      {!persistenceAvailable && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Chế độ chỉ đọc: chưa thể lưu vào catalog. Kiểm tra migration và server-side Supabase.</p>}
      <div className="mt-4 grid gap-4">{visible.map(item => <article key={item.id} className="rounded-2xl border border-[#dce8dc] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{item.contentType} · {item.topicTags.join(", ") || "Chưa gắn chủ đề"}</p><h2 className="mt-1 text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-[#526b62]">{item.summary}</p></div><span className="rounded-full bg-[#eef4eb] px-3 py-1 text-xs font-semibold">{item.reviewStatus} · {item.status}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f5f7f2] p-3 text-sm"><p className="font-bold">Nguồn nội dung</p><a className="mt-1 block break-all underline" href={item.url} target="_blank" rel="noreferrer">{item.url}</a><p className="mt-2 text-xs text-[#526b62]">{item.evidence.summary || "Chưa có ghi chú bằng chứng."}</p>{item.evidence.sources.map((source, index) => <a key={source.url + "-" + index} href={source.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs underline">{source.label}: {source.url}</a>)}</div>
          <label className="text-xs font-bold">Tóm tắt cảnh báo an toàn<textarea value={item.safetyNotes ?? ""} onChange={event => change(item.id, { safetyNotes: event.target.value || null })} className="mt-1 min-h-20 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Chủ đề<input value={item.topicTags.join(", ")} onChange={event => change(item.id, { topicTags: event.target.value.split(",").map(value => value.trim()).filter(Boolean) })} className="mt-1 min-h-10 w-full rounded-lg border border-[#cbd9cb] px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Thời lượng ước tính (phút)<input type="number" min="1" max="240" value={item.estimatedMinutes ?? ""} onChange={event => change(item.id, { estimatedMinutes: event.target.value ? Number(event.target.value) : null })} className="mt-1 min-h-10 w-full rounded-lg border border-[#cbd9cb] px-3 text-sm font-normal" /></label></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Nguyên liệu<textarea value={item.ingredients.join("\n")} onChange={event => change(item.id, { ingredients: event.target.value.split("\n").map(value => value.trim()).filter(Boolean) })} className="mt-1 min-h-20 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label><label className="text-xs font-bold">Giới hạn / điều cần tránh<textarea value={item.restrictions.join("\n")} onChange={event => change(item.id, { restrictions: event.target.value.split("\n").map(value => value.trim()).filter(Boolean) })} className="mt-1 min-h-20 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label><label className="text-xs font-bold">Ghi chú bằng chứng<textarea value={item.evidence.summary} onChange={event => change(item.id, { evidence: { ...item.evidence, summary: event.target.value } })} className="mt-1 min-h-16 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label></div>
        <label className="mt-3 block text-xs font-bold">Nguồn tham khảo (mỗi dòng: nhãn | URL HTTPS)<textarea aria-label="Nguồn tham khảo (mỗi dòng: nhãn | URL HTTPS)" value={item.evidence.sources.map(source => `${source.label} | ${source.url}`).join("\n")} onChange={event => change(item.id, { evidence: { ...item.evidence, sources: event.target.value.split(/\r?\n/).filter(line => line.trim()).map(line => { const separator = line.indexOf("|"); return separator < 0 ? { label: "", url: line.trim() } : { label: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() }; }) } })} className="mt-1 min-h-24 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label>
        <label className="mt-3 block text-xs font-bold">Các bước có thể thực hiện (mỗi dòng một bước)<textarea value={item.instructions.join("\n")} onChange={event => change(item.id, { instructions: event.target.value.split("\n").map(value => value.trim()).filter(Boolean) })} className="mt-1 min-h-24 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label>
        <label className="mt-3 block text-xs font-bold">Lý do / ghi chú rà soát<textarea required minLength={2} maxLength={2000} value={item._reason ?? ""} onChange={event => change(item.id, { _reason: event.target.value })} className="mt-1 min-h-16 w-full rounded-lg border border-[#cbd9cb] p-3 text-sm font-normal" /></label>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed"><input type="checkbox" checked={Boolean(item._confirmed)} onChange={event => change(item.id, { _confirmed: event.target.checked })} className="mt-1 h-4 w-4" /><span>Đã kiểm tra nguồn gốc, quyền sử dụng, tuyên bố, chủ đề, đối tượng và cảnh báo an toàn. Tuyên bố về bệnh, thuốc, tương tác hoặc hiệu quả lâm sàng cần người có chuyên môn phù hợp rà soát.</span></label>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy === item.id || !persistenceAvailable} onClick={() => void save(item, "submitted")} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-bold disabled:opacity-50">Lưu / gửi bản nháp</button><button type="button" disabled={busy === item.id || !item._confirmed || !persistenceAvailable} onClick={() => void save(item, "approved")} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-bold disabled:opacity-50">Duyệt · chưa kích hoạt</button><button type="button" disabled={busy === item.id || !item._confirmed || !persistenceAvailable} onClick={() => void save(item, "activated")} className="min-h-10 rounded-lg bg-[#18302b] px-3 text-sm font-bold text-white disabled:opacity-50">Duyệt và kích hoạt</button><button type="button" disabled={busy === item.id || !persistenceAvailable} onClick={() => void save(item, "changes_requested")} className="min-h-10 rounded-lg border border-amber-400 px-3 text-sm font-bold disabled:opacity-50">Yêu cầu chỉnh sửa</button><button type="button" disabled={busy === item.id || !persistenceAvailable} onClick={() => void save(item, "rejected")} className="min-h-10 rounded-lg border border-rose-300 px-3 text-sm font-bold text-rose-800 disabled:opacity-50">Từ chối</button>{item.status === "published" && <button type="button" disabled={busy === item.id || !persistenceAvailable} onClick={() => void save(item, "deactivated")} className="min-h-10 rounded-lg border border-rose-500 px-3 text-sm font-bold text-rose-800 disabled:opacity-50">Vô hiệu hóa</button>}<button type="button" disabled={!persistenceAvailable} onClick={() => void loadAudit(item.id)} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-bold disabled:opacity-50">Xem lịch sử</button></div>
        {audit[item.id] && <section aria-label={`Lịch sử ${item.title}`} className="mt-4 rounded-xl border border-[#dce8dc] p-4"><h3 className="font-bold">Lịch sử rà soát</h3>{audit[item.id].length === 0 ? <p className="mt-2 text-sm">Chưa có thao tác nào.</p> : <ol className="mt-2 space-y-3">{audit[item.id].map(event => <li key={event.id} className="border-l-2 border-emerald-700 pl-3 text-sm"><p className="font-semibold">{actionLabels[event.action]} · {event.old_status ?? "chưa có"} → {event.new_status}</p><p className="text-xs text-[#526b62]">{new Date(event.occurred_at).toLocaleString("vi-VN")} · {event.actor_identity} · phiên bản {event.content_version}</p><p className="mt-1">{event.reason}</p></li>)}</ol>}</section>}
      </article>)}</div>
    </>}
    {message && <p role="status" className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}
  </div></main>;
}
