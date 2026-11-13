"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, Heart, Search, ShieldAlert } from "lucide-react";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";

type Tool = { id: string; name: string; slot: string; version: number; recommendationEligible: boolean };
type Journey = { id: string; branch_id: string; title: string; status: string };
type Branch = { id: string; topic_key: string; title: string };
type ToolkitEntry = { id: string; journey_id: string; catalog_item_id: string | null; status: string };
type CommunityJourney = { id: string; alias: string; title: string; publicTopics: string[]; projection: Record<string, unknown>; sharedTools: Array<{ catalogItemId?: string; methodId?: string; timeline?: Array<{ date?: string; status?: string; occurrences?: number | null }> }>; sharingFrequency: string | null; following: boolean; updatedAt: string; status?: string };
type Payload = { journeys: CommunityJourney[]; error?: string };

export function CommunityJourneysPanel({ accessToken, journeys, branches, tools, entries, onWorldUpdated }: { accessToken?: string; journeys: Journey[]; branches: Branch[]; tools: Tool[]; entries: ToolkitEntry[]; onWorldUpdated: () => void }) {
  const [publicJourneys, setPublicJourneys] = useState<CommunityJourney[]>([]);
  const [myShares, setMyShares] = useState<CommunityJourney[]>([]);
  const [journeyId, setJourneyId] = useState("");
  const [alias, setAlias] = useState("Wayfinder");
  const [title, setTitle] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [shareTimeline, setShareTimeline] = useState(false);
  const [shareFrequency, setShareFrequency] = useState(false);
  const [shareTopic, setShareTopic] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [methodSearch, setMethodSearch] = useState("");
  const [reportReason, setReportReason] = useState("privacy");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (searchParams = "") => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [publicResponse, ownResponse] = await Promise.all([
        fetch(`/api/healthclues/community${searchParams ? `?${searchParams}` : ""}`, { headers, cache: "no-store" }),
        fetch("/api/healthclues/community?mine=1", { headers, cache: "no-store" }),
      ]);
      const [publicPayload, ownPayload] = await Promise.all([publicResponse.json() as Promise<Payload>, ownResponse.json() as Promise<Payload>]);
      if (!publicResponse.ok || !ownResponse.ok) throw new Error(publicPayload.error || ownPayload.error || "Community journeys could not be loaded.");
      setPublicJourneys(publicPayload.journeys ?? []); setMyShares(ownPayload.journeys ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Community journeys could not be loaded."); }
  }, [accessToken]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!journeyId && journeys[0]) { const timer = window.setTimeout(() => { setJourneyId(journeys[0].id); setTitle(journeys[0].title); }, 0); return () => window.clearTimeout(timer); } }, [journeyId, journeys]);

  const act = async (action: string, payload: Record<string, unknown>, refresh = true) => {
    if (!accessToken || busy) return null;
    setBusy(action); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/community", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
      const result = await response.json() as { error?: string; following?: boolean; status?: string; world_id?: string };
      if (!response.ok) throw new Error(result.error || "Community action could not be saved.");
      if (action === "share") setMessage("Your selected fields are now public. Private reflections were excluded.");
      else if (action === "revoke") setMessage("Sharing has been revoked. The public preview is no longer available.");
      else if (action === "follow" || action === "unfollow") setMessage(action === "follow" ? "Journey followed. You can return to this public timeline." : "Journey unfollowed.");
      else if (action === "report") setMessage("Report sent to the moderation queue.");
      else if (action === "start_own") { setMessage("Your own private journey has started from the shared topic. Their private history was not copied."); onWorldUpdated(); }
      if (refresh) await load();
      return result;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Community action could not be saved."); return null; }
    finally { setBusy(""); }
  };

  const share = async () => {
    const journey = journeys.find(item => item.id === (journeyId || journeys[0]?.id));
    const topic = branches.find(branch => branch.id === journey?.branch_id)?.topic_key;
    if (!journey || !topic) { setError("Choose one of your active journeys first."); return; }
    if (!shareTopic) { setError("Confirm whether to publish the Quest topic before sharing."); return; }
    await act("share", { journeyId, alias, title: title || journey.title, publicTopics: [topic], catalogItemIds: selectedTools, methodIds: [], shareTimeline, shareFrequency, shareReflections: false });
  };
  const activeJourneyId = journeyId || journeys[0]?.id || "";
  const shareableTools = tools.filter(tool => entries.some(entry => entry.journey_id === activeJourneyId && entry.catalog_item_id === tool.id && entry.status !== "archived"));

  return <section aria-labelledby="hc-community-title" className="mt-6 rounded-3xl border border-[#d3c9ad] bg-[#f6f2e7] p-5 sm:p-6">
    <div className="flex items-center gap-3"><HealthCluesAdventurer pose="welcoming" width={54} alt="Your adventurer at the community guild board"/><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3eadb] text-emerald-900"><Globe2 className="h-5 w-5"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-900">The Wayfinder Guild · Share only what you choose</p><h2 id="hc-community-title" className="text-xl font-black">Community Journeys</h2></div></div>
    {!accessToken ? <p className="mt-4 text-sm text-[#657469]">Sign in to follow public journeys or share selected fields.</p> : <>
      <div className="mt-4 rounded-2xl border border-[#ded9c6] bg-white p-4"><h3 className="font-extrabold">Share a selected journey</h3><p className="mt-1 text-xs leading-relaxed text-[#657469]">Your raw Journal notes, account identity and private check-ins are never copied. You can revoke sharing anytime.</p><label className="mt-3 flex items-start gap-2 rounded-lg bg-[#f5f7f1] p-3 text-xs"><input type="checkbox" checked={shareTopic} onChange={event => setShareTopic(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/><span>Share the selected Quest topic publicly. This is off until I choose it.</span></label>
        {!journeys.length ? <p className="mt-3 text-sm text-[#657469]">Create a journey before sharing a projection.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Journey<select value={journeyId} onChange={event => { const value = event.target.value; setJourneyId(value); setTitle(journeys.find(row => row.id === value)?.title || ""); setSelectedTools([]); }} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] bg-white px-2 text-sm">{journeys.map(journey => <option key={journey.id} value={journey.id}>{journey.title}</option>)}</select></label><label className="text-xs font-bold">Public alias<input value={alias} maxLength={40} onChange={event => setAlias(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] px-3 text-sm"/></label><label className="text-xs font-bold sm:col-span-2">Public title<input value={title} maxLength={120} onChange={event => setTitle(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] px-3 text-sm"/></label><fieldset className="sm:col-span-2"><legend className="text-xs font-bold">Choose specific tools in this journey to project</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{shareableTools.map(tool => <label key={tool.id} className="flex items-center gap-2 rounded-lg bg-[#faf9f5] p-2 text-xs"><input type="checkbox" checked={selectedTools.includes(tool.id)} onChange={event => setSelectedTools(value => event.target.checked ? [...value, tool.id] : value.filter(id => id !== tool.id))} className="h-4 w-4 accent-emerald-900"/>{tool.name} · {tool.slot}</label>)}</div>{!shareableTools.length && <p className="mt-2 text-xs text-[#768175]">No Catalog tools belong to this journey yet.</p>}</fieldset><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={shareTimeline} onChange={event => setShareTimeline(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/>Share dates and structured statuses for selected items</label><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={shareFrequency} onChange={event => setShareFrequency(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/>Share occurrence counts for selected items</label><button type="button" disabled={Boolean(busy) || !journeys.length} onClick={() => void share()} className="min-h-10 rounded-xl bg-[#183d36] px-4 text-sm font-extrabold text-white disabled:opacity-50 sm:justify-self-start">{busy === "share" ? "Saving sharing choices…" : "Share selected fields"}</button></div>}
      </div>
      {myShares.filter(item => item.status === "active").map(item => <div key={item.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-sm"><strong>Public now:</strong> {item.title} · {item.alias}</p><button type="button" disabled={Boolean(busy)} onClick={() => void act("revoke", { publicJourneyId: item.id })} className="min-h-9 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-900">Revoke sharing</button></div>)}
      <div className="mt-5 rounded-2xl border border-[#ded9c6] bg-white p-4"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-emerald-900"/><h3 className="font-extrabold">Explore public trails</h3></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-bold">Catalog Item ID<input value={itemSearch} onChange={event => setItemSearch(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] px-3 text-xs" placeholder="Optional exact ID"/></label><label className="text-xs font-bold">Usage Method ID<input value={methodSearch} onChange={event => setMethodSearch(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] px-3 text-xs" placeholder="Optional exact ID"/></label><button type="button" onClick={() => void load(new URLSearchParams({ ...(itemSearch ? { catalogItemId: itemSearch } : {}), ...(methodSearch ? { methodId: methodSearch } : {}) }).toString())} className="min-h-10 self-end rounded-lg border border-[#bdcbb7] px-3 text-xs font-extrabold"><Search className="mr-1 inline h-3.5 w-3.5"/>Search</button></div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}{message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
        <div className="mt-4 space-y-3">{publicJourneys.map(item => <article key={item.id} className="rounded-xl border border-[#e2dfd3] bg-[#fcfcf8] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Shared by {item.alias}</p><h4 className="mt-1 font-black">{item.title}</h4><p className="mt-1 text-xs text-[#66766b]">Topics: {item.publicTopics.join(" · ")}</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold">Updated {new Date(item.updatedAt).toLocaleDateString()}</span></div><ul className="mt-3 space-y-1 text-xs">{item.sharedTools.map((tool,index) => <li key={`${tool.catalogItemId}-${tool.methodId}-${index}`} className="rounded-lg bg-white p-2"><span className="font-semibold">{tool.catalogItemId ? tools.find(row => row.id === tool.catalogItemId)?.name || "Reviewed Catalog tool" : "Selected Method"}</span>{tool.methodId && <span> · Method ID: {tool.methodId}</span>}{tool.timeline?.length ? <span className="mt-1 block text-[#647469]">Shared timeline: {tool.timeline.map(day => `${day.date} (${day.status}${day.occurrences !== undefined ? `, ${day.occurrences} occurrences` : ""})`).join(" · ")}</span> : null}</li>)}</ul><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void act(item.following ? "unfollow" : "follow", { publicJourneyId: item.id })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#bdcbb7] bg-white px-3 text-xs font-bold"><Heart className="h-3.5 w-3.5"/>{item.following ? "Unfollow" : "Follow"}</button><button type="button" disabled={Boolean(busy)} onClick={() => void act("start_own", { publicJourneyId: item.id, topicKey: item.publicTopics[0] })} className="min-h-9 rounded-lg bg-[#183d36] px-3 text-xs font-bold text-white">Start My Own Journey</button><label className="flex items-center gap-1 text-xs">Report<select aria-label={`Report reason for ${item.title}`} value={reportReason} onChange={event => setReportReason(event.target.value)} className="min-h-9 rounded-lg border border-[#d5dacd] bg-white px-2"><option value="privacy">Privacy</option><option value="medical_claim">Health claim</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Other</option></select><button type="button" disabled={Boolean(busy)} onClick={() => void act("report", { publicJourneyId: item.id, reasonCode: reportReason })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold"><ShieldAlert className="h-3.5 w-3.5"/>Report</button></label></div></article>)}</div>
        {!publicJourneys.length && <div className="rounded-xl border border-dashed border-[#c9d0bd] bg-[#fbfaf4] p-4 text-sm text-[#657469]">No matching public journeys are available. Search by a reviewed Catalog ID or Usage Method ID, or start a private journey from your own Quest.</div>}
      </div>
    </>}
  </section>;
}
