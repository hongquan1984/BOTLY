"use client";

import { useCallback, useEffect, useState } from "react";
import { BookHeart, PencilLine, Save } from "lucide-react";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";

type JournalEntry = { id: string; entry_date: string; body: string; created_at: string; updated_at: string };

export function PrivateJournalPanel({ accessToken }: { accessToken?: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch("/api/healthclues/journal", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const payload = await response.json() as { entries?: JournalEntry[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Your private Journal could not be opened.");
      setEntries(payload.entries ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your private Journal could not be opened."); }
  }, [accessToken]);
  // load() updates state only after its network await completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!accessToken || !date || !text.trim() || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/journal", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...(editingId ? { entryId: editingId } : {}), entryDate: date, body: text }) });
      const payload = await response.json() as { entry?: JournalEntry; error?: string };
      if (!response.ok || !payload.entry) throw new Error(payload.error || "Your reflection could not be saved.");
      setMessage(editingId ? "Private reflection updated." : "Private reflection saved.");
      setText(""); setDate(""); setEditingId(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your reflection could not be saved."); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="hc-private-journal-title" className="mt-6 rounded-3xl border border-[#d8d2be] bg-[#fbfaf4] p-5 sm:p-6">
    <div className="flex items-center gap-3"><HealthCluesAdventurer pose="thinking" width={52} alt="Your adventurer keeping a private journey journal"/><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6eedf] text-emerald-900"><BookHeart className="h-5 w-5"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-900">Private field journal · only you can see these notes</p><h2 id="hc-private-journal-title" className="text-xl font-black">Private Journey Journal</h2></div></div>
    {!accessToken ? <p className="mt-4 text-sm text-[#68786b]">Sign in to save private reflections to your World.</p> : <>
      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]"><label className="sr-only" htmlFor="hc-journal-date">Reflection date</label><input id="hc-journal-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="min-h-11 rounded-xl border border-[#d4dacd] bg-white px-3 text-sm"/><label className="sr-only" htmlFor="hc-journal-body">Private reflection</label><textarea id="hc-journal-body" rows={2} maxLength={4000} value={text} onChange={event => setText(event.target.value)} placeholder="Write a private note for your journey…" className="rounded-xl border border-[#d4dacd] bg-white p-3 text-sm"/><button type="button" disabled={busy || !date || !text.trim()} onClick={() => void save()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183d36] px-4 text-sm font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{busy ? "Saving…" : editingId ? "Update note" : "Save note"}</button></div>
      {editingId && <button type="button" onClick={() => { setEditingId(""); setDate(""); setText(""); }} className="mt-2 text-xs font-bold text-emerald-900 underline">Cancel edit</button>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}{message && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
      <ol aria-label="Private Journal timeline" className="mt-5 space-y-2">{entries.map(entry => <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#e3dfd1] bg-white p-3"><div><time className="text-[10px] font-black uppercase tracking-wider text-[#758174]">{entry.entry_date}</time><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#43584a]">{entry.body}</p><p className="mt-1 text-[10px] text-[#879085]">Edited {new Date(entry.updated_at).toLocaleString()}</p></div><button type="button" aria-label={`Edit reflection from ${entry.entry_date}`} onClick={() => { setEditingId(entry.id); setDate(entry.entry_date); setText(entry.body); }} className="rounded-lg border border-[#d8dfd3] p-2 text-emerald-900"><PencilLine className="h-4 w-4"/></button></li>)}</ol>
      {!entries.length && <p className="mt-4 text-sm text-[#68786b]">Your private timeline starts when you save a reflection. Check-in notes are stored separately from this Journal.</p>}
    </>}
  </section>;
}
