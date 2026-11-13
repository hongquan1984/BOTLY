"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers3, UtensilsCrossed } from "lucide-react";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

type Tool = { id: string; name: string; slot: string; version: number; recommendationEligible: boolean };
type Component = { catalog_item_id: string; item_version: number; slot_key: string; required: boolean; rationale: string | null; relationship?: string; name: string; description: string; evidenceClass: string; evidenceSummary: string | null; safetyNotes: string | null; contraindications: unknown[] };
type Combo = { kind: "recipe" | "journey"; id: string; version: number; title: string; rationale?: string | null; partialAcceptance?: string; method?: { name: string; instructions: unknown[]; safety_notes: string | null } | null; components: Component[] };
type Payload = { recipes: Combo[]; journeys: Combo[]; error?: string };

export function ComboJourneyPanel({ accessToken, tools, onSaved }: { accessToken?: string; tools: Tool[]; onSaved: () => void }) {
  const { locale } = useHealthCluesLocale();
  const isVi = locale === "vi";
  const [data, setData] = useState<Payload | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [replacement, setReplacement] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch("/api/healthclues/combos", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const payload = await response.json() as Payload;
      if (!response.ok) throw new Error(payload.error || "Reviewed Combos could not be opened.");
      setData(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Reviewed Combos could not be opened."); }
  }, [accessToken]);
  // load() updates state only after its network await completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const saveSelected = async (combo: Combo) => {
    if (!accessToken || busy) return;
    const selected = combo.components.filter(component => included[`${combo.kind}:${combo.id}:${component.catalog_item_id}`]).map(component => {
      const chosenId = replacement[`${combo.kind}:${combo.id}:${component.catalog_item_id}`] || component.catalog_item_id;
      const tool = tools.find(candidate => candidate.id === chosenId);
      return tool?.recommendationEligible ? tool : null;
    }).filter((tool): tool is Tool => Boolean(tool));
    const required = combo.components.filter(component => component.required);
    if (!selected.length) { setError("Select at least one component, or skip this Combo for now."); return; }
    if (combo.partialAcceptance === "all_or_nothing" && required.some(component => !included[`${combo.kind}:${combo.id}:${component.catalog_item_id}`])) { setError("This reviewed Combo requires all required components. You may skip the Combo instead."); return; }
    setBusy(`${combo.kind}:${combo.id}`); setError(""); setMessage("");
    try {
      const responses = await Promise.all(selected.map(tool => fetch("/api/healthclues/world/collection", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ catalogItemId: tool.id, itemVersion: tool.version }) })));
      const payloads = await Promise.all(responses.map(response => response.json().catch(() => ({}))));
      const failed = responses.findIndex(response => !response.ok);
      if (failed >= 0) throw new Error(payloads[failed]?.error || "Some selected components could not be saved.");
      setMessage(`${selected.length} selected component${selected.length === 1 ? "" : "s"} saved to My Collection. Equip each separately when you are ready.`);
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Selected components could not be saved."); }
    finally { setBusy(""); }
  };

  const combos = [...(data?.recipes ?? []), ...(data?.journeys ?? [])];
  return <section aria-labelledby="hc-combo-title" className="mt-6 rounded-3xl border border-[#d9d5c1] bg-[#f7f4e8] p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5ead8] text-emerald-900"><Layers3 className="h-5 w-5"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-900">{isVi ? "Tự chọn bộ công cụ" : "Build your own loadout"}</p><h2 id="hc-combo-title" className="text-xl font-black">{isVi ? "Combo Thói quen & Hành trình" : "Recipe & Journey Combos"}</h2></div></div>
    {!accessToken ? <p className="mt-4 text-sm text-[#657469]">{isVi ? "Đăng nhập để lưu các công cụ Combo vào Bộ sưu tập của bạn." : "Sign in to save chosen Combo components to your Collection."}</p> : error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p> : message ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p> : null}
    {!data && !error ? <p role="status" className="mt-4 text-sm text-[#68786b]">{isVi ? "Đang kiểm tra các Combo được thẩm định…" : "Checking reviewed Combos…"}</p> : data && !combos.length ? <div className="mt-4 rounded-2xl border border-dashed border-[#c9d0bd] bg-white/70 p-4 text-sm text-[#657469]">{isVi ? "Chưa có combo thói quen nào được thẩm định cho hành trình này. HealthClues không tự tạo các quy trình chưa qua chuyên gia kiểm duyệt. Bạn vẫn có thể trang bị từng công cụ riêng lẻ từ Bộ sưu tập của tôi." : "No reviewed Recipe or Journey Combos are available yet. HealthClues does not generate unreviewed routines. You can still equip items individually from My Collection."}</div> : <div className="mt-4 grid gap-4 lg:grid-cols-2">{combos.map(combo => <article key={`${combo.kind}:${combo.id}:${combo.version}`} className="rounded-2xl border border-[#ded9c6] bg-white p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-900">{combo.kind === "recipe" ? <UtensilsCrossed className="h-4 w-4"/> : <Layers3 className="h-4 w-4"/>}{combo.kind} · Version {combo.version}</div><h3 className="mt-2 text-lg font-black">{combo.title}</h3>{combo.rationale && <p className="mt-1 text-sm leading-relaxed text-[#5e7063]">{combo.rationale}</p>}{combo.method && <div className="mt-2 rounded-xl bg-[#f8f6ed] p-3 text-xs"><p className="font-extrabold">{combo.method.name}</p>{Array.isArray(combo.method.instructions) && combo.method.instructions.length > 0 && <ol className="mt-2 list-decimal space-y-1 pl-4">{combo.method.instructions.map((step,index) => <li key={index} className="leading-relaxed">{typeof step === "string" ? step : JSON.stringify(step)}</li>)}</ol>}{combo.method.safety_notes && <p className="mt-2 text-amber-900">{combo.method.safety_notes}</p>}</div>}<ul className="mt-3 space-y-2">{combo.components.map(component => { const key = `${combo.kind}:${combo.id}:${component.catalog_item_id}`; const alternatives = tools.filter(tool => tool.recommendationEligible && tool.slot === component.slot_key && tool.id !== component.catalog_item_id); return <li key={key} className="rounded-xl border border-[#e5e3d8] bg-[#fcfcf8] p-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={Boolean(included[key])} onChange={event => setIncluded(value => ({ ...value, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-900"/><span><span className="font-bold">{component.name}</span><span className="ml-2 rounded-full bg-[#e8eee3] px-2 py-1 text-[9px] font-black uppercase">{component.slot_key}</span>{component.required && <span className="ml-1 text-[10px] font-bold text-[#856d39]">Required</span>}<span className="mt-1 block text-xs leading-relaxed text-[#66766b]">{component.description}</span>{component.rationale && <span className="mt-1 block text-xs text-[#647469]">{component.rationale}</span>}{component.safetyNotes && <span className="mt-1 block text-xs text-amber-900">{component.safetyNotes}</span>}</span></label>{included[key] && <label className="mt-2 block text-xs font-semibold text-[#54685a]">Replace this component<select value={replacement[key] || component.catalog_item_id} onChange={event => setReplacement(value => ({ ...value, [key]: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] bg-white px-2 text-sm"><option value={component.catalog_item_id}>{component.name} · reviewed match</option>{alternatives.map(item => <option key={item.id} value={item.id}>{item.name} · {item.slot}</option>)}</select></label>}</li>; })}</ul><button type="button" disabled={!accessToken || Boolean(busy)} onClick={() => void saveSelected(combo)} className="mt-3 min-h-10 rounded-xl bg-[#183d36] px-4 text-sm font-extrabold text-white disabled:opacity-50">{busy === `${combo.kind}:${combo.id}` ? "Saving selected pieces…" : "Save selected pieces to Collection"}</button><p className="mt-2 text-[10px] text-[#778276]">Nothing is equipped automatically. Skip any optional piece or skip the Combo entirely.</p></article>)}</div>}
  </section>;
}
