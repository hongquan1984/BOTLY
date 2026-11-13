"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ClipboardList, LockKeyhole, Plus, Save } from "lucide-react";

type RecordType = "user_method" | "medication";
type CareRecord = {
  id: string; record_type: RecordType; name: string; category: string; catalog_item_id: string | null; catalog_item_version: number | null; description: string | null;
  started_on: string | null; personal_schedule: string | null; private_notes: string | null;
  label_strength: string | null; instructions_as_written: string | null;
  schedule_kind: "scheduled" | "as_needed" | "journal_only" | null; status: "active" | "paused" | "archived";
  verification_status: "user_added_unverified";
};
type CareEvent = { id: string; record_id: string; local_date: string; self_reported_status: string; private_note: string | null };

export function PrivateCarePlanPanel({ accessToken, worldId }: { accessToken?: string; worldId: string }) {
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [type, setType] = useState<RecordType>("user_method");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("wellness_practice");
  const [description, setDescription] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [scheduleKind, setScheduleKind] = useState("journal_only");
  const [acknowledged, setAcknowledged] = useState(false);
  const [eventStates, setEventStates] = useState<Record<string, string>>({});
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [eventNotes, setEventNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const headers = useMemo(() => ({ ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), "Content-Type": "application/json" }), [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) { setError("Sign in to open private Care Plan records."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/healthclues/care-plan?worldId=${encodeURIComponent(worldId)}`, { headers, cache: "no-store" });
      const payload = await response.json() as { records?: CareRecord[]; events?: CareEvent[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Private records could not be loaded.");
      setRecords(payload.records || []); setEvents(payload.events || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Private records could not be loaded."); }
    finally { setLoading(false); }
  }, [accessToken, headers, worldId]);
  useEffect(() => {
    let active = true;
    if (!accessToken) return;
    void (async () => {
      try {
        const response = await fetch(`/api/healthclues/care-plan?worldId=${encodeURIComponent(worldId)}`, { headers, cache: "no-store" });
        const payload = await response.json() as { records?: CareRecord[]; events?: CareEvent[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Private records could not be loaded.");
        if (active) { setRecords(payload.records || []); setEvents(payload.events || []); }
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Private records could not be loaded."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [accessToken, headers, worldId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/care-plan", { method: "POST", headers, body: JSON.stringify({
        worldId, recordType: type, name, category: type === "medication" ? "medication" : category,
        ...(type === "user_method" ? { description } : { labelStrength: label, instructionsAsWritten: instructions, scheduleKind }),
        startedOn: startedOn || null, personalSchedule: schedule || null, privateNotes: notes || null,
        privacyAcknowledged: acknowledged,
      }), cache: "no-store" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Private record could not be saved.");
      setName(""); setDescription(""); setStartedOn(""); setSchedule(""); setNotes(""); setLabel(""); setInstructions(""); setAcknowledged(false);
      setNotice("Saved privately as USER ADDED · NOT VERIFIED BY HEALTHCLUES."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Private record could not be saved."); }
    finally { setBusy(false); }
  };

  const update = async (record: CareRecord, patch: Record<string, unknown>) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/care-plan", { method: "PATCH", headers, body: JSON.stringify({ worldId, id: record.id, ...patch }), cache: "no-store" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The record could not be updated.");
      setNotice("Your private record was updated."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The record could not be updated."); }
    finally { setBusy(false); }
  };

  const remove = async (record: CareRecord) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/care-plan", { method: "DELETE", headers, body: JSON.stringify({ worldId, id: record.id }), cache: "no-store" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The private record could not be deleted.");
      setNotice("Private record and its self-report history were deleted."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The private record could not be deleted."); }
    finally { setBusy(false); }
  };

  const track = async (record: CareRecord) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const response = await fetch("/api/healthclues/care-plan", { method: "POST", headers, body: JSON.stringify({ action: "track", worldId, recordId: record.id, localDate, status: eventStates[record.id] || "unsure", note: eventNotes[record.id] || "" }), cache: "no-store" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Self-report could not be saved.");
      setNotice("Saved as a private self-report. No game reward or adherence conclusion is attached."); setEventNotes(current => ({ ...current, [record.id]: "" })); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Self-report could not be saved."); }
    finally { setBusy(false); }
  };

  const hasMedication = records.some(record => record.record_type === "medication" && record.status === "active");
  const hasHerbalRecord = records.some(record => record.record_type === "user_method" && record.category === "herbal_nutrition" && record.status === "active");
  return <section className="hc-care-plan" aria-label="My private Care Plan">
    <div className="hc-encyclopedia-greeting"><span className="hc-npc-seal"><ClipboardList size={19}/></span><div><p>CARE RECORDS KEEPER · PRIVATE DESK</p><strong>Record methods or medicines you already use.</strong><small>HealthClues does not prescribe or change medication. This desk makes no safety or effectiveness assessment.</small></div></div>
    <p className="hc-care-warning"><LockKeyhole size={16}/> Private to your account. Entries are user-reported, never published to the Encyclopedia, equipped automatically, or rewarded.</p>
    <div className="hc-care-add"><h3><Plus size={17}/> Add a private record</h3>
      <form onSubmit={event => void submit(event)}>
        <label>Record type<select id="hc-care-record-type" value={type} onChange={event => setType(event.target.value as RecordType)}><option value="user_method">My own method or routine</option><option value="medication">Medicine I already use or was prescribed</option></select></label>
        <label>{type === "medication" ? "Medication name" : "Method name"}<input id="hc-care-name" required maxLength={120} value={name} onChange={event => setName(event.target.value)}/></label>
        {type === "user_method" ? <><label>Category<select id="hc-care-category" value={category} onChange={event => setCategory(event.target.value)}><option value="herbal_nutrition">Herbal & nutrition</option><option value="wellness_practice">Wellness practice</option><option value="movement">Movement</option><option value="other">Other</option></select></label><label>Description (optional)<textarea id="hc-care-description" maxLength={1000} value={description} onChange={event => setDescription(event.target.value)}/></label></> : <>
          <label>Label or strength as written (optional)<input id="hc-care-label-strength" maxLength={180} value={label} onChange={event => setLabel(event.target.value)}/></label><label>Instructions copied from your existing label/prescription (optional)<textarea id="hc-care-instructions" maxLength={500} value={instructions} onChange={event => setInstructions(event.target.value)}/></label><label>How would you like to record this?<select id="hc-care-schedule-kind" value={scheduleKind} onChange={event => setScheduleKind(event.target.value)}><option value="scheduled">My existing schedule</option><option value="as_needed">As needed</option><option value="journal_only">Journal only</option></select></label><p className="hc-care-warning">Enter only instructions you already have. This form does not calculate a dose, tell you when to take it, or advise changing or stopping it.</p>
        </>}
        <label>Started on (optional)<input id="hc-care-started-on" type="date" value={startedOn} onChange={event => setStartedOn(event.target.value)}/></label><label>Personal schedule (optional)<input id="hc-care-personal-schedule" maxLength={300} value={schedule} onChange={event => setSchedule(event.target.value)} placeholder="Your own note; no reminder is enabled"/></label><label>Private notes (optional)<textarea id="hc-care-private-notes" maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)}/></label>
        <label className="hc-care-ack"><input id="hc-care-privacy-ack" type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/> I understand this is my private, self-reported record, not medical advice or a HealthClues-reviewed recommendation.</label>
        <button type="submit" disabled={busy || !acknowledged}><Save size={15}/>{busy ? "Saving…" : "Save private record"}</button>
      </form>
    </div>
    <div className="hc-care-records"><h3>My Care Plan</h3>{hasMedication && hasHerbalRecord && <p className="hc-care-warning">Some herbs and supplements can interact with medicines. Your combination has not been verified by HealthClues. Please check with a pharmacist or healthcare professional.</p>}{loading ? <p role="status">Opening your private records…</p> : records.filter(record => record.status !== "archived").length ? records.filter(record => record.status !== "archived").map(record => <article key={record.id} className="hc-care-record" data-care-record-id={record.id}>
      <header><div><strong>{record.name}</strong><small>{record.record_type === "medication" ? "Medication · user-entered" : `${record.category.replaceAll("_", " ")} · USER ADDED`}</small><small>{record.status === "paused" ? "Tracking paused" : "NOT VERIFIED BY HEALTHCLUES"}</small></div><span>{record.status}</span></header>

      {record.description && <p>{record.description}</p>}{record.label_strength && <p>Label/strength: {record.label_strength}</p>}{record.instructions_as_written && <p>Instructions you entered: {record.instructions_as_written}</p>}
      <div className="hc-care-private-notes"><label>Private notes<textarea defaultValue={record.private_notes || ""} maxLength={2000}/></label><button type="button" disabled={busy} onClick={event => void update(record, { privateNotes: event.currentTarget.parentElement?.querySelector("textarea")?.value ?? "" })}>Save private notes</button></div>
      <div className="hc-care-track"><label>Today’s self-report<select value={eventStates[record.id] || "unsure"} onChange={event => setEventStates(current => ({ ...current, [record.id]: event.target.value }))}><option value="used">Used / tried as I already intended</option><option value="not_yet">Not yet</option><option value="skipped">Skipped</option><option value="unsure">Don’t remember</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label>Note (optional)<input maxLength={1000} value={eventNotes[record.id] || ""} onChange={event => setEventNotes(current => ({ ...current, [record.id]: event.target.value }))}/></label><button type="button" disabled={busy} onClick={() => void track(record)}>Save private check-in</button></div>
      <div className="hc-care-actions"><button type="button" disabled={busy} onClick={() => void update(record, { status: record.status === "paused" ? "active" : "paused" })}>{record.status === "paused" ? "Resume tracking" : "Pause tracking"}</button><label className="hc-care-edit-name">Edit name<input maxLength={120} value={editNames[record.id] ?? record.name} onChange={event => setEditNames(current => ({ ...current, [record.id]: event.target.value }))}/><button type="button" disabled={busy || !(editNames[record.id] ?? record.name).trim()} onClick={() => void update(record, { name: editNames[record.id] ?? record.name })}>Save name</button></label><button type="button" disabled={busy} onClick={() => { if (window.confirm("Permanently delete this private record and its self-reports?")) void remove(record); }}><Archive size={14}/> Delete private record</button></div>
      <details><summary>Private self-report history</summary>{events.filter(event => event.record_id === record.id).map(event => <p key={event.id}>{event.local_date} · {event.self_reported_status}{event.private_note ? ` · ${event.private_note}` : ""}</p>)}</details>
    </article>) : <div className="hc-backpack-empty"><ClipboardList size={20}/><strong>Your private Care Plan is empty.</strong><p>There are no records yet. You can add methods you already use or a medicine from your existing label, or leave this space empty.</p></div>}</div>
    {notice && <p role="status" className="hc-care-success">{notice}</p>}{error && <p role="alert" className="hc-care-error">{error}</p>}
  </section>;
}
