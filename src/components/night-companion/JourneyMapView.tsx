'use client';

import { useState, useEffect } from 'react';
import { Moon, Lock, CheckCircle2, Sparkles, ArrowRight, X, Mail, RefreshCw, Volume2, ShieldCheck, Clock } from 'lucide-react';
import { JOURNEY_NIGHTS, JourneyNight, getNightOneCtaInfo } from '@/lib/night-companion-map';
import type { NightProfile } from '@/lib/night-companion';
import { trackNightFunnel } from '@/lib/night-companion-analytics';
import { TimezoneReminderCard } from './TimezoneReminderCard';
import { detectBrowserTimezone } from '@/lib/night-companion-timezone';

const WAITLIST_STORAGE_KEY = 'mindful_haven_night_waitlist_registered';
const SAVED_TIMEZONE_KEY = 'mindful_haven_saved_timezone';

type Props = {
  profile: NightProfile | null;
  stage: string;
  hasReview: boolean;
  onSelectNight: (nightNumber: number) => void;
  onResetTest?: () => void;
};

export function JourneyMapView({ profile, stage, hasReview, onSelectNight, onResetTest }: Props) {
  const [selectedPreviewNight, setSelectedPreviewNight] = useState<JourneyNight | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SAVED_TIMEZONE_KEY);
        if (saved) return saved;
      } catch {}
      return detectBrowserTimezone() || 'Asia/Ho_Chi_Minh';
    }
    return 'Asia/Ho_Chi_Minh';
  });
  const [savedTz, setSavedTz] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(SAVED_TIMEZONE_KEY) || undefined;
      } catch {}
    }
    return undefined;
  });
  const [bedtime, setBedtime] = useState(profile?.operational_setup?.desired_bedtime || '23:00');
  const [reminderConsent, setReminderConsent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyWaitlisted, setIsAlreadyWaitlisted] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(WAITLIST_STORAGE_KEY) === 'true';
      } catch {}
    }
    return false;
  });
  const [submissionResult, setSubmissionResult] = useState<{
    waitlist_id?: string;
    reminder_status?: string;
    reminder_time?: string;
    provider_configured?: boolean;
    missing_config?: string[];
    manage_token?: string;
  } | null>(null);

  const ctaInfo = getNightOneCtaInfo(stage, hasReview);

  useEffect(() => {
    trackNightFunnel('journey_map_viewed', {
      night_1_cta_status: ctaInfo.status,
      has_profile: Boolean(profile),
      primary_pattern: profile?.quiz_result?.primary_pattern || 'none',
    }, {
      night_profile_id: profile?.profile_id,
    });
  }, [ctaInfo.status, profile]);

  const handleTimezoneChange = (newTz: string) => {
    setTimezone(newTz);
    try {
      localStorage.setItem(SAVED_TIMEZONE_KEY, newTz);
      setSavedTz(newTz);
    } catch {}
  };

  const handleNightCardClick = (night: JourneyNight) => {
    trackNightFunnel('journey_night_clicked', {
      clicked_night: night.night_number,
      night_title: night.title_en,
      is_free: night.is_free,
      status: night.status,
    }, {
      night_profile_id: profile?.profile_id,
    });

    if (night.night_number === 1) {
      onSelectNight(1);
    } else {
      setSelectedPreviewNight(night);
      setEmailStatus('idle');
      setErrorMessage('');
      setSubmissionResult(null);
      trackNightFunnel('waitlist_form_viewed', {
        clicked_night: night.night_number,
      }, {
        night_profile_id: profile?.profile_id,
      });
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedPreviewNight) return;

    setEmailStatus('submitting');
    setErrorMessage('');

    trackNightFunnel('waitlist_submit_attempted', {
      clicked_night: selectedPreviewNight.night_number,
      has_reminder_consent: reminderConsent,
      timezone,
      bedtime,
    }, {
      night_profile_id: profile?.profile_id,
    });

    try {
      const res = await fetch('/api/night-companion/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          clicked_night: selectedPreviewNight.night_number,
          waitlist_night2_consent: true,
          night1_reminder_consent: reminderConsent,
          bedtime,
          timezone,
          profile_id: profile?.profile_id || '',
          source: 'journey_map',
        }),
      });

      const data = await res.json() as {
        ok: boolean;
        waitlist_id?: string;
        reminder_status?: string;
        reminder_time?: string;
        provider_configured?: boolean;
        missing_config?: string[];
        manage_token?: string;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(
          data.error === 'INVALID_EMAIL'
            ? 'Please enter a valid email address.'
            : data.error === 'TIMEZONE_REQUIRED'
            ? 'Please select your timezone.'
            : 'Could not save registration. Please try again.'
        );
      }

      setSubmissionResult({
        waitlist_id: data.waitlist_id,
        reminder_status: data.reminder_status,
        reminder_time: data.reminder_time,
        provider_configured: data.provider_configured,
        missing_config: data.missing_config,
        manage_token: data.manage_token,
      });

      setEmailStatus('success');
      setIsAlreadyWaitlisted(true);
      try {
        localStorage.setItem(WAITLIST_STORAGE_KEY, 'true');
        localStorage.setItem(SAVED_TIMEZONE_KEY, timezone);
      } catch {}

      trackNightFunnel('waitlist_signup_succeeded', {
        clicked_night: selectedPreviewNight.night_number,
        waitlist_id: data.waitlist_id || '',
        reminder_status: data.reminder_status || 'none',
        has_reminder_consent: reminderConsent,
      }, {
        night_profile_id: profile?.profile_id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please retry.';
      setErrorMessage(msg);
      setEmailStatus('error');
      trackNightFunnel('waitlist_signup_failed', {
        clicked_night: selectedPreviewNight.night_number,
        error_message: msg,
      }, {
        night_profile_id: profile?.profile_id,
      });
    }
  };

  const night1 = JOURNEY_NIGHTS[0];
  const upcomingNights = JOURNEY_NIGHTS.slice(1);

  return (
    <section className="mx-auto w-full max-w-2xl px-3 py-4 sm:py-6">
      {/* Header — compact, single-screen friendly */}
      <div className="rounded-2xl border border-teal-900/60 bg-[#0c1222] p-4 shadow-xl sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-teal-300">
            <Moon className="h-3.5 w-3.5" />
            <span>MINDFUL HAVEN · 7-NIGHT JOURNEY</span>
          </div>
          {isAlreadyWaitlisted && (
            <span className="rounded-full border border-teal-500/40 bg-teal-950/60 px-2 py-0.5 text-[10px] font-bold text-teal-300">
              Waitlist Joined
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h1 className="text-xl sm:text-2xl font-black text-white">
            7-Night Gentle Sleep Path
          </h1>
          <p className="text-xs text-slate-400">
            One night at a time · Self-paced
          </p>
        </div>

        {/* Saved profile summary */}
        {profile && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-900/50 bg-[#080b15] px-3 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Pattern:</span>
              <span className="font-bold text-teal-200">
                {profile.quiz_result.primary_pattern.replace(/_/g, ' ')}
              </span>
            </div>
            {profile.operational_setup.desired_bedtime && (
              <div className="text-slate-400 text-[11px]">
                Target: <span className="font-medium text-slate-200">{profile.operational_setup.desired_bedtime}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Night 1 Hero Card — prominent & actionable */}
      <div
        onClick={() => handleNightCardClick(night1)}
        className="group relative mt-3 cursor-pointer rounded-2xl border border-teal-500/70 bg-gradient-to-br from-[#0c182b] to-[#0a1222] p-4 shadow-lg shadow-teal-950/30 transition hover:border-teal-400"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-400 text-xs font-black text-slate-950">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Night 1
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/50 bg-teal-950/60 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Free · Available
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {night1.title_en}
              </h3>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          {night1.description_en}
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectNight(1);
            }}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-teal-200"
          >
            <span>{ctaInfo.label_en}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Nights 2–7 Overview Grid — 2-column compact layout */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Upcoming Nights (2–7)
          </span>
          <span className="text-[10px] text-slate-500">
            Tap any night to preview
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {upcomingNights.map((night) => (
            <div
              key={night.night_number}
              onClick={() => handleNightCardClick(night)}
              className="group cursor-pointer rounded-xl border border-indigo-950/70 bg-[#0a0f1d]/80 p-2.5 transition hover:border-indigo-800/80 hover:bg-[#0c1326] flex items-center gap-2.5"
            >
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-indigo-800 bg-indigo-950/60 text-xs font-bold text-slate-400 group-hover:text-slate-200">
                {night.night_number}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-teal-200">
                    {night.title_en}
                  </h4>
                  <Lock className="h-3 w-3 text-indigo-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                  {night.description_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset test session button for testing */}
      {process.env.NODE_ENV !== 'production' && onResetTest && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onResetTest}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-800/50 px-2.5 py-1 text-[10px] font-medium text-amber-300 transition hover:bg-amber-950/30"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Reset local test profile</span>
          </button>
        </div>
      )}

      {/* Night 2–7 Preview & Email Waitlist Modal — compact & fits in 1 screen */}
      {selectedPreviewNight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-teal-900/60 bg-[#0c1222] p-4 shadow-2xl sm:p-5">
            <button
              type="button"
              onClick={() => setSelectedPreviewNight(null)}
              className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg border border-indigo-900 bg-[#080b15] text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300">
              <Lock className="h-3 w-3" />
              <span>Night {selectedPreviewNight.night_number} · In preparation</span>
            </div>

            <h3 className="mt-1 text-lg font-bold text-white">
              {selectedPreviewNight.title_en}
            </h3>

            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {selectedPreviewNight.preview_focus_en}
            </p>

            {/* Notification Notice */}
            <div className="my-2.5 flex items-center gap-2 rounded-xl border border-indigo-900/60 bg-[#080b15] px-3 py-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" />
              <div className="text-[11px] leading-tight">
                <span className="font-semibold text-white">Get notified when Night {selectedPreviewNight.night_number} opens</span>
                <span className="block text-slate-400 text-[10px]">Free notification · No spam · Unsubscribe anytime</span>
              </div>
            </div>

            {emailStatus === 'success' ? (
              <div className="rounded-xl border border-teal-500/50 bg-teal-950/40 p-4 text-center space-y-2.5">
                <CheckCircle2 className="mx-auto h-7 w-7 text-teal-300" />
                <h4 className="text-sm font-bold text-white">
                  You’re on the waitlist
                </h4>
                <p className="text-xs text-slate-300 leading-normal">
                  We’ll notify you when Night {selectedPreviewNight.night_number} is ready. You can replay Night 1 anytime.
                </p>

                {reminderConsent && (
                  <div className="rounded-lg border border-indigo-900 bg-[#080b15] p-2.5 text-left text-xs text-slate-300 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-teal-300 text-[11px]">
                      <Clock className="h-3 w-3" />
                      <span>Night 1 Reminder Registered</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Scheduled for 30 min before bed ({submissionResult?.reminder_time || '22:30'}).
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewNight(null);
                    onSelectNight(1);
                  }}
                  className="mt-1 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-teal-300 px-3 py-2 text-xs font-bold text-slate-950"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Replay Night 1 now</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-2.5">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-10 w-full rounded-xl border border-indigo-800 bg-[#080b15] pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-300"
                    />
                  </div>
                </div>

                {/* Timezone & Bedtime Reminder Card */}
                <TimezoneReminderCard
                  timezone={timezone}
                  onTimezoneChange={handleTimezoneChange}
                  bedtime={bedtime}
                  onBedtimeChange={setBedtime}
                  reminderConsent={reminderConsent}
                  onReminderConsentChange={setReminderConsent}
                  savedTimezone={savedTz}
                  disabled={emailStatus === 'submitting'}
                />

                {errorMessage && (
                  <p className="text-xs text-rose-300">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={emailStatus === 'submitting'}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 px-4 text-xs font-bold text-slate-950 disabled:opacity-50"
                >
                  <span>{emailStatus === 'submitting' ? 'Saving...' : 'Notify me'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
