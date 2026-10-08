'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronUp, Lock, Moon, Sparkles, Wind } from 'lucide-react';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';
import { buildNightPatternResult, type NightPatternAnswers } from '@/lib/night-pattern';
import { getRecommendations, type Recommendation } from '@/lib/recommendations';
import { getOrCreateQuizAttemptId } from '@/lib/night-companion-analytics';
import { BilingualLine } from '@/lib/night-companion-i18n';
import { JOURNEY_PREVIEW_NIGHTS } from '@/lib/night-companion-map';
import { NightCompanionFlow } from '@/components/night-companion/NightCompanionFlow';
import { CompactResultScreen } from './CompactResultScreen';

const APP_STORE_URL = 'https://apps.apple.com/vn/app/soulscape-meditation-emotion/id6769265902';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.soulscape.world&pcampaignid=web_share';
type AnswerKey = keyof NightPatternAnswers;
const initialAnswers: NightPatternAnswers = { gender: '', ageGroup: '', issues: [], frequency: '', duration: '', sleepHours: '', bedtimeTension: '', racingThoughts: '', sleepSupport: '', concerns: [], primaryGoal: '' };
const intentLabels: Record<string, string> = { overthinking: 'overthinking', 'racing-thoughts': 'racing thoughts', insomnia: 'sleep difficulty', '2am': 'waking during the night', stress: 'nighttime stress', 'bedtime-procrastination': 'bedtime procrastination' };
const issueOptions = [['difficulty_falling_asleep', 'I struggle to fall asleep'], ['racing_mind', "I can't stop thinking"], ['night_waking', 'I wake up during the night'], ['sleep_anxiety', 'I feel anxious about sleep'], ['phone_use', 'I stay on my phone too long'], ['inconsistent_routine', 'My sleep schedule is inconsistent'], ['stress_carryover', 'Stress follows me into bed'], ['bedtime_procrastination', 'I keep delaying bedtime'], ['other', 'Other']] as const;
const QUIZ_DRAFT_KEY = 'mindful_haven_night_pattern_quiz_draft';

const SCREEN_QUESTION_MAP: Record<number, { id: string; title: string }> = {
  1: { id: 'gender', title: 'Gender identity' },
  2: { id: 'issues', title: 'Main sleep issues' },
  3: { id: 'frequency', title: 'Frequency per week' },
  4: { id: 'duration', title: 'Duration of issue' },
  5: { id: 'age_group', title: 'Age range' },
  6: { id: 'insight_1', title: 'Insight: Pattern emerging' },
  7: { id: 'sleep_hours', title: 'Average sleep hours' },
  8: { id: 'insight_2', title: 'Insight: Sleep variations' },
  9: { id: 'bedtime_tension', title: 'Bedtime tension level' },
  10: { id: 'racing_thoughts', title: 'Racing thoughts level' },
  11: { id: 'insight_3', title: 'Insight: Sleep effort loop' },
  12: { id: 'sleep_support', title: 'Current sleep support' },
  13: { id: 'concerns', title: 'Support concerns' },
  14: { id: 'insight_4', title: 'Insight: Starting plan' },
  15: { id: 'primary_goal', title: 'Primary sleep goal' },
};

