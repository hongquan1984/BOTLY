"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type PreviewQuestion = { id: string; group: string; stage: string; type: string; text: string; options: string[]; note_vi?: string };
type QuizBankResponse = { questions: PreviewQuestion[]; activeVersion: number; draft: { version: number; questions: PreviewQuestion[] } | null; persistenceAvailable: boolean };

export default function HealthCluesQuizPreviewPage() {
  const [token, setToken] = useState("");
  const [questions, setQuestions] = useState<PreviewQuestion[] | null>(null);
  const [activeVersion, setActiveVersion] = useState(0);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [persistenceAvailable, setPersistenceAvailable] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotes, setShowNotes] = useState(true);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const visible = useMemo(() => questions?.filter(question => `${question.id} ${question.text} ${question.options.join(" ")}`.toLowerCase().includes(search.toLowerCase())) || [], [questions, search]);

  async function refreshBank(reviewerToken = token) {
    const response = await fetch("/api/admin/healthclues-quiz", { headers: { Authorization: `Bearer ${reviewerToken}` }, cache: "no-store" });
    const result = await response.json() as QuizBankResponse & { error?: string };
    if (!response.ok) throw new Error(result.error || "Could not load the quiz bank.");
    setActiveVersion(result.activeVersion);
    setDraftVersion(result.draft?.version ?? null);
    setPersistenceAvailable(result.persistenceAvailable);
    setQuestions(result.draft?.questions ?? result.questions);
  }

  async function load(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const reviewerToken = event.currentTarget.querySelector<HTMLInputElement>("#hc-admin-token")?.value ?? "";
      if (!reviewerToken) throw new Error("Enter the HealthClues reviewer token.");
      setToken(reviewerToken);
      await refreshBank(reviewerToken);
      setMessage("Quiz bank loaded. Question IDs, branches, and answer types are protected.");
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the preview."); }
    finally { setLoading(false); }
  }

  function updateQuestion(id: string, update: Partial<PreviewQuestion>) {
    setQuestions(previous => previous?.map(question => question.id === id ? { ...question, ...update } : question) ?? null);
  }

  async function save(action: "save_draft" | "publish") {
    if (!questions || !reason.trim()) { setError("Add an audit reason before saving."); return; }
    if (action === "publish" && !confirmed) { setError("Confirm that a reviewer has checked the wording and safety implications."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/healthclues-quiz", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, expectedActiveVersion: activeVersion, reason, confirmReviewed: confirmed, ...(action === "save_draft" ? { questions } : {}) }),
      });
      const result = await response.json() as { error?: string; version?: number };
      if (!response.ok) throw new Error(result.error || "Could not save the quiz bank.");
      await refreshBank();
      setMessage(action === "publish" ? `Quiz version ${result.version} published to the player.` : `Quiz draft version ${result.version} saved.`);
      setConfirmed(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the quiz bank."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">HEALTHCLUES · INTERNAL REVIEW</p><h1 className="mt-2 text-3xl font-black">Quiz question bank</h1><p className="mt-2 text-sm text-slate-400">Edit question wording, answer options, and Vietnamese reviewer notes. IDs, safety branches, and answer types are fixed in V1. Publishing requires a reviewer confirmation and creates a versioned player bank.</p>
    {!questions && <form onSubmit={load} className="mt-8 max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5"><label htmlFor="hc-admin-token" className="text-sm font-semibold">HealthClues reviewer token</label><input id="hc-admin-token" type="password" required value={token} onChange={event => setToken(event.target.value)} autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"/><button disabled={loading} className="mt-3 rounded-xl bg-emerald-300 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50">{loading ? "Loading…" : "Open question bank"}</button>{error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}<p className="mt-3 text-xs text-slate-500">Uses the separate server-configured reviewer credential. The token is sent only in the authorization header and is not stored.</p></form>}
    {questions && <>
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm font-bold">Active player version: {activeVersion || "bundled baseline (v1)"}{draftVersion ? ` · Draft: v${draftVersion}` : ""} · {questions.length} questions</p>
        {!persistenceAvailable && <p className="mt-2 text-sm text-amber-200">Read-only fallback: install the quiz-bank migration before saving changes.</p>}
        <label className="mt-4 block text-sm font-semibold">Audit reason<input value={reason} onChange={event => setReason(event.target.value)} maxLength={1200} minLength={3} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"/></label>
        <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4"/><span>I reviewed the full question bank, including safety wording and the user impact of each change.</span></label>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={loading || !persistenceAvailable} onClick={() => void save("save_draft")} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-bold disabled:opacity-50">Save draft</button><button type="button" disabled={loading || !persistenceAvailable || !draftVersion || !confirmed} onClick={() => void save("publish")} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">Publish reviewed version</button><button type="button" onClick={() => void refreshBank().then(() => setMessage("Latest active bank and draft loaded."), cause => setError(cause instanceof Error ? cause.message : "Could not reload."))} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-bold">Reload</button></div>
      </div>
      <div className="sticky top-0 z-10 mt-6 flex flex-col gap-3 border-y border-slate-800 bg-slate-950/95 py-4 backdrop-blur sm:flex-row sm:items-center"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-700 px-3"><Search className="h-4 w-4 text-emerald-300"/><span className="sr-only">Search question bank</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by ID or question" className="w-full bg-transparent text-sm outline-none"/></label><button type="button" aria-pressed={showNotes} onClick={() => setShowNotes(value => !value)} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold">Admin notes: {showNotes ? "Hide" : "Show"}</button></div>
      <div className="mt-5 space-y-4">{visible.map(question => <article key={question.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300"><span>{question.id}</span><span>{question.group}</span><span>{question.stage}</span><span>{question.type}</span></div><label className="mt-3 block text-xs font-semibold">Question wording<textarea value={question.text} onChange={event => updateQuestion(question.id, { text: event.target.value })} maxLength={1000} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-base font-bold"/></label><label className="mt-3 block text-xs font-semibold">Answer options (one per line)<textarea value={question.options.join("\n")} onChange={event => updateQuestion(question.id, { options: event.target.value.split(/\r?\n/).filter(Boolean) })} maxLength={3600} rows={Math.min(7, Math.max(2, question.options.length))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"/></label>{showNotes && <label className="mt-3 block border-t border-slate-800 pt-3 text-xs font-semibold text-amber-200">Vietnamese reviewer note<textarea value={question.note_vi ?? ""} onChange={event => updateQuestion(question.id, { note_vi: event.target.value })} maxLength={1200} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-normal text-slate-100"/></label>}</article>)}</div>
    </>}
    {message && <p role="status" className="mt-5 rounded-xl bg-slate-900 p-4 text-sm">{message}</p>}{error && questions && <p role="alert" className="mt-3 rounded-xl bg-rose-950 p-4 text-sm text-rose-200">{error}</p>}
  </div></main>;
}
