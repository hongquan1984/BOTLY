"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CircleHelp, Eye, LockKeyhole, Sparkles, Backpack, History, Trash2 } from "lucide-react";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "@/components/healthclues/HealthCluesGameIcon";
import { resolveWellnessIcon } from "@/components/healthclues/wellnessIconResolver";

export type BackpackTool = {
  id: string; slug: string; kind: string; slot: string; version: number; name: string;
  category?: string | null;
  description: string; icon: string | null; evidenceClass: string; evidenceSummary: string | null;
  evidenceSources?: unknown[]; safetyNotes: string | null; contraindications: unknown[]; recommendationEligible: boolean;
  usageMethods?: Array<{ id: string; name: string; instructions: unknown[]; estimatedMinutes: number | null; safetyNotes: string | null }>;
  topicTags?: string[];
  demoOnly?: boolean;
};
type Entry = { id: string; journey_id: string; catalog_item_id: string | null; equipment_position?: number | null; slot_key?: string; status: string };
type UsageHistory = { toolkit_entry_id: string; local_date?: string; status: string; occurrence_count: number | null };

function toolGameIcon(tool: BackpackTool): HealthCluesGameIconName {
  const resolved = resolveWellnessIcon({ text: `${tool.name} ${tool.slug}`, category: tool.category || tool.kind, description: tool.description });
  if (resolved.key !== "quests:target") return resolved.key;
  const text = `${tool.kind} ${tool.category || ""} ${tool.slug} ${tool.name}`.toLowerCase();
  if (/herb|botanical|tea|plant|seed/i.test(text)) return "inv:herbs";
  if (/drink|water|fluid|soda/i.test(text)) return "inv:water";
  if (/food|nutrition|eat|meal|diet|snack|apple/i.test(text)) return "inv:food";
  if (/walk|movement|exercise|step|run|activity/i.test(text)) return "inv:movement";
  if (/breath|meditat|mind|calm|rest|sleep|relax/i.test(text)) return "inv:lotus";
  if (/book|read|guide|lore|learn/i.test(text)) return "inv:book";
  return "inv:backpack";
}