export function InsomniaQuizFunnel() {
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<NightPatternAnswers>(initialAnswers);
  const [sourceIntent, setSourceIntent] = useState('');
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [buildProgress, setBuildProgress] = useState(0);
  const [showNightCompanion, setShowNightCompanion] = useState(false);
  const [quizHydrated, setQuizHydrated] = useState(false);
  const result = useMemo(() => buildNightPatternResult(answers, sourceIntent), [answers, sourceIntent]);
  const recommendations = useMemo(() => getRecommendations(result, platform), [result, platform]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(QUIZ_DRAFT_KEY) || 'null') as { screen?: number; answers?: NightPatternAnswers; sourceIntent?: string; locale?: 'en' | 'vi'; platform?: 'ios' | 'android' | 'desktop'; showNightCompanion?: boolean } | null;
        if (saved?.answers) setAnswers({ ...initialAnswers, ...saved.answers });
        if (typeof saved?.screen === 'number') setScreen(Math.max(0, Math.min(17, saved.screen)));
        if (typeof saved?.sourceIntent === 'string') setSourceIntent(saved.sourceIntent);
        if (saved?.locale === 'en' || saved?.locale === 'vi') setLocale(saved.locale);
        if (saved?.platform === 'ios' || saved?.platform === 'android' || saved?.platform === 'desktop') setPlatform(saved.platform);
        if (saved?.showNightCompanion) setShowNightCompanion(true);
      } catch { /* an unavailable draft must not block the quiz */ }
      setQuizHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!quizHydrated) return;
    try { localStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify({ screen, answers, sourceIntent, locale, platform, showNightCompanion })); } catch { /* an unavailable draft must not block the quiz */ }
  }, [quizHydrated, screen, answers, sourceIntent, locale, platform, showNightCompanion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get('intent') || '';
    const lang = params.get('lang') === 'vi' ? 'vi' : 'en';
    const ua = navigator.userAgent || '';
    const initialPlatform = /iPad|iPhone|iPod/.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
    window.setTimeout(() => { setSourceIntent(intent); setLocale(lang); setPlatform(initialPlatform); }, 0);
    const attribution = { source_intent: intent || 'direct', utm_source: params.get('utm_source') || 'direct', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '', utm_content: params.get('utm_content') || '' };
    trackClientEvent('quiz_view', { locale: lang, metadata: { funnel: 'night_pattern', ...attribution } });
    trackClientEvent('page_view', { locale: lang, metadata: { funnel: 'quiz_insomnia', ...attribution } });
  }, []);

  useEffect(() => {
    if (screen !== 16) return;
    const timers = [window.setTimeout(() => setBuildProgress(10), 0), ...[650, 1300, 1950].map((delay, index) => window.setTimeout(() => setBuildProgress([35, 60, 82][index]), delay))];
    timers.push(window.setTimeout(() => setBuildProgress(100), 2600));
    timers.push(window.setTimeout(() => {
      setScreen(17);
      const attemptId = getOrCreateQuizAttemptId();
      trackClientEvent('quiz_complete', { locale, metadata: { funnel: 'night_pattern', quiz_attempt_id: attemptId, ...result } });
      trackClientEvent('quiz_completed', { locale, metadata: { funnel: 'quiz_insomnia', quiz_attempt_id: attemptId, night_pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern, primary_goal: result.primary_goal } });
      trackClientEvent('result_view', { locale, metadata: { funnel: 'night_pattern', quiz_attempt_id: attemptId, primary_pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern, source_intent: sourceIntent } });
      trackClientEvent('result_viewed', { locale, metadata: { funnel: 'quiz_insomnia', quiz_attempt_id: attemptId, primary_pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern, source_intent: sourceIntent } });
      trackClientEvent('primary_pattern', { locale, metadata: { funnel: 'night_pattern', pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern } });
      for (const recommendation of recommendations) trackClientEvent('recommendation_impression', { locale, metadata: { funnel: 'night_pattern', night_pattern: result.primary_pattern, solution_id: recommendation.id, provider_id: recommendation.provider?.id || '', recommendation_position: recommendation.position, relationship: recommendation.provider?.relationship || '', source_intent: sourceIntent, ...getQueryAttribution() } });
    }, 3200));
    return () => timers.forEach(window.clearTimeout);
  }, [screen, locale, result, recommendations, sourceIntent]);

  useEffect(() => {
    if (screen >= 1 && screen <= 15) {
      const q = SCREEN_QUESTION_MAP[screen];
      trackClientEvent('quiz_question_viewed', {
        locale,
        metadata: {
          funnel: 'quiz_insomnia',
          question_index: screen,
          question_id: q?.id || `screen_${screen}`,
          question_title: q?.title || '',
          quiz_attempt_id: getOrCreateQuizAttemptId(),
          source_intent: sourceIntent || 'direct',
        },
      });
    }
  }, [screen, locale, sourceIntent]);

  const handleStartQuiz = (location: 'hero' | 'preview_night_1' = 'hero') => {
    const attemptId = getOrCreateQuizAttemptId();
    trackClientEvent('quiz_start', {
      locale,
      metadata: {
        funnel: 'night_pattern',
        quiz_attempt_id: attemptId,
        source_intent: sourceIntent || 'direct',
        cta_location: location,
      },
    });
    trackClientEvent('quiz_started', {
      locale,
      metadata: {
        funnel: 'quiz_insomnia',
        quiz_attempt_id: attemptId,
        source_intent: sourceIntent || 'direct',
        cta_location: location,
      },
    });
    setScreen(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    if (screen === 0) {
      handleStartQuiz('hero');
      return;
    }
    const attemptId = getOrCreateQuizAttemptId();
    if (screen >= 1 && screen <= 15) {
      trackClientEvent('quiz_step_complete', {
        locale,
        metadata: { funnel: 'night_pattern', quiz_attempt_id: attemptId, step: screen, source_intent: sourceIntent, answers },
      });
      trackClientEvent('quiz_step', {
        locale,
        metadata: { funnel: 'quiz_insomnia', quiz_attempt_id: attemptId, step: screen, source_intent: sourceIntent, answers },
      });
    }
    if ([6, 8, 11].includes(screen)) {
      trackClientEvent('micro_insight_view', { locale, metadata: { funnel: 'night_pattern', insight_step: screen, source_intent: sourceIntent } });
    }
    setScreen(current => Math.min(current + 1, 17));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => { if (screen === 0 || screen === 16 || screen === 17) return; setScreen(current => Math.max(current - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setAnswer = <K extends AnswerKey>(key: K, value: NightPatternAnswers[K], autoAdvance = true) => {
    setAnswers(current => ({ ...current, [key]: value }));
    const q = SCREEN_QUESTION_MAP[screen];
    trackClientEvent('quiz_answer_submitted', {
      locale,
      metadata: {
        funnel: 'quiz_insomnia',
        question_index: screen,
        question_id: q?.id || String(key),
        answer_value: Array.isArray(value) ? value.join(',') : String(value),
        quiz_attempt_id: getOrCreateQuizAttemptId(),
        source_intent: sourceIntent || 'direct',
      },
    });
    if (autoAdvance) window.setTimeout(goNext, 180);
  };
  const submitMultiAnswer = (key: 'issues' | 'concerns') => {
    const q = SCREEN_QUESTION_MAP[screen];
    trackClientEvent('quiz_answer_submitted', {
      locale,
      metadata: {
        funnel: 'quiz_insomnia',
        question_index: screen,
        question_id: q?.id || key,
        answer_value: answers[key].join(','),
        quiz_attempt_id: getOrCreateQuizAttemptId(),
        source_intent: sourceIntent || 'direct',
      },
    });
    goNext();
  };
  const toggleList = (key: 'issues' | 'concerns', value: string) => setAnswers(current => { const list = current[key]; if (value === 'none') return { ...current, [key]: list.includes('none') ? [] : ['none'] }; return { ...current, [key]: list.filter(item => item !== 'none').includes(value) ? list.filter(item => item !== value) : [...list.filter(item => item !== 'none'), value] }; });
  const openStore = (store: 'app_store' | 'google_play') => { const metadata = { funnel: 'night_pattern', store, method: 'start_tonight', primary_pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern, primary_goal: result.primary_goal, source_intent: sourceIntent || 'direct', ...getQueryAttribution() }; trackClientEvent('start_plan_click', { locale, metadata }); trackClientEvent('store_redirect', { locale, metadata }); trackClientEvent('onboarding_app_download_click', { locale, metadata: { ...metadata, source: 'quiz_insomnia' } }); window.open(store === 'app_store' ? APP_STORE_URL : PLAY_STORE_URL, '_blank', 'noopener,noreferrer'); };
  const openRecommendation = (recommendation: Recommendation) => { if (!recommendation.destination_url) return; const metadata = { funnel: 'night_pattern', night_pattern: result.primary_pattern, solution_id: recommendation.id, provider_id: recommendation.provider?.id || '', recommendation_position: recommendation.position, relationship: recommendation.provider?.relationship || '', source_intent: sourceIntent || 'direct', ...getQueryAttribution() }; trackClientEvent('recommendation_click', { locale, metadata }); window.open(recommendation.destination_url, '_blank', 'noopener,noreferrer'); };
  const startNightCompanion = () => {
    setShowNightCompanion(true);
    trackClientEvent('night_1_card_clicked', { locale, metadata: { funnel: 'night_companion_7nights', primary_pattern: result.primary_pattern, quiz_attempt_id: getOrCreateQuizAttemptId(), ...getQueryAttribution() } });
    trackClientEvent('beta_cta_click', { locale, metadata: { funnel: 'night_companion_v1', primary_pattern: result.primary_pattern, source_intent: sourceIntent || 'direct', quiz_attempt_id: getOrCreateQuizAttemptId(), ...getQueryAttribution() } });
    window.setTimeout(() => document.getElementById('night-companion-beta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const startTonight = () => { if (platform === 'ios') return openStore('app_store'); if (platform === 'android') return openStore('google_play'); trackClientEvent('start_plan_click', { locale, metadata: { funnel: 'night_pattern', primary_pattern: result.primary_pattern, primary_goal: result.primary_goal, source_intent: sourceIntent || 'direct', ...getQueryAttribution() } }); window.open(APP_STORE_URL, '_blank', 'noopener,noreferrer'); };
  const intentText = sourceIntent && intentLabels[sourceIntent] ? `You came here looking for help with ${intentLabels[sourceIntent]}. ` : '';
  const progress = screen === 0 || screen === 17 ? 0 : Math.round((screen / 16) * 100);

  return (
    <div className="min-h-screen bg-[#080b15] text-slate-100 selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-indigo-950/60 bg-[#080b15]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={screen === 0 || screen === 16 || screen === 17}
              className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-900/60 bg-indigo-950/50 text-indigo-300 disabled:opacity-50"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-extrabold tracking-[0.16em] text-indigo-200">
              {screen === 0 ? 'MINDFUL HAVEN · NIGHT COMPANION' : 'MINDFUL HAVEN · NIGHT PATTERN'}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {screen > 0 && screen < 17 ? `${progress}%` : ''}
          </span>
        </div>
        {progress > 0 && (
          <div className="h-1 bg-indigo-950/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-teal-300 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>
      <main className={`mx-auto flex min-h-[calc(100vh-60px)] w-full ${screen === 0 ? 'max-w-2xl' : 'max-w-xl'} flex-col px-4 py-6 sm:px-6`}>
        {screen === 0 && <Intro intentText={intentText} onStart={handleStartQuiz} locale={locale} />}
    {screen === 1 && <SingleScreen title="A little context first" question="How would you like to describe yourself?" options={['Woman', 'Man', 'Non-binary', 'Prefer not to say']} value={answers.gender} onSelect={value => setAnswer('gender', value)} />}
    {screen === 2 && <MultiScreen title="Your nights" question="What is getting in the way most often?" options={issueOptions} selected={answers.issues} onToggle={value => toggleList('issues', value)} onContinue={() => submitMultiAnswer('issues')} />}
    {screen === 3 && <SingleScreen title="Your sleep" question="How many nights per week does this usually happen?" options={['1-2 nights', '3-4 nights', '5+ nights']} value={answers.frequency} onSelect={value => setAnswer('frequency', value === '5+ nights' ? '5+' : value.startsWith('3') ? '3-4' : '1-2')} />}
    {screen === 4 && <SingleScreen title="Your sleep" question="How long has this been happening?" options={['Less than 1 month', '1-6 months', '6-12 months', 'More than a year']} value={answers.duration} onSelect={value => setAnswer('duration', value)} />}
    {screen === 5 && <SingleScreen title="Your context" question="Which age range are you in?" options={['18-29', '30-39', '40-49', '50-59', '60+']} value={answers.ageGroup} onSelect={value => setAnswer('ageGroup', value)} />}
    {screen === 6 && <InsightScreen title="We're starting to see your night pattern." body={`Your answers suggest this happens often enough to be worth understanding what drives it. ${intentText}`} onContinue={goNext} continueLabel="Let's look deeper" />}
    {screen === 7 && <SingleScreen title="Your sleep" question="How much actual sleep do you get on an average night?" options={['Less than 5 hours', '5-6 hours', '6-7 hours', '7+ hours but still tired']} value={answers.sleepHours} onSelect={value => setAnswer('sleepHours', value)} />}
    {screen === 8 && <InsightScreen title="Sleep is not a perfect 8-hour score." body="Sleep needs vary. Your pattern, consistency, and how you feel during the day matter too." onContinue={goNext} continueLabel="Continue" />}
    {screen === 9 && <SingleScreen title="Your mind at night" question="How tense or worried do you feel as bedtime approaches?" options={['Not really', 'A little', 'Quite a bit', 'Very tense']} value={answers.bedtimeTension} onSelect={value => setAnswer('bedtimeTension', value.includes('Very') ? 'high' : value.includes('Quite') ? 'moderate' : 'low')} />}
    {screen === 10 && <SingleScreen title="Your mind at night" question="How active does your mind become when you try to sleep?" options={['Quiet enough', 'Some thoughts', 'Busy and hard to switch off', 'Very active / many open loops']} value={answers.racingThoughts} onSelect={value => setAnswer('racingThoughts', value.includes('Very') ? 'high' : value.includes('Busy') ? 'moderate' : 'low')} />}
    {screen === 11 && <InsightScreen title={answers.racingThoughts === 'high' || answers.bedtimeTension === 'high' ? 'You may be caught in a sleep-effort loop.' : 'Your evening pattern is becoming clearer.'} body={answers.racingThoughts === 'high' || answers.bedtimeTension === 'high' ? "When sleep starts to feel like something you must make happen, the pressure itself can make winding down harder. We'll take this into account in your plan." : 'Your biggest obstacle may be happening before you try to sleep. We will use your answers to choose a practical starting point.'} onContinue={goNext} continueLabel="Continue" />}
    {screen === 12 && <SingleScreen title="Personalization" question="What kind of sleep support do you currently use?" options={['None', 'Melatonin', 'Prescription sleep medication', 'Over-the-counter sleep aids', 'Other']} value={answers.sleepSupport} onSelect={value => setAnswer('sleepSupport', value)} />}
    {screen === 13 && <MultiScreen title="Personalization" question="Do any of these concerns feel relevant?" options={[['grogginess', 'Morning grogginess'], ['dependency', 'Dependency concerns'], ['not_working', "It doesn't always work"], ['non_medication', 'I prefer a non-medication routine'], ['none', 'No concerns'], ['other', 'Other']]} selected={answers.concerns} onToggle={value => toggleList('concerns', value)} onContinue={() => submitMultiAnswer('concerns')} />}
    {screen === 14 && <InsightScreen title="Your answers are pointing toward a pattern." body="Several behavioral and mental factors may be affecting how easily you wind down. Let's build a starting plan for tonight." onContinue={goNext} continueLabel="Build my plan" />}
    {screen === 15 && <SingleScreen title="Your goal" question="What would make the biggest difference right now?" options={['Quiet my mind', 'Fall asleep more easily', 'Feel less anxious before bed', 'Stop waking during the night', 'Put my phone down earlier', 'Build a consistent sleep routine', 'Feel calmer at night']} value={answers.primaryGoal} onSelect={value => setAnswer('primaryGoal', value === 'Quiet my mind' ? 'quiet_mind' : value.includes('easily') ? 'fall_asleep' : value.includes('anxious') ? 'less_anxious' : value.includes('waking') ? 'stop_waking' : value.includes('phone') ? 'phone_earlier' : value.includes('consistent') ? 'consistent_routine' : 'calmer_night')} />}
    {screen === 16 && <BuildScreen progress={buildProgress} />}
    {screen === 17 && (
      <>
        {!showNightCompanion && (
          <CompactResultScreen
            result={result}
            recommendations={recommendations}
            onStartTonight={startTonight}
            onRecommendation={openRecommendation}
            onBetaPlan={startNightCompanion}
          />
        )}
        {showNightCompanion && (
          <div id="night-companion-beta">
            <NightCompanionFlow result={result} />
          </div>
        )}
      </>
    )}
  </main>
</div>
);
}

function Intro({
  intentText,
  onStart,
  locale = 'en',
}: {
  intentText: string;
  onStart: (location: 'hero' | 'preview_night_1') => void;
  locale?: string;
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const toggleJourneyPreview = () => {
    const nextState = !mobileExpanded;
    setMobileExpanded(nextState);
    trackClientEvent('journey_preview_toggled', {
      locale,
      metadata: {
        funnel: 'night_pattern',
        expanded: nextState,
        quiz_attempt_id: getOrCreateQuizAttemptId(),
      },
    });
  };

  return (
    <section className="flex flex-1 flex-col py-2 sm:py-4">
      {/* 1. Hero Block */}
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-800/40 bg-indigo-950/70 text-indigo-300 shadow-xl shadow-indigo-950/50">
          <Moon className="h-7 w-7 text-indigo-300" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">
          MINDFUL HAVEN · NIGHT COMPANION
        </p>

        <div className="mt-3">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">
            Tired of fighting for sleep every night?
          </h1>
        </div>

        <div className="mx-auto mt-3 max-w-lg">
          <p className="text-sm leading-6 text-slate-300">
            Find a gentler place to begin tonight. Answer a few questions, then try guided breathing and calming sounds at your own pace.
          </p>
        </div>

        {intentText && (
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-indigo-800/40 bg-indigo-950/40 p-3 text-left text-xs text-indigo-200">
            <p>{intentText}</p>
          </div>
        )}
      </div>

      {/* 2. Three Feature Cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 text-left">
        {/* Card 1 */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-900/50 bg-[#101426] p-3.5 sm:p-4">
          <div>
            <div className="mb-2 text-indigo-300">
              <Moon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Tell us about your nights</h3>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-300 border-t border-indigo-950/80 pt-2.5">
            A few questions about what bedtime feels like for you.
          </p>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-900/50 bg-[#101426] p-3.5 sm:p-4">
          <div>
            <div className="mb-2 text-teal-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Choose what fits tonight</h3>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-300 border-t border-indigo-950/80 pt-2.5">
            A small starting step based on how you feel.
          </p>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-900/50 bg-[#101426] p-3.5 sm:p-4">
          <div>
            <div className="mb-2 text-cyan-300">
              <Wind className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Press play and settle in</h3>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-300 border-t border-indigo-950/80 pt-2.5">
            Guided breathing and a background sound you choose.
          </p>
        </div>
      </div>

      {/* 3. Primary CTA Section (Appears BEFORE the 7-night preview) */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => onStart('hero')}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 px-6 py-3.5 text-white shadow-xl shadow-indigo-950/60 hover:opacity-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-[#080b15]"
        >
          <span className="text-base font-extrabold tracking-wide">
            Find My Starting Point
          </span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Reassurance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-300 text-center">
          <div className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
            <span>A few short questions</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>Night 1 is free · No account or payment required</span>
          </div>
        </div>

        {/* Wellness Disclaimer */}
        <div className="pt-0.5 text-center text-[11px] text-slate-400/90 leading-relaxed max-w-md mx-auto">
          <p>For general wellness and educational purposes. Not a medical diagnosis.</p>
        </div>
      </div>

      {/* 4. 7-Night Journey Preview (Placed UNDER Primary CTA) */}
      <div className="mt-8 border-t border-indigo-950/80 pt-6 text-left">
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/50 px-3 py-1 text-xs font-semibold text-teal-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            <span>7-NIGHT COMPANION PATH</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Your 7-night journey
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            A gentler night starts with one small step. Begin with Night 1. Explore what we’re preparing for the nights ahead.
          </p>
        </div>

        {/* Night 1 Hero Card */}
        <div className="rounded-3xl border-2 border-teal-500/50 bg-gradient-to-br from-[#121832] via-[#0f1429] to-[#0c1a24] p-4 sm:p-5 shadow-2xl shadow-teal-950/30 mb-3.5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-900/40">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400 text-slate-950 font-black text-sm shadow-md shadow-teal-950/40">
                1
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Night 1 — A Gentle Beginning
                </h3>
              </div>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-teal-950 border border-teal-600/60 px-3 py-1 text-xs font-bold text-teal-300">
              Start here
            </span>
          </div>

          <div className="mt-3">
            <p className="text-sm leading-relaxed text-slate-200 font-medium">
              Begin with guided breathing and a background sound you choose.
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-indigo-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Available now</span>
            </div>
            <button
              type="button"
              onClick={() => onStart('preview_night_1')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 hover:bg-teal-300 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-950/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <span>Start Night 1</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Accordion Toggle */}
        <div className="sm:hidden mb-3">
          <button
            type="button"
            onClick={toggleJourneyPreview}
            aria-expanded={mobileExpanded}
            aria-controls="upcoming-nights-preview"
            className="flex w-full items-center justify-between rounded-2xl border border-indigo-900/60 bg-[#101426] px-4 py-3 text-xs font-bold text-indigo-200 hover:border-indigo-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-300" />
              <span>{mobileExpanded ? 'Collapse journey' : 'Explore the 7-night journey (Nights 2–7)'}</span>
            </div>
            {mobileExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
        </div>

        {/* Nights 2-7 Grid (Always visible on desktop, toggleable on mobile) */}
        <div
          id="upcoming-nights-preview"
          className={`${mobileExpanded ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`}
        >
          {JOURNEY_PREVIEW_NIGHTS.slice(1).map(night => (
            <div
              key={night.night_number}
              className="rounded-2xl border border-indigo-950 bg-[#0d1020]/90 p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-800/40 text-xs font-bold text-slate-400">
                    {night.night_number}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 border border-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    <Lock className="h-3 w-3 text-slate-400" />
                    <span>Coming soon</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-200">
                  Night {night.night_number} — {night.title_en}
                </h4>
              </div>

              <div className="mt-2.5 pt-2 border-t border-indigo-950/60">
                <p className="text-xs leading-relaxed text-slate-300">
                  {night.summary_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function SingleScreen({ title, question, options, value, onSelect }: { title: string; question: string; options: string[]; value: string; onSelect: (value: string) => void }) { return <section className="flex flex-1 flex-col justify-between py-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english={title} /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={question} /></h2><div className="mt-8 space-y-3">{options.map(option => <button key={option} type="button" onClick={() => onSelect(option)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${value === option ? 'border-teal-400 bg-teal-950/50 text-white' : 'border-indigo-900/50 bg-[#111629] text-slate-200 hover:border-indigo-500'}`}><BilingualLine english={option} />{value === option ? <Check className="h-5 w-5 text-teal-300" /> : <ArrowRight className="h-4 w-4 text-indigo-400" />}</button>)}</div></div></section>; }
function MultiScreen({ title, question, options, selected, onToggle, onContinue }: { title: string; question: string; options: readonly (readonly [string, string])[]; selected: string[]; onToggle: (value: string) => void; onContinue: () => void }) { return <section className="flex flex-1 flex-col justify-between py-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english={title} /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={question} /></h2><p className="mt-2 text-sm text-slate-400"><BilingualLine english="Select all that apply." /></p><div className="mt-7 space-y-3">{options.map(([id, label]) => <button key={id} type="button" onClick={() => onToggle(id)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${selected.includes(id) ? 'border-teal-400 bg-teal-950/50 text-white' : 'border-indigo-900/50 bg-[#111629] text-slate-200 hover:border-indigo-500'}`}><BilingualLine english={label} /><span className={`grid h-5 w-5 place-items-center rounded-md border ${selected.includes(id) ? 'border-teal-300 bg-teal-400 text-slate-950' : 'border-slate-600'}`}>{selected.includes(id) && <Check className="h-3 w-3" />}</span></button>)}</div></div><button type="button" disabled={!selected.length} onClick={onContinue} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-40"><BilingualLine english="Continue" /> <span className="text-indigo-200">({selected.length})</span></button></section>; }
function InsightScreen({ title, body, onContinue, continueLabel }: { title: string; body: string; onContinue: () => void; continueLabel: string }) { return <section className="flex flex-1 flex-col justify-between py-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-teal-800/60 bg-teal-950/50 text-teal-300"><Sparkles className="h-7 w-7" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="A small reflection" /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={title} /></h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300"><BilingualLine english={body} /></p></div><button type="button" onClick={onContinue} className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold"><BilingualLine english={continueLabel} /><ArrowRight className="h-5 w-5" /></button></section>; }
function BuildScreen({ progress }: { progress: number }) { return <section className="flex flex-1 flex-col items-center justify-center py-8 text-center"><div className="grid h-28 w-28 place-items-center rounded-full border-4 border-indigo-950 border-t-teal-300"><span className="text-2xl font-black text-teal-200">{progress}%</span></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="Your plan is taking shape" vietnamese="Ke hoach cua ban dang dan ro hon" /></p><h2 className="mt-3 text-3xl font-black text-white"><BilingualLine english="Building tonight’s plan..." vietnamese="Dang tao ke hoach cho toi nay..." /></h2><div className="mt-7 w-full max-w-sm space-y-3 rounded-2xl border border-indigo-900/50 bg-[#111629] p-5 text-left text-sm">{['Analyzing your answers...', 'Identifying your night pattern...', 'Finding your biggest blockers...', 'Building tonight’s plan...'].map((message, index) => <div key={message} className={`flex items-center gap-3 ${progress >= (index + 1) * 25 ? 'text-slate-100' : 'text-slate-500'}`}><span className={`grid h-5 w-5 place-items-center rounded-full ${progress >= (index + 1) * 25 ? 'bg-teal-400 text-slate-950' : 'bg-indigo-950'}`}>{progress >= (index + 1) * 25 && <Check className="h-3 w-3" />}</span><BilingualLine english={message} /></div>)}</div></section>; }

function getQueryAttribution() { return Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(key => [key, typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get(key) || ''])) as Record<string, string>; }
