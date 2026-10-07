'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Moon, Smartphone, Sparkles, Wind } from 'lucide-react';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';
import { buildNightPatternResult, type NightPatternAnswers } from '@/lib/night-pattern';
import { getRecommendations, type Recommendation } from '@/lib/recommendations';
import { getOrCreateQuizAttemptId } from '@/lib/night-companion-analytics';
import { BilingualLine } from '@/lib/night-companion-i18n';
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

  const goNext = () => {
    const attemptId = getOrCreateQuizAttemptId();
    if (screen === 0) { trackClientEvent('quiz_start', { locale, metadata: { funnel: 'night_pattern', quiz_attempt_id: attemptId, source_intent: sourceIntent || 'direct' } }); trackClientEvent('quiz_started', { locale, metadata: { funnel: 'quiz_insomnia', quiz_attempt_id: attemptId, source_intent: sourceIntent || 'direct' } }); }
    if (screen >= 1 && screen <= 15) { trackClientEvent('quiz_step_complete', { locale, metadata: { funnel: 'night_pattern', quiz_attempt_id: attemptId, step: screen, source_intent: sourceIntent, answers } }); trackClientEvent('quiz_step', { locale, metadata: { funnel: 'quiz_insomnia', quiz_attempt_id: attemptId, step: screen, source_intent: sourceIntent, answers } }); }
    if ([6, 8, 11].includes(screen)) trackClientEvent('micro_insight_view', { locale, metadata: { funnel: 'night_pattern', insight_step: screen, source_intent: sourceIntent } });
    setScreen(current => Math.min(current + 1, 17)); window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return <div className="min-h-screen bg-[#080b15] text-slate-100 selection:bg-indigo-500 selection:text-white"><header className="sticky top-0 z-50 border-b border-indigo-950/60 bg-[#080b15]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={goBack} disabled={screen === 0 || screen === 16 || screen === 17} className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-900/60 bg-indigo-950/50 text-indigo-300 disabled:opacity-50" aria-label="Back"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs font-extrabold tracking-[0.16em] text-indigo-200">SOULSCAPE · NIGHT PATTERN</span></div><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{screen > 0 && screen < 17 ? `${progress}%` : '2 min'}</span></div>{progress > 0 && <div className="h-1 bg-indigo-950/60"><div className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-teal-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div>}</header><main className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-xl flex-col px-4 py-6 sm:px-6">
    {screen === 0 && <Intro intentText={intentText} onStart={goNext} />}
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
    {screen === 17 && <>{!showNightCompanion && <CompactResultScreen result={result} recommendations={recommendations} onStartTonight={startTonight} onRecommendation={openRecommendation} onBetaPlan={startNightCompanion} />}{showNightCompanion && <div id="night-companion-beta"><NightCompanionFlow result={result} /></div>}</>}
  </main></div>;
}

