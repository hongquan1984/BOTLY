'use client';

import { useState, useEffect, useMemo } from 'react';
import { Globe, Clock, Search, X, Check, AlertCircle } from 'lucide-react';
import {
  detectBrowserTimezone,
  formatTimezoneDisplay,
  searchTimezones,
  calculateReminderTime,
} from '@/lib/night-companion-timezone';

interface Props {
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  bedtime: string;
  onBedtimeChange: (bedtime: string) => void;
  reminderConsent: boolean;
  onReminderConsentChange: (consent: boolean) => void;
  savedTimezone?: string;
  disabled?: boolean;
}

export function TimezoneReminderCard({
  timezone,
  onTimezoneChange,
  bedtime,
  onBedtimeChange,
  reminderConsent,
  onReminderConsentChange,
  savedTimezone,
  disabled = false,
}: Props) {
  const [isSearchingTz, setIsSearchingTz] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempBedtime, setTempBedtime] = useState(bedtime || '23:00');
  const [timezoneMismatchPrompt, setTimezoneMismatchPrompt] = useState<{
    detected: string;
    saved: string;
  } | null>(null);

  // Auto-detect browser timezone on mount if not yet selected
  useEffect(() => {
    const detected = detectBrowserTimezone();
    if (!detected) return;

    if (!timezone) {
      onTimezoneChange(detected);
      return;
    }

    // Check if browser timezone differs from saved choice
    if (savedTimezone && savedTimezone !== detected && timezone === savedTimezone) {
      const timer = window.setTimeout(() => {
        setTimezoneMismatchPrompt({
          detected,
          saved: savedTimezone,
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [savedTimezone, timezone, onTimezoneChange]);

  const timezoneInfo = useMemo(() => {
    return formatTimezoneDisplay(timezone || 'Asia/Ho_Chi_Minh');
  }, [timezone]);

  const { reminder_time, is_previous_day } = useMemo(() => {
    return calculateReminderTime(bedtime || '23:00');
  }, [bedtime]);

  const searchResults = useMemo(() => {
    return searchTimezones(searchQuery);
  }, [searchQuery]);

  const handleApplyBedtime = () => {
    if (/^\d{1,2}:\d{2}$/.test(tempBedtime)) {
      onBedtimeChange(tempBedtime);
    }
    setIsEditingTime(false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-indigo-900/60 bg-[#070b16] p-2.5 text-xs text-slate-300">
      {/* Timezone mismatch alert prompt */}
      {timezoneMismatchPrompt && (
        <div className="rounded-lg border border-amber-600/60 bg-amber-950/40 p-2.5 text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-xs">
                Browser timezone differs from saved location
              </p>
              <p className="text-[11px] text-amber-300/80">
                Detected: {timezoneMismatchPrompt.detected} (Saved: {timezoneMismatchPrompt.saved}). Update?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onTimezoneChange(timezoneMismatchPrompt.detected);
                    setTimezoneMismatchPrompt(null);
                  }}
                  className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-amber-300"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setTimezoneMismatchPrompt(null)}
                  className="rounded border border-amber-600/70 px-2 py-0.5 text-[10px] font-medium text-amber-200 hover:bg-amber-900/40"
                >
                  Keep current
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bedtime & Timezone 2-column compact row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Bedtime */}
        <div className="rounded-lg border border-indigo-950 bg-[#0a0f20] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Bedtime</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  setTempBedtime(bedtime || '23:00');
                  setIsEditingTime(!isEditingTime);
                }}
                className="text-[10px] font-semibold text-teal-400 hover:text-teal-300"
              >
                {isEditingTime ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          {isEditingTime ? (
            <div className="mt-1 flex items-center gap-1.5">
              <input
                type="time"
                value={tempBedtime}
                onChange={(e) => setTempBedtime(e.target.value)}
                className="rounded border border-indigo-700 bg-[#070b16] px-1.5 py-0.5 text-xs text-white outline-none focus:border-teal-400"
              />
              <button
                type="button"
                onClick={handleApplyBedtime}
                className="rounded bg-teal-400 px-2 py-0.5 text-[11px] font-bold text-slate-950"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="mt-0.5 flex items-center gap-1.5 font-bold text-white text-sm">
              <Clock className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span>{bedtime || '23:00'}</span>
            </div>
          )}
        </div>

        {/* Timezone */}
        <div className="rounded-lg border border-indigo-950 bg-[#0a0f20] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Timezone</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => setIsSearchingTz(true)}
                className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200"
              >
                Change
              </button>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-200 truncate" title={timezoneInfo.iana}>
            <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{timezoneInfo.friendly_name}</span>
          </div>
        </div>
      </div>

      {/* Reminder timing row */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span>
          Estimated reminder: <strong className="text-teal-300">{reminder_time}</strong> {is_previous_day ? '(previous evening)' : 'local time'}
        </span>
      </div>

      {/* Choice B: Opt-in Checkbox for Bedtime Reminders */}
      <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-indigo-900/50 bg-[#0c1224] px-2.5 py-2 transition hover:border-teal-500/50">
        <input
          type="checkbox"
          checked={reminderConsent}
          onChange={(e) => onReminderConsentChange(e.target.checked)}
          disabled={disabled}
          className="h-3.5 w-3.5 rounded border-indigo-700 bg-slate-900 text-teal-400 focus:ring-teal-400"
        />
        <span className="text-[11px] text-slate-200 leading-tight">
          Remind me to replay Night 1 30 min before bed, for 7 days <span className="text-teal-300 font-semibold">(Free)</span>
        </span>
      </label>

      {/* Timezone Search & Select Modal */}
      {isSearchingTz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-indigo-800 bg-[#0d1326] p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-indigo-900">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-teal-400" />
                <span>Choose Timezone / City</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsSearchingTz(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-2.5">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (London, New York, Tokyo...)"
                autoFocus
                className="w-full rounded-xl border border-indigo-800 bg-[#070b16] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
              />
            </div>

            {/* List of Timezones */}
            <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1 divide-y divide-indigo-950/60 pr-1">
              {searchResults.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-500">
                  No timezone found
                </p>
              ) : (
                searchResults.map((tz) => {
                  const isSelected = tz.iana.toLowerCase() === (timezone || '').toLowerCase();
                  return (
                    <button
                      key={tz.iana}
                      type="button"
                      onClick={() => {
                        onTimezoneChange(tz.iana);
                        setIsSearchingTz(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg transition ${
                        isSelected
                          ? 'bg-teal-950/60 text-teal-300 font-bold'
                          : 'text-slate-300 hover:bg-indigo-900/30'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs">{tz.label_en}</div>
                        <div className="text-[10px] text-slate-500">{tz.iana}</div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
