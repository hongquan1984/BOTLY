"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Compass, Sparkles } from "lucide-react";
import type { Recommendation } from "./personalized-recommendations";
import { HealthCluesGameIcon } from "@/components/healthclues/HealthCluesGameIcon";
import { resolveWellnessIcon } from "@/components/healthclues/wellnessIconResolver";

type Entry = { id: string; catalog_item_id: string | null; status: string; equipment_position?: number | null };
type ProfileSummary = { preferences?: string[]; time?: string | null };
type Props = {
  worldId: string;
  token?: string;
  station?: "nutrition" | "movement" | "practices";
  savedIds: string[];
  entries: Entry[];
  onUpdated: () => void;
};

export function PersonalizedSuggestions({ worldId, token, station, savedIds, entries, onUpdated }: Props) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<ProfileSummary>({});
  const [safetyNotice, setSafetyNotice] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [replace, setReplace] = useState<Recommendation | null>(null);
  const [changePreferences, setChangePreferences] = useState(false);
  const [preferenceField, setPreferenceField] = useState<"preference" | "time">("preference");
  const loggedShown = useRef(new Set<string>());

  const load = async () => {
    if (!token) return;
    const query = new URLSearchParams({ worldId });
    if (station) query.set("station", station);
    const response = await fetch(`/api/healthclues/recommendations?${query}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const body = await response.json() as {
      items?: Recommendation[]; profile?: ProfileSummary; safetyNotice?: string | null; error?: string;
    };
    if (!response.ok) throw new Error(body.error || "Suggestions are unavailable.");
    setItems(body.items || []);
    setProfile(body.profile || {});
    setSafetyNotice(body.safetyNotice || "");
  };

  useEffect(() => {
    let live = true;
    if (token) void (async () => {
      try {
        const query = new URLSearchParams({ worldId });
        if (station) query.set("station", station);
        const response = await fetch(`/api/healthclues/recommendations?${query}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const body = await response.json() as {
          items?: Recommendation[]; profile?: ProfileSummary; safetyNotice?: string | null; error?: string;
        };
        if (!response.ok) throw new Error(body.error || "Suggestions are unavailable.");
        if (live) {
          setItems(body.items || []);
          setProfile(body.profile || {});
          setSafetyNotice(body.safetyNotice || "");
        }
      } catch (caught) {
        if (live) setError(caught instanceof Error ? caught.message : "Suggestions are unavailable.");
      }
    })();
    return () => { live = false; };
  }, [token, worldId, station]);

  useEffect(() => {
    if (!token) return;
    for (const item of items) {
      const key = `${item.id}:${item.version}`;
      if (loggedShown.current.has(key)) continue;
      loggedShown.current.add(key);
      void fetch("/api/healthclues/recommendations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, catalogItemId: item.id, itemVersion: item.version,
          eventType: "shown", reasonCodes: item.reasonCodes, eventKey: crypto.randomUUID() }),
      });
    }
  }, [items, token, worldId]);

  const event = async (item: Recommendation, eventType: string, feedbackCode?: string) => {
    if (!token || (busy && busy !== item.id)) return;
    setBusy(item.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/recommendations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, catalogItemId: item.id, itemVersion: item.version,
          eventType, feedbackCode, reasonCodes: item.reasonCodes, eventKey: crypto.randomUUID() }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Could not save this choice.");
      if (eventType === "saved") {
        const save = await fetch("/api/healthclues/world/collection", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ catalogItemId: item.id, itemVersion: item.version }),
        });
        const data = await save.json() as { error?: string };
        if (!save.ok) throw new Error(data.error || "Could not save to Collection.");
        setMessage("Saved to Collection; it was not equipped.");
        onUpdated();
      } else if (eventType === "dismissed" || eventType === "feedback") {
        setMessage(feedbackCode ? "Feedback saved. Your current Backpack was not changed." : "Suggestion dismissed.");
        await load();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this choice.");
    } finally { setBusy(""); }
  };

  const equip = async (item: Recommendation, replaceId?: string, position?: number) => {
    if (!token) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/healthclues/world/toolkit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, catalogItemId: item.id, itemVersion: item.version, equipmentPosition: position,
          ...(replaceId ? { replaceEntryId: replaceId } : {}), requestKey: crypto.randomUUID() }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "The item could not be equipped.");
      await event(item, replaceId ? "replaced" : "equipped");
      setReplace(null); setMessage("Added to Backpack. You can change it anytime."); onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The item could not be equipped.");
    } finally { setBusy(""); }
  };

  const savePreference = async (value: string) => {
    if (!token) return;
    setError("");
    try {
      const response = await fetch("/api/healthclues/recommendations", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, field: preferenceField, value }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Preference could not be updated.");
      setChangePreferences(false);
      setMessage("Preference updated. Suggestions refreshed; your Backpack was not changed.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preference could not be updated.");
    }
  };

  if (!token) return <p>Sign in to view private suggestions for this World.</p>;

  const choices = preferenceField === "preference"
    ? ["Food & recipes", "Gentle movement", "Relaxation", "Open to exploring"]
    : ["Under 5 minutes", "5-15 minutes", "More than 15 minutes", "Not sure"];

  return <section aria-label="Suggested for your Journey" className="hc-personalized-suggestions">
    <h3><Sparkles size={17}/> Suggested for your Journey</h3>
    {error && <p role="alert">{error}</p>}
    {safetyNotice && <p role="alert" className="hc-safety-notice">{safetyNotice}</p>}
    {message && <p role="status">{message}</p>}
    <div className="hc-recommendation-profile-controls">
      <small>Saved focus: {profile.preferences?.join(", ") || "No preference shared"}{profile.time ? ` - ${profile.time}` : ""}. Self-reported.</small>
      <button type="button" onClick={() => { setPreferenceField("preference"); setChangePreferences(value => !value); }}>Change preferences</button>
    </div>
    {changePreferences && <div className="hc-suggestion-preferences">
      <strong>{preferenceField === "preference" ? "What would you rather explore?" : "How much time would you usually like?"}</strong>
      {choices.map(value => <button key={value} type="button" onClick={() => void savePreference(value)}>{value}</button>)}
      <button type="button" onClick={() => setPreferenceField(value => value === "preference" ? "time" : "preference")}>
        {preferenceField === "preference" ? "Adjust time instead" : "Change interests instead"}
      </button>
      <small>Optional. You can skip this and explore freely.</small>
    </div>}
    {items.length ? items.map(item => {
      const iconKey = resolveWellnessIcon({
        text: `${item.name} ${item.reason}`,
        category: item.category,
      }).key;
      const tone = item.category === "nutrition" ? "emerald" : item.category === "movement" ? "amber" : "lavender";
      return <article key={`${item.id}:${item.version}`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-xl border border-[#ded8c4] bg-[#fbf9f2] p-1.5 shadow-2xs">
            <HealthCluesGameIcon icon={iconKey} tone={tone} size={22} />
          </span>
          <div>
            <strong>{item.name}</strong>
            <small>{item.category} - {item.demoOnly ? "TEST ONLY - NOT HUMAN-REVIEWED" : item.evidenceClass.replaceAll("_", " ")}</small>
            <p>{item.reason}</p>
            {item.safetyNotes && <small>{item.safetyNotes}</small>}
            <small>{item.status.replaceAll("_", " ")}{item.equipmentEligible ? " - Equipment eligible for demo discovery" : " - Education only; not suitability-cleared"}</small>
          </div>
        </div>
      <div className="hc-suggestion-actions">
        <button type="button" onClick={() => {
          const landmark = item.category === "nutrition" ? "nutrition" : item.category;
          const destination = document.querySelector<HTMLButtonElement>(`[data-landmark="${landmark}"]`);
          if (destination) destination.click(); else setMessage("Walk to the matching location to explore this entry.");
        }}><Compass size={14}/> Explore</button>
        <button type="button" disabled={savedIds.includes(item.id) || busy === item.id} onClick={() => void event(item, "saved")}>
          <Bookmark size={14}/>{savedIds.includes(item.id) ? "Saved" : "Save"}
        </button>
        {item.status !== "requires_caution" && <button type="button" disabled={busy === item.id} onClick={() => void event(item, "dismissed")}>Not interested</button>}
        {item.status === "eligible_for_personalized_discovery" && <>
          <button type="button" disabled={busy === item.id} onClick={() => void event(item, "feedback", "no_time")}>No time</button>
          <button type="button" disabled={busy === item.id} onClick={() => void event(item, "feedback", "too_difficult")}>Too difficult</button>
          <button type="button" disabled={busy === item.id} onClick={() => void event(item, "feedback", "want_alternative")}>Want an alternative</button>
        </>}
        {item.equipmentEligible && !item.reasonCodes.includes("already_equipped") && <button type="button" disabled={busy === item.id} onClick={() => {
          const active = entries.filter(entry => entry.status === "equipped");
          const openPosition = [1, 2, 3].find(position => !active.some(entry => (entry.equipment_position || 0) === position));
          if (openPosition) void equip(item, undefined, openPosition); else setReplace(item);
        }}>Add to Backpack</button>}
      </div>
      {replace?.id === item.id && <div>
        <p>All three slots are filled. Choose a tool to replace:</p>
        {entries.filter(entry => entry.status === "equipped").map(entry => <button key={entry.id} type="button" onClick={() => void equip(item, entry.id, entry.equipment_position || 1)}>
          Replace {entry.catalog_item_id || "tool"} - slot {entry.equipment_position || "?"}
        </button>)}
        <button type="button" onClick={() => setReplace(null)}>Cancel</button>
      </div>}
    </article>;
    }) : <p>No supported personalized suggestions are available yet. You can still explore educational entries with Luna or Lumi.</p>}
  </section>;
}
