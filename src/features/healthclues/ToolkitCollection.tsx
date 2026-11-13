"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";

type CollectionTool = { id: string; name: string; slot: string; kind?: string; version: number; description?: string; evidenceClass?: string; evidenceSummary?: string | null; evidenceSources?: unknown[]; safetyNotes?: string | null; recommendationEligible?: boolean; demoOnly?: boolean };
type CollectionEntry = { id?: string; catalog_item_id: string | null; equipment_position?: number | null; status: string };

function sourceDetails(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const title = typeof source.title === "string" ? source.title : typeof source.name === "string" ? source.name : "Reference";
  const url = typeof source.url === "string" ? source.url : typeof source.href === "string" ? source.href : "";
  return { title, url };
}

export function ToolkitCollection({
  accessToken,
  worldId,
  tools,
  savedIds,
  entries,
  onEquipped,
}: {
  accessToken?: string;
  worldId: string | null;
  tools: CollectionTool[];
  savedIds: string[];
  entries: CollectionEntry[];
  onEquipped: () => void;
}) {
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState("");
  const [equipId, setEquipId] = useState("");
  const [equipmentPosition, setEquipmentPosition] = useState(1);
  const [replaceEntryId, setReplaceEntryId] = useState("");
  const reducedMotion = useReducedMotion();
  const saved = tools.filter(tool => savedIds.includes(tool.id) && `${tool.name} ${tool.description || ""} ${tool.slot}`.toLowerCase().includes(query.toLowerCase().trim()));

  const equip = async (tool: CollectionTool, position: number, replaceId: string) => {
    if (!accessToken || !worldId || busyId) return;
    setBusyId(tool.id);
    setMessage("");
    const requestKey = crypto.randomUUID();
    try {
      const response = await fetch("/api/healthclues/world/toolkit", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, catalogItemId: tool.id, itemVersion: tool.version, equipmentPosition: position, ...(replaceId ? { replaceEntryId: replaceId } : {}), requestKey }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This item could not be equipped.");
      setMessage(`${tool.name} added to Backpack slot ${position}. Previous history stays attached to its original entry.`);
      onEquipped();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This item could not be equipped.");
    } finally {
      setBusyId("");
    }
  };

  const unsave = async (tool: CollectionTool) => {
    if (!accessToken || busyId) return;
    setBusyId(tool.id); setMessage("");
    try {
      const response = await fetch("/api/healthclues/world/collection", { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ catalogItemId: tool.id }), cache: "no-store" });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This entry could not be removed.");
      setMessage(`${tool.name} removed from My Collection.`); onEquipped();
    } catch (error) { setMessage(error instanceof Error ? error.message : "This entry could not be removed."); }
    finally { setBusyId(""); }
  };

  return <section aria-labelledby="hc-my-collection" className="mt-6 rounded-3xl border border-[#d9d5c1] bg-[#fbfaf4] p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <HealthCluesAdventurer pose="curious" width={58} alt="Your adventurer reviewing collected tools"/>
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-900">My Collection ≠ Equipped Toolkit</p><h2 id="hc-my-collection" className="mt-1 text-2xl font-black">My Collection</h2><p className="mt-1 max-w-2xl text-sm text-[#637267]">Saved learning entries stay separate from the Backpack. Eligible entries can be equipped into any position; saving alone never equips them.</p></div>
      <span className="rounded-full border border-[#d8dccb] bg-white px-3 py-2 text-xs font-bold">{saved.length} saved</span>
    </div>
    <label className="mt-4 flex items-center gap-2 rounded-xl border border-[#d5dacd] bg-white px-3"><span className="sr-only">Search My Collection</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search your collection" className="min-h-10 flex-1 bg-transparent text-sm outline-none"/><span className="text-xs text-[#718073]">{saved.length} entries</span></label>
    {message && <p role="status" className="mt-4 rounded-xl bg-[#edf2e7] p-3 text-sm font-semibold text-[#315342]">{message}</p>}
    {saved.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{saved.map((tool,index) => {
      const equipped = entries.some(entry => entry.catalog_item_id === tool.id && entry.status === "equipped");
      return <motion.article key={tool.id} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .22, delay: reducedMotion ? 0 : Math.min(index * .035, .18) }} className="rounded-2xl border border-[#e2e4d7] bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#738277]">{tool.slot.replaceAll("_", " ")} · v{tool.version}</p>
        <h3 className="mt-1 font-extrabold">{tool.name}</h3>
        <p className="mt-2 text-xs text-[#66766b]">{tool.description || "No description is available."}</p><p className="mt-1 text-[10px] uppercase text-[#7a704e]">{tool.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : `${tool.kind || tool.slot} · Evidence ${tool.evidenceClass || "not stated"}`}</p>
        {detailId === tool.id && <div className="mt-2 rounded-xl bg-[#f7f6ed] p-3 text-xs"><p>{tool.evidenceSummary || "No evidence summary is attached."}</p>{tool.safetyNotes && <p className="mt-1 text-amber-900">{tool.safetyNotes}</p>}{tool.evidenceSources?.length ? <div className="mt-2"><strong>Full details and references</strong><ul className="mt-1 list-disc pl-5">{tool.evidenceSources.map((value,index)=>{const source=sourceDetails(value);return <li key={`${tool.id}-source-${index}`}>{source?.url ? <a href={source.url} target="_blank" rel="noreferrer" className="underline">{source.title}</a> : source?.title || "Reference"}</li>})}</ul></div> : <p className="mt-2">{tool.demoOnly ? "No source is attached to this TEST ONLY fixture." : "No references are attached to this Catalog version."}</p>}</div>}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>setDetailId(detailId===tool.id?"":tool.id)} className="rounded-lg border border-[#d5ddcf] px-3 py-2 text-xs font-bold">{detailId===tool.id?"Close details":"View full details"}</button>{equipped && <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">Equipped · position {entries.find(entry=>entry.catalog_item_id===tool.id&&entry.status==="equipped")?.equipment_position ?? "—"}</span>}{tool.recommendationEligible && <button type="button" disabled={!accessToken||Boolean(busyId)} onClick={()=>setEquipId(equipId===tool.id?"":tool.id)} className="rounded-lg bg-[#183d36] px-3 py-2 text-xs font-bold text-white">{equipped?"Replace":"Request Equip"}</button>}{!tool.recommendationEligible && <span className="rounded-lg bg-[#f4f2e8] px-3 py-2 text-xs text-[#665f49]">Not eligible for Backpack equipment</span>}{!equipped&&<button type="button" disabled={!accessToken||Boolean(busyId)} onClick={()=>void unsave(tool)} className="rounded-lg border border-[#d5ddcf] px-3 py-2 text-xs font-bold">Unsave</button>}</div>
        {equipId===tool.id&&<div className="mt-3 rounded-xl bg-[#f7f6ed] p-3"><label className="block text-xs font-bold">Backpack position<select value={equipmentPosition} onChange={event=>{const position=Number(event.target.value);setEquipmentPosition(position);setReplaceEntryId(entries.find(entry=>entry.status==="equipped"&&entry.equipment_position===position)?.id||"");}} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-2">{[1,2,3].map(position=>{const occupied=entries.find(entry=>entry.status==="equipped"&&entry.equipment_position===position);return <option key={position} value={position}>Slot {position} · {occupied?"Replace equipped tool":"Open"}</option>;})}</select></label>{replaceEntryId&&<p className="mt-2 text-xs">Confirm to replace this item. Its Collection entry and history remain.</p>}<button type="button" disabled={!tool.recommendationEligible||Boolean(busyId)} onClick={()=>void equip(tool,equipmentPosition,replaceEntryId)} className="mt-2 rounded-lg bg-[#183d36] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{replaceEntryId?"Confirm replacement":"Confirm equip"}</button><button type="button" onClick={()=>setEquipId("")} className="ml-2 rounded-lg px-3 py-2 text-xs font-bold">Cancel</button>{!tool.recommendationEligible&&<p className="mt-1 text-xs text-amber-900">This entry is not currently eligible for equipment.</p>}</div>}
      </motion.article>;
    })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-[#c9d0bd] bg-white/70 p-5 text-sm text-[#657469]">Your Collection is empty. Save educational entries from an NPC discovery panel to keep them here.</div>}
    {!accessToken && <p className="mt-3 text-xs text-[#738074]">Sign in to save or equip Collection items across sessions.</p>}
  </section>;
}