export function BackpackExperience({
  accessToken, worldId, tools, savedIds, entries, usageHistory, topic, onEquipped, onCollection, onContinue,
}: {
  accessToken?: string; worldId: string; tools: BackpackTool[]; savedIds: string[]; entries: Entry[]; usageHistory: UsageHistory[];
  topic: string; onEquipped: () => void; onCollection: () => void; onContinue: () => void;
}) {
  const [view, setView] = useState<"intro" | "tools" | "preview" | "details" | "history">("intro");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [message, setMessage] = useState("");
  const [equipmentPosition, setEquipmentPosition] = useState(1);
  const [replaceEntryId, setReplaceEntryId] = useState("");
  const [historyEntryId, setHistoryEntryId] = useState("");
  const selected = tools.find(tool => tool.id === selectedId) ?? null;
  const positions = useMemo(() => [1, 2, 3], []);
  // Catalog rows currently have no reviewed topic-tag association. Never guess that an
  // otherwise reviewed item is relevant to a personal Health or Sleep Journey.
  const relevantTools = tools.filter(tool => tool.topicTags?.some(tag => tag === "general-education" || tagMatches(tag, topic)));
  const equippedFor = (position: number) => entries.find(entry => entry.status === "equipped" && entry.equipment_position === position);

  const equip = async () => {
    if (!selected || !accessToken || !worldId || !selected.recommendationEligible || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/healthclues/world/toolkit", {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, catalogItemId: selected.id, itemVersion: selected.version, equipmentPosition, ...(replaceEntryId ? { replaceEntryId } : {}), requestKey: crypto.randomUUID() }), cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This tool could not be equipped.");
      setMessage(`${selected.name} was added to Backpack slot ${equipmentPosition}. You can change it anytime.`); onEquipped();
    } catch (error) { setMessage(error instanceof Error ? error.message : "This tool could not be equipped."); }
    finally { setBusy(false); }
  };

  const saveToCollection = async () => {
    if (!selected || !accessToken || savedIds.includes(selected.id) || savingCollection) return;
    setSavingCollection(true);
    try {
      const response = await fetch("/api/healthclues/world/collection", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ catalogItemId: selected.id, itemVersion: selected.version }), cache: "no-store" });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This tool could not be saved.");
      setMessage("Saved to My Collection. Saving does not equip a tool."); onEquipped();
    } catch (error) { setMessage(error instanceof Error ? error.message : "This tool could not be saved."); }
    finally { setSavingCollection(false); }
  };

  const removeFromBackpack = async (entry: Entry) => {
    if (!accessToken || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/healthclues/world/toolkit", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: entry.id, action: "archive" }), cache: "no-store" });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This tool could not be removed.");
      setMessage("Removed from the active Backpack. My Collection and past tracking remain saved."); onEquipped();
    } catch (error) { setMessage(error instanceof Error ? error.message : "This tool could not be removed."); }
    finally { setBusy(false); }
  };

  return <section className="hc-backpack-experience" aria-label="Adventure Backpack">
    <div className="hc-backpack-heading"><HealthCluesGameIcon icon="inv:backpack" size={28} tone="gold" /><div><p>YOUR ADVENTURE GEAR</p><h3>Backpack</h3></div><button type="button" className="hc-guide-help" onClick={onContinue} aria-label="Continue your adventure"><CircleHelp size={17}/> Help</button></div>
    <p className="hc-backpack-intro">Three flexible equipment slots. Action category stays with the tool; it does not determine its slot. Zero to three choices are welcome.</p>
    <div className="hc-backpack-slots">{positions.map(position => {
      const entry = equippedFor(position);
      const item = entry ? tools.find(tool => tool.id === entry.catalog_item_id) : null;
      return <article key={position} className={`hc-backpack-slot ${entry ? "is-equipped" : ""}`} data-backpack-position={position}><span>BACKPACK SLOT {position} · {entry ? "EQUIPPED" : "OPEN"}</span>{entry ? <><strong>{item?.name || "Saved tool"}</strong><small>{item?.slot ? slotName(item.slot) : entry.slot_key?.replaceAll("_", " ") || "Personal method"} · {item?.description || "Private tracked tool"}</small><div className="hc-backpack-actions"><button type="button" onClick={()=>{setSelectedId(item?.id || "");setView("details");}}>View details</button><button type="button" onClick={()=>{setHistoryEntryId(entry.id);setView("history");}}><History size={14}/> Tracking history</button><button type="button" disabled={busy} onClick={()=>void removeFromBackpack(entry)}><Trash2 size={14}/> Remove</button><button type="button" onClick={()=>{setEquipmentPosition(position);setReplaceEntryId(entry.id);setView("tools");}}>Replace</button></div></> : <strong>Open · no tool selected</strong>}</article>;
    })}</div>
    {view === "intro" && <div className="hc-backpack-actions">
      <button type="button" className="hc-guide-primary" onClick={() => { setReplaceEntryId(""); setView("tools"); }}>Explore tools</button>
      <button type="button" onClick={onCollection} className="inline-flex items-center gap-1.5"><HealthCluesGameIcon icon="inv:chest" size={15} tone="amber"/> My Collection</button>
      <button type="button" onClick={onContinue}>Skip for now</button>
    </div>}
    {view === "tools" && <>
      <div className="hc-backpack-subhead"><h4>Tools for {topic}</h4><button type="button" onClick={() => setView("intro")}>Back</button></div>
      {relevantTools.length ? <div className="hc-tool-preview-list">{relevantTools.map(tool => <article key={tool.id}>
        <span className="hc-tool-icon"><HealthCluesGameIcon icon={toolGameIcon(tool)} size={18} tone="botanical"/></span><div><strong>{tool.name}</strong><small>{tool.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : `${slotName(tool.slot)} · Reviewed`}</small></div>
        <button type="button" aria-label={`Preview ${tool.name}`} onClick={() => { setSelectedId(tool.id); setView("preview"); }}><Eye size={16}/> Preview</button>
      </article>)}</div> : <div className="hc-backpack-empty"><Sparkles size={22}/><strong>No reviewed tools matched to this journey yet.</strong><p>HealthClues will not substitute unrelated tools. You can leave your Backpack empty and continue exploring.</p><button type="button" onClick={onCollection}>Browse My Collection</button></div>}
      <div className="hc-backpack-actions"><button type="button" onClick={onContinue}>Continue adventure</button><button type="button" onClick={onContinue}>Skip for now</button></div>
    </>}
    {view === "history" && <div className="hc-tool-detail" role="region" aria-label="Backpack tracking history"><button type="button" className="hc-backpack-back" onClick={()=>setView("intro")}><ArrowLeft size={15}/> Back to Backpack</button><h4>Private tracking history</h4>{usageHistory.filter(row=>row.toolkit_entry_id===historyEntryId).length ? <ul>{usageHistory.filter(row=>row.toolkit_entry_id===historyEntryId).map((row,index)=><li key={`${row.toolkit_entry_id}:${row.local_date}:${index}`}>{row.local_date || "Saved date"} · {row.status.replaceAll("_"," ")}{row.occurrence_count !== null ? ` · ${row.occurrence_count} self-reported occurrence(s)` : ""}</li>)}</ul> : <p>No self-reported tracking is saved for this Backpack entry yet. An empty history does not mean the tool was not used.</p>}</div>}
    {selected && (view === "preview" || view === "details") && <div className="hc-tool-detail" role="region" aria-label={`${selected.name} tool details`}>
      <button type="button" className="hc-backpack-back" onClick={() => setView(view === "details" ? "preview" : "tools")}><ArrowLeft size={15}/> Back</button>
      <span className="hc-tool-icon large"><HealthCluesGameIcon icon={toolGameIcon(selected)} size={24} tone="botanical"/></span><p className="hc-tool-category">{selected.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : `${slotName(selected.slot)} · ${selected.kind.replaceAll("_", " ")}`}</p>
      <h4>{selected.name}</h4><p>{selected.description || "No additional description is available in the reviewed Catalog."}</p>
      {view === "details" ? <div className="hc-tool-long-details">
        <section><h5>Evidence</h5><p>{selected.evidenceSummary || `Evidence classification: ${selected.evidenceClass.replaceAll("_", " ")}. No further reviewed summary is available.`}</p></section>
        <section><h5>How to use</h5>{selected.usageMethods?.length ? selected.usageMethods.map(method=><div key={method.id}><strong>{method.name}{method.estimatedMinutes ? ` · ${method.estimatedMinutes} min` : ""}</strong><ol>{method.instructions.map((step,index)=><li key={index}>{instructionText(step)}</li>)}</ol>{method.safetyNotes && <p>{method.safetyNotes}</p>}</div>) : <p>No reviewed usage method is attached to this Catalog item yet. Do not infer instructions from this preview.</p>}</section>
        <section><h5>Safety</h5><p>{selected.safetyNotes || "No additional safety note is available in this Catalog version."}</p>{selected.contraindications.length > 0 && <ul>{selected.contraindications.map((item,index)=><li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul>}</section>
        <section><h5>References</h5>{selected.evidenceSources?.length ? <ul>{selected.evidenceSources.map((source,index)=><li key={index}>{sourceText(source)}</li>)}</ul> : <p>No references are attached to this reviewed Catalog version.</p>}</section>
        <button type="button" disabled={!accessToken || savingCollection || savedIds.includes(selected.id)} onClick={()=>void saveToCollection()}>{savedIds.includes(selected.id) ? "In My Collection" : savingCollection ? "Saving…" : "Save to My Collection"}</button>
      </div> : <>
        <p className="hc-tool-why">{selected.demoOnly ? "Synthetic local interface fixture; not a HealthClues recommendation." : <>This item is associated with your saved journey: <strong>{topic}</strong>.</>}</p>
        <p className="hc-tool-safety">{selected.safetyNotes || "No additional safety warning is listed in this Catalog version."}</p>
        <div className="hc-backpack-actions"><button type="button" className="hc-guide-primary" onClick={() => setView("details")}>View details</button>
          <label>Backpack slot<select value={equipmentPosition} onChange={event=>{const position=Number(event.target.value);setEquipmentPosition(position);setReplaceEntryId(equippedFor(position)?.id || "");}}>{positions.map(position=>{const occupied=equippedFor(position);return <option key={position} value={position}>Slot {position} · {occupied ? `Replace ${tools.find(tool=>tool.id===occupied.catalog_item_id)?.name || "equipped tool"}` : "Open"}</option>;})}</select></label>
          {equippedFor(equipmentPosition) && <p>This slot is occupied. Confirming Equip replaces that item while preserving its Collection and tracking history.</p>}
          <button type="button" disabled={busy || !selected.recommendationEligible} onClick={() => void equip()}>{busy ? "Saving…" : equippedFor(equipmentPosition) ? "Confirm Replace" : "Equip"}</button>
          {!selected.recommendationEligible && <span className="hc-tool-locked"><LockKeyhole size={14}/> Safety or eligibility checks are incomplete. Equip is unavailable.</span>}
        </div>
      </>}
      {message && <p role="status" className="hc-backpack-confirm">{message}</p>}
      {message.includes("added to Backpack slot") && <div className="hc-backpack-actions"><button type="button" onClick={() => { setMessage(""); setSelectedId(""); setReplaceEntryId(""); setView("tools"); }}>Explore another tool</button><button type="button" className="hc-guide-primary" onClick={onContinue}>Continue adventure</button></div>}
      {view === "details" && <button type="button" className="hc-guide-primary" onClick={() => setView("preview")}>Back to preview</button>}
    </div>}
  </section>;
}

function tagMatches(tag: string, topic: string) {
  const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
  return normalize(topic).split(" ").some(word => word.length > 2 && normalize(tag).split(" ").includes(word));
}

function slotName(slot: string) {
  return slot === "consume" ? "Consume / Eat" : slot === "reduce" ? "Reduce / Avoid" : "Do / Practice";
}

function instructionText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return [row.title, row.text, row.instruction, row.description].find((item): item is string => typeof item === "string") ?? "Reviewed instruction detail is unavailable.";
  }
  return "Reviewed instruction detail is unavailable.";
}

function sourceText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return [row.title, row.citation, row.name, row.url].find((item): item is string => typeof item === "string") ?? "Reviewed reference";
  }
  return "Reviewed reference";
}
