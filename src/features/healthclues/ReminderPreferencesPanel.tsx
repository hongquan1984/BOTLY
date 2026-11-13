"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Pause, Play, X } from "lucide-react";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

type Preference = { opted_in: boolean; timezone: string; local_send_time: string; frequency: "daily" | "weekdays" | "weekly"; paused: boolean };
type Delivery = { id: string; local_date: string; state: string; scheduled_at: string; sent_at: string | null };
type Response = { preference: Preference | null; deliveries: Delivery[]; error?: string };

export function ReminderPreferencesPanel({ accessToken, onSaved }: { accessToken?: string; onSaved?: () => void }) {
  const { locale } = useHealthCluesLocale();
  const isVi = locale === "vi";
  const [preference, setPreference] = useState<Preference>({ opted_in: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh", local_send_time: "07:30", frequency: "daily", paused: false });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const headers = useMemo(() => accessToken ? { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } : undefined, [accessToken]);
  const load = useCallback(async () => {
    if (!headers) return;
    const response = await fetch("/api/healthclues/reminders", { headers, cache: "no-store" });
    const data = await response.json() as Response;
    if (!response.ok) throw new Error(data.error || "Reminder settings are unavailable.");
    if (data.preference) setPreference({ ...data.preference, local_send_time: data.preference.local_send_time.slice(0, 5) });
    setDeliveries(data.deliveries || []);
  }, [headers]);
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch(reason => setError(reason instanceof Error ? reason.message : "Reminder settings are unavailable.")); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const act = async (action: string) => {
    if (!headers || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/healthclues/reminders", { method: "POST", headers, body: JSON.stringify({ action, optedIn: preference.opted_in, timezone: preference.timezone, localSendTime: preference.local_send_time, frequency: preference.frequency, consentConfirmed: consent }) });
      const data = await response.json() as Response;
      if (!response.ok) throw new Error(data.error || "Reminder preference could not be saved.");
      if (data.preference) setPreference(data.preference);
      setDeliveries(data.deliveries || []);
      setMessage(action === "unsubscribe"
        ? (isVi ? "Đã hủy đăng ký nhận email nhắc nhở." : "Reminder emails unsubscribed.")
        : action === "pause"
        ? (isVi ? "Đã tạm dừng nhắc nhở." : "Reminders paused.")
        : action === "resume"
        ? (isVi ? "Đã tiếp tục nhắc nhở." : "Reminders resumed.")
        : (isVi ? "Đã lưu cài đặt nhắc nhở thành công." : "Reminder preference saved."));
      if (action === "save") onSaved?.();
    } catch (reason) { setError(reason instanceof Error ? reason.message : (isVi ? "Không thể lưu cài đặt nhắc nhở." : "Reminder preference could not be saved.")); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="hc-reminders-title" className="mt-6 rounded-3xl border border-[#d3c9ad] bg-[#f6f2e7] p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3eadb] text-emerald-900"><Bell className="h-5 w-5"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-900">{isVi ? "Lịch nhắc nhở của bạn" : "Your schedule, your choice"}</p><h2 id="hc-reminders-title" className="text-xl font-black">{isVi ? "Nhắc nhở Hành trình hằng ngày" : "Daily Journey Reminder"}</h2></div></div>
    {!headers ? <p className="mt-4 text-sm text-[#657469]">{isVi ? "Đăng nhập để cài đặt nhắc nhở." : "Sign in to manage optional reminders."}</p> : <>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#657469]">{isVi ? "Mặc định hệ thống gửi 1 email nhắc nhở vào buổi sáng mỗi ngày để đồng hành cùng bạn khởi động thói quen hôm nay và mời bạn điểm danh ngày hôm qua. Bạn có thể bật tắt hoặc chỉnh giờ bất cứ lúc nào." : "Daily morning reminder email to start today's wellness habits and reflect on yesterday's check-in. You can pause or unsubscribe anytime."}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold">{isVi ? "Múi giờ" : "Timezone"}
          <select value={preference.timezone} onChange={event => setPreference(value => ({ ...value, timezone: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] bg-white px-3 text-sm">
            <option value="Asia/Ho_Chi_Minh">{isVi ? "Asia/Ho_Chi_Minh (Việt Nam UTC+7)" : "Asia/Ho_Chi_Minh (Vietnam UTC+7)"}</option>
            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
            <option value="Asia/Tokyo">{isVi ? "Asia/Tokyo (Nhật Bản UTC+9)" : "Asia/Tokyo (Japan UTC+9)"}</option>
            <option value="Asia/Seoul">{isVi ? "Asia/Seoul (Hàn Quốc UTC+9)" : "Asia/Seoul (Korea UTC+9)"}</option>
            <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
            <option value="Australia/Sydney">Australia/Sydney (UTC+10/11)</option>
            <option value="Europe/London">Europe/London (UK GMT/BST)</option>
            <option value="Europe/Paris">{isVi ? "Europe/Paris (Pháp CET)" : "Europe/Paris (France CET)"}</option>
            <option value="America/New_York">America/New_York (US Eastern)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (US Pacific)</option>
            <option value="UTC">{isVi ? "UTC (Giờ chuẩn quốc tế)" : "UTC (Universal Standard Time)"}</option>
          </select>
        </label>
        <label className="text-xs font-bold">{isVi ? "Giờ nhận thông báo" : "Local time"}<input type="time" value={preference.local_send_time.slice(0, 5)} onChange={event => setPreference(value => ({ ...value, local_send_time: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] bg-white px-3 text-sm"/></label>
        <label className="text-xs font-bold">{isVi ? "Tần suất" : "Frequency"}<select value={preference.frequency} onChange={event => setPreference(value => ({ ...value, frequency: event.target.value as Preference["frequency"] }))} className="mt-1 min-h-10 w-full rounded-lg border border-[#d5dacd] bg-white px-3"><option value="daily">{isVi ? "Hằng ngày" : "Daily"}</option><option value="weekdays">{isVi ? "Các ngày trong tuần" : "Weekdays"}</option><option value="weekly">{isVi ? "Hằng tuần" : "Weekly"}</option></select></label>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={preference.opted_in} onChange={event => setPreference(value => ({ ...value, opted_in: event.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-900"/><span>{isVi ? "Bật email nhắc nhở hành trình nhẹ nhàng." : "Enable optional generic journey reminder emails."}</span></label>
      {preference.opted_in && !consent && !preference.paused && <label className="mt-2 flex items-start gap-2 text-xs text-[#53685e]"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/><span>{isVi ? "Tôi đồng ý nhận email nhắc nhở theo lịch đã chọn. Tôi có thể tạm dừng hoặc hủy đăng ký bất cứ lúc nào." : "I consent to receive the generic reminder at the schedule above. I can pause or unsubscribe anytime."}</span></label>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void act("save")} className="min-h-10 rounded-xl bg-[#183d36] px-4 text-sm font-extrabold text-white disabled:opacity-50">{isVi ? "Lưu cài đặt" : "Save preference"}</button>
        {preference.opted_in && <button type="button" disabled={busy} onClick={() => void act(preference.paused ? "resume" : "pause")} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#bdcbb7] bg-white px-3 text-sm font-bold disabled:opacity-50">{preference.paused ? <Play className="h-4 w-4"/> : <Pause className="h-4 w-4"/>}{preference.paused ? (isVi ? "Tiếp tục" : "Resume") : (isVi ? "Tạm dừng" : "Pause")}</button>}
        {preference.opted_in && <button type="button" disabled={busy} onClick={() => void act("unsubscribe")} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-rose-300 bg-white px-3 text-sm font-bold text-rose-900 disabled:opacity-50"><X className="h-4 w-4"/>{isVi ? "Hủy đăng ký" : "Unsubscribe"}</button>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}{message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
      <div className="mt-5"><h3 className="text-sm font-extrabold">{isVi ? "Lịch sử gửi gần đây" : "Recent delivery history"}</h3>{deliveries.length ? <ul className="mt-2 space-y-1">{deliveries.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"><span>{item.local_date} · {item.state}</span><span className="text-[#657469]">{new Date(item.scheduled_at).toLocaleString()}</span></li>)}</ul> : <p className="mt-2 text-xs text-[#657469]">{isVi ? "Chưa có lượt gửi email nào." : "No reminder deliveries yet."}</p>}</div>
    </>}
  </section>;
}
