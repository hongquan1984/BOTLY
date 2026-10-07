'use client';

import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

export type FunnelIds = {
  visitor_id?: string;
  quiz_attempt_id?: string;
  night_profile_id?: string;
  night_session_id?: string;
  playback_session_id?: string;
};

const QUIZ_ATTEMPT_KEY = 'mindful_haven_quiz_attempt_id';
const NIGHT_SESSION_KEY = 'mindful_haven_night_session_id';

export function getOrCreateQuizAttemptId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(QUIZ_ATTEMPT_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? 'qa_' + crypto.randomUUID().replace(/-/g, '')
        : 'qa_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(QUIZ_ATTEMPT_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function resetQuizAttemptId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? 'qa_' + crypto.randomUUID().replace(/-/g, '')
      : 'qa_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(QUIZ_ATTEMPT_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export function getOrCreateNightSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(NIGHT_SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? 'ns_' + crypto.randomUUID().replace(/-/g, '')
        : 'ns_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(NIGHT_SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function createPlaybackSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? 'ps_' + crypto.randomUUID().replace(/-/g, '')
    : 'ps_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Sanitized funnel tracker
export function trackNightFunnel(
  eventName: string,
  data: Record<string, unknown> = {},
  ids: FunnelIds = {}
) {
  if (typeof window === 'undefined') return;

  const quizAttemptId = ids.quiz_attempt_id || getOrCreateQuizAttemptId();
  const nightSessionId = ids.night_session_id || getOrCreateNightSessionId();

  // Clean and ensure NO tokens, passwords, raw free-text thoughts, or emails exist in analytics
  const safeData = { ...data };
  delete safeData.access_token;
  delete safeData.token;
  delete safeData.email;
  delete safeData.raw_note;
  delete safeData.module_note;
  delete safeData.thought;
  delete safeData.unrecorded_thought;

  trackClientEvent(eventName, {
    metadata: {
      funnel: 'night_companion_7nights',
      quiz_attempt_id: quizAttemptId,
      night_profile_id: ids.night_profile_id || '',
      night_session_id: nightSessionId,
      playback_session_id: ids.playback_session_id || '',
      ...safeData,
    },
  });
}

/**
 * High-precision wall-clock listening tracker.
 * Solves: seeking to end does NOT count as listening; simultaneous tracks count once.
 * Distinguishes intro duration from guided breathing practice so intro never inflates breathing coverage.
 */
export class ListeningAccumulator {
  private playbackSessionId: string;
  private nightProfileId: string;
  private voiceDurationSeconds: number;

  private totalSecondsListened = 0;
  private introSeconds = 0;
  private voiceSeconds = 0;
  private pacerSeconds = 0;
  private backgroundSeconds = 0;

  private voiceIntervals: Array<[number, number]> = []; // for unique coverage of guided breathing
  private lastTick = 0;
  private heartbeatInterval: number | null = null;
  private isIntroPlaying = false;
  private isVoicePlaying = false;
  private isPacerPlaying = false;
  private isBackgroundPlaying = false;
  private lastVoiceCurrentTime = 0;

  constructor(
    playbackSessionId: string,
    nightProfileId = '',
    voiceDurationSeconds = 0
  ) {
    this.playbackSessionId = playbackSessionId;
    this.nightProfileId = nightProfileId;
    this.voiceDurationSeconds = voiceDurationSeconds;
  }

  public start() {
    this.lastTick = Date.now();
    this.startHeartbeat();
    trackNightFunnel('audio_started', {
      total_seconds_listened: 0,
      voice_duration_seconds: this.voiceDurationSeconds,
    }, {
      playback_session_id: this.playbackSessionId,
      night_profile_id: this.nightProfileId,
    });
  }

  public updateState(
    isVoicePlaying: boolean,
    isBackgroundPlaying: boolean,
    voiceCurrentTime = 0,
    isIntroPlaying = false,
    isPacerPlaying = false
  ) {
    const now = Date.now();
    if (this.lastTick > 0) {
      const elapsedSeconds = Math.min(3, Math.max(0, (now - this.lastTick) / 1000));

      if (this.isIntroPlaying || this.isVoicePlaying || this.isPacerPlaying || this.isBackgroundPlaying) {
        this.totalSecondsListened += elapsedSeconds;
      }
      if (this.isIntroPlaying) {
        this.introSeconds += elapsedSeconds;
      }
      if (this.isVoicePlaying) {
        this.voiceSeconds += elapsedSeconds;
        // Track unique coverage interval for guided breathing only
        if (voiceCurrentTime > 0 && Math.abs(voiceCurrentTime - this.lastVoiceCurrentTime) <= 3) {
          const start = Math.min(this.lastVoiceCurrentTime, voiceCurrentTime);
          const end = Math.max(this.lastVoiceCurrentTime, voiceCurrentTime);
          this.addCoverageInterval(start, end);
        }
      }
      if (this.isPacerPlaying) {
        this.pacerSeconds += elapsedSeconds;
      }
      if (this.isBackgroundPlaying) {
        this.backgroundSeconds += elapsedSeconds;
      }
    }

    this.lastTick = now;
    this.isIntroPlaying = isIntroPlaying;
    this.isVoicePlaying = isVoicePlaying;
    this.isPacerPlaying = isPacerPlaying;
    this.isBackgroundPlaying = isBackgroundPlaying;
    this.lastVoiceCurrentTime = voiceCurrentTime;
  }

  private addCoverageInterval(start: number, end: number) {
    if (end <= start) return;
    this.voiceIntervals.push([start, end]);
    // Merge overlapping intervals
    this.voiceIntervals.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const interval of this.voiceIntervals) {
      if (!merged.length) {
        merged.push(interval);
      } else {
        const last = merged[merged.length - 1];
        if (interval[0] <= last[1]) {
          last[1] = Math.max(last[1], interval[1]);
        } else {
          merged.push(interval);
        }
      }
    }
    this.voiceIntervals = merged;
  }

  public getVoiceCoveragePct(): number {
    if (!this.voiceDurationSeconds || this.voiceDurationSeconds <= 0) return 0;
    const coveredSeconds = this.voiceIntervals.reduce((acc, [s, e]) => acc + (e - s), 0);
    return Math.min(100, Math.round((coveredSeconds / this.voiceDurationSeconds) * 100));
  }

  public getStats() {
    return {
      total_seconds_listened: Math.round(this.totalSecondsListened),
      intro_seconds: Math.round(this.introSeconds),
      guided_seconds: Math.round(this.voiceSeconds),
      voice_seconds: Math.round(this.voiceSeconds), // backward compatibility
      pacer_seconds: Math.round(this.pacerSeconds),
      background_seconds: Math.round(this.backgroundSeconds),
      voice_coverage_pct: this.getVoiceCoveragePct(),
    };
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isIntroPlaying || this.isVoicePlaying || this.isPacerPlaying || this.isBackgroundPlaying) {
        this.emitEvent('audio_progress');
      }
    }, 30000);
  }

  public trackIntroStarted(introId: string) {
    this.emitEvent('audio_intro_started', { intro_id: introId });
  }

  public trackIntroSkipped(introId: string, elapsedSeconds: number) {
    this.emitEvent('audio_intro_skipped', {
      intro_id: introId,
      elapsed_seconds: Math.round(elapsedSeconds),
    });
  }

  public trackIntroEnded(introId: string) {
    this.emitEvent('audio_intro_ended', { intro_id: introId });
  }

  public trackGuidedPracticeStarted(voiceId: string) {
    this.emitEvent('audio_guided_started', { voice_id: voiceId });
  }

  public trackPacerStarted(voiceId: string) {
    this.emitEvent('audio_pacer_started', { voice_id: voiceId });
  }

  public trackBackgroundOnlyStarted(soundIds: string[]) {
    this.emitEvent('audio_background_only_started', { sound_ids: soundIds });
  }

  public pause() {
    this.updateState(false, false, 0, false, false);
    this.emitEvent('audio_paused');
  }

  public resume() {
    this.lastTick = Date.now();
    this.emitEvent('audio_resumed');
  }

  public trackEnded(kind: 'intro' | 'voice' | 'pacer' | 'background') {
    this.emitEvent('audio_track_ended', { track_kind: kind });
  }

  public stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.updateState(false, false, 0, false, false);
    this.emitEvent('audio_stopped');
  }

  private emitEvent(eventName: string, extra: Record<string, unknown> = {}) {
    trackNightFunnel(eventName, {
      ...this.getStats(),
      ...extra,
    }, {
      playback_session_id: this.playbackSessionId,
      night_profile_id: this.nightProfileId,
    });
  }
}