function Intro({ intentText, onStart }: { intentText: string; onStart: () => void }) { return <section className="flex flex-1 flex-col justify-between py-8 text-center"><div><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-indigo-950/80 text-indigo-300 shadow-2xl shadow-indigo-950/50"><Moon className="h-8 w-8" /></div><p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">SOULSCAPE · NIGHT PATTERN QUIZ</p><h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl"><BilingualLine english="What’s keeping you awake at night?" vietnamese="Dieu gi dang khien ban kho ngu vao ban dem?" /></h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300"><BilingualLine english="Take the 2-minute Night Pattern Quiz and discover what may be getting in the way of winding down." /></p>{intentText && <p className="mx-auto mt-3 max-w-sm rounded-2xl border border-indigo-800/50 bg-indigo-950/40 p-3 text-xs text-indigo-200">{intentText}<BilingualLine english="We’ll use your answers to personalize the result." vietnamese="Chung toi se dung cau tra loi de ca nhan hoa ket qua." /></p>}<div className="mt-8 grid gap-3 text-left sm:grid-cols-3"><ValueCard icon={<Wind />} title="Understand" text="See what your nights may be responding to." /><ValueCard icon={<Sparkles />} title="Personalize" text="Get a realistic starting plan for tonight." /><ValueCard icon={<Smartphone />} title="Continue" text="Take your plan into Soulscape." /></div></div><div className="mt-10"><button type="button" onClick={onStart} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 px-6 py-4 text-base font-bold shadow-xl shadow-indigo-950/50"><BilingualLine english="Discover My Night Pattern" vietnamese="Kham pha mau hinh ban dem cua toi" /><ArrowRight className="h-5 w-5" /></button><p className="mt-3 text-[11px] text-slate-500"><BilingualLine english="For general wellness and educational purposes. Not a medical diagnosis." /></p></div></section>; }
function ValueCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-indigo-900/50 bg-[#111629] p-3"><div className="mb-2 text-teal-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</div><p className="text-xs font-bold text-white"><BilingualLine english={title} /></p><p className="mt-1 text-[11px] leading-4 text-slate-400"><BilingualLine english={text} /></p></div>; }
function SingleScreen({ title, question, options, value, onSelect }: { title: string; question: string; options: string[]; value: string; onSelect: (value: string) => void }) { return <section className="flex flex-1 flex-col justify-between py-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english={title} /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={question} /></h2><div className="mt-8 space-y-3">{options.map(option => <button key={option} type="button" onClick={() => onSelect(option)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${value === option ? 'border-teal-400 bg-teal-950/50 text-white' : 'border-indigo-900/50 bg-[#111629] text-slate-200 hover:border-indigo-500'}`}><BilingualLine english={option} />{value === option ? <Check className="h-5 w-5 text-teal-300" /> : <ArrowRight className="h-4 w-4 text-indigo-400" />}</button>)}</div></div></section>; }
function MultiScreen({ title, question, options, selected, onToggle, onContinue }: { title: string; question: string; options: readonly (readonly [string, string])[]; selected: string[]; onToggle: (value: string) => void; onContinue: () => void }) { return <section className="flex flex-1 flex-col justify-between py-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english={title} /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={question} /></h2><p className="mt-2 text-sm text-slate-400"><BilingualLine english="Select all that apply." /></p><div className="mt-7 space-y-3">{options.map(([id, label]) => <button key={id} type="button" onClick={() => onToggle(id)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${selected.includes(id) ? 'border-teal-400 bg-teal-950/50 text-white' : 'border-indigo-900/50 bg-[#111629] text-slate-200 hover:border-indigo-500'}`}><BilingualLine english={label} /><span className={`grid h-5 w-5 place-items-center rounded-md border ${selected.includes(id) ? 'border-teal-300 bg-teal-400 text-slate-950' : 'border-slate-600'}`}>{selected.includes(id) && <Check className="h-3 w-3" />}</span></button>)}</div></div><button type="button" disabled={!selected.length} onClick={onContinue} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-40"><BilingualLine english="Continue" /> <span className="text-indigo-200">({selected.length})</span></button></section>; }
function InsightScreen({ title, body, onContinue, continueLabel }: { title: string; body: string; onContinue: () => void; continueLabel: string }) { return <section className="flex flex-1 flex-col justify-between py-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-teal-800/60 bg-teal-950/50 text-teal-300"><Sparkles className="h-7 w-7" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="A small reflection" /></p><h2 className="mt-3 text-3xl font-black leading-tight text-white"><BilingualLine english={title} /></h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300"><BilingualLine english={body} /></p></div><button type="button" onClick={onContinue} className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold"><BilingualLine english={continueLabel} /><ArrowRight className="h-5 w-5" /></button></section>; }
function BuildScreen({ progress }: { progress: number }) { return <section className="flex flex-1 flex-col items-center justify-center py-8 text-center"><div className="grid h-28 w-28 place-items-center rounded-full border-4 border-indigo-950 border-t-teal-300"><span className="text-2xl font-black text-teal-200">{progress}%</span></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="Your plan is taking shape" vietnamese="Ke hoach cua ban dang dan ro hon" /></p><h2 className="mt-3 text-3xl font-black text-white"><BilingualLine english="Building tonight’s plan..." vietnamese="Dang tao ke hoach cho toi nay..." /></h2><div className="mt-7 w-full max-w-sm space-y-3 rounded-2xl border border-indigo-900/50 bg-[#111629] p-5 text-left text-sm">{['Analyzing your answers...', 'Identifying your night pattern...', 'Finding your biggest blockers...', 'Building tonight’s plan...'].map((message, index) => <div key={message} className={`flex items-center gap-3 ${progress >= (index + 1) * 25 ? 'text-slate-100' : 'text-slate-500'}`}><span className={`grid h-5 w-5 place-items-center rounded-full ${progress >= (index + 1) * 25 ? 'bg-teal-400 text-slate-950' : 'bg-indigo-950'}`}>{progress >= (index + 1) * 25 && <Check className="h-3 w-3" />}</span><BilingualLine english={message} /></div>)}</div></section>; }

function getQueryAttribution() { return Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(key => [key, typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get(key) || ''])) as Record<string, string>; }
