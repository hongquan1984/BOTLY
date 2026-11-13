"use client";

import { useEffect, useState } from "react";
import type { BackpackTool } from "./BackpackExperience";

type Entry = { id: string; catalog_item_id: string | null; equipment_position?: number | null; status: string };
type PersonalMethod = { id: string; record_type: string; name: string; verification_status: string; status: string };

export function JourneyToolkitSummary({ accessToken, worldId, tools, entries, savedIds, onContinue, onChange }: { accessToken?: string; worldId: string; tools: BackpackTool[]; entries: Entry[]; savedIds: string[]; onContinue: () => void; onChange: () => void }) {
  const [methods, setMethods] = useState<PersonalMethod[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    void fetch(`/api/healthclues/care-plan?worldId=${encodeURIComponent(worldId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }).then(async response => {
      const data = await response.json() as { records?: PersonalMethod[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Care Plan summary is unavailable.");
      if (active) setMethods((data.records || []).filter(item => item.status === "active"));
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Care Plan summary is unavailable."); });
    return () => { active = false; };
  }, [accessToken, worldId]);
  const equipped = entries.filter(entry => entry.status === "equipped").sort((a, b) => (a.equipment_position || 0) - (b.equipment_position || 0));
  const name = (id: string | null) => tools.find(tool => tool.id === id)?.name || "Saved educational entry";
  return <section className="rounded-2xl border border-[#d9d4c4] bg-[#fbfaf4] p-4" aria-labelledby="hc-toolkit-summary-title">
    <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-900">Lumi · Journey review</p><h3 id="hc-toolkit-summary-title" className="mt-1 text-xl font-black">Great exploring! Here is what you chose.</h3><p className="mt-1 text-sm text-[#637368]">You can continue with zero tools. These private areas are separate and none is a treatment plan.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl bg-white p-3"><h4 className="font-extrabold">EQUIPPED TOOLKIT · {equipped.length}/3</h4>{equipped.length ? <ul className="mt-2 space-y-1 text-sm">{equipped.map(entry => <li key={entry.id}>Slot {entry.equipment_position}: {name(entry.catalog_item_id)}</li>)}</ul> : <p className="mt-2 text-sm text-[#66756a]">No equipped tools. That is okay.</p>}</article>
      <article className="rounded-xl bg-white p-3"><h4 className="font-extrabold">SAVED KNOWLEDGE · {savedIds.length}</h4>{savedIds.length ? <ul className="mt-2 space-y-1 text-sm">{savedIds.slice(0, 5).map(id => <li key={id}>{name(id)}</li>)}</ul> : <p className="mt-2 text-sm text-[#66756a]">No saved entries yet.</p>}</article>
      <article className="rounded-xl bg-white p-3"><h4 className="font-extrabold">MY OWN METHODS · {methods.length}</h4>{methods.length ? <ul className="mt-2 space-y-1 text-sm">{methods.slice(0, 5).map(method => <li key={method.id}>{method.name} · SELF-REPORTED / NOT VERIFIED</li>)}</ul> : <p className="mt-2 text-sm text-[#66756a]">No active self-reported methods.</p>}</article>
    </div>
    {error && <p role="status" className="mt-3 text-xs text-amber-900">Care Plan could not be loaded, so methods are not included in this summary. {error}</p>}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-[#cbd5c8] bg-white px-3 py-2 text-sm font-bold" onClick={onChange}>Change selections</button><button type="button" className="rounded-lg bg-[#173f36] px-4 py-2 text-sm font-extrabold text-white" onClick={onContinue}>Continue</button></div>
  </section>;
}
