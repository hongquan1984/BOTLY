'use client';

import { useEffect, useState } from 'react';
import { Check, Map, Moon, PauseCircle, Square } from 'lucide-react';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';
import { buildNightPatternResult, type NightPatternResult } from '@/lib/night-pattern';
import { NIGHT_ONE_AUDIO, NIGHT_ONE_BACKGROUND_PRESETS, NIGHT_ONE_SCRIPTS, selectNightOneVoiceOptions } from '@/lib/night-companion-content';
import { NightAudioPlayer } from '@/components/night-companion/NightAudioPlayer';
import { JourneyMapView } from '@/components/night-companion/JourneyMapView';
import { trackNightFunnel } from '@/lib/night-companion-analytics';
import { clearNightCompanionSetupDraft, clearNightCompanionToken, createNightCompanionProfile, readNightCompanionProfile, readNightCompanionSetupDraft, saveNightCompanionSetupDraft, updateNightCompanionProfile } from '@/lib/night-companion-client';
import { BilingualLine, viForAction, viForModule, viForState } from '@/lib/night-companion-i18n';
import { createNightProfile, normalizeNightCompanionState, selectNightOnePlan, selectStillAwakePlan, type CompletionStatus, type Helpfulness, type LastHourBehavior, type NightCompanionState, type NightPlan, type NightProfile, type NightReview, type PostListenFeedback, type SleepDoesntCome, type TonightStateId } from '@/lib/night-companion';

type Props = { result?: NightPatternResult; onStarted?: () => void; autoStartAudio?: boolean };
const lastHourOptions: Array<[LastHourBehavior, string]> = [['scrolling', 'Scrolling or watching videos'], ['checking_work', 'Checking messages or work'], ['unfinished_thoughts', 'Thinking about unfinished things'], ['relaxing', 'Reading or doing something relaxing'], ['inconsistent_routine', "I don't have a consistent routine"], ['other', 'Other']];
const tonightOptions: Array<[TonightStateId, string]> = [['MIND_WONT_STOP', "My mind won't stop"], ['SLEEP_ANXIETY', "I'm anxious about sleep"], ['NOT_SLEEPY', "I'm tired but not sleepy"], ['WOKE_UP', 'I woke up again'], ['STRESS_CARRYOVER', "I'm still carrying stress from today"]];
const quietActivityOptions = ['Read something easy', 'Sit somewhere comfortable', 'Listen to quiet music'];
const routineCueOptions = ['Dim the lights', 'Put the phone away', 'Make a warm drink'];

function metadata(profile?: NightProfile, state?: TonightStateId, moduleId?: string) {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  return { funnel: 'night_companion_v1', primary_pattern: profile?.quiz_result.primary_pattern || '', tonight_state: state || '', module_id: moduleId || '', source_intent: profile?.quiz_result.source_intent || '', utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '', utm_content: params.get('utm_content') || '' };
}
function track(event: string, profile?: NightProfile, state?: TonightStateId, moduleId?: string) { trackClientEvent(event, { locale: 'en', metadata: metadata(profile, state, moduleId) }); }

export function NightCompanionFlow({ result, onStarted, autoStartAudio = false }: Props) {
  const [stage, setStage] = useState<'map' | 'intro' | 'setup' | 'loading' | 'tonight' | 'plan' | 'feedback' | 'resting' | 'review' | 'done'>('loading');
  const [savedResumeStage, setSavedResumeStage] = useState<'setup' | 'intro' | 'tonight' | 'plan' | 'feedback' | 'resting' | 'review' | 'done'>('setup');
  const [postListenFeedback, setPostListenFeedback] = useState<PostListenFeedback | ''>('');
  const [setupStep, setSetupStep] = useState(0);
  const [desiredBedtime, setDesiredBedtime] = useState('');
  const [usualWakeTime, setUsualWakeTime] = useState('');
  const [lastHour, setLastHour] = useState<LastHourBehavior[]>([]);
  const [sleepDoesntCome, setSleepDoesntCome] = useState<SleepDoesntCome>('varies');
  const [profile, setProfile] = useState<NightProfile | null>(null);
  const [state, setState] = useState<TonightStateId | ''>('');
  const [plan, setPlan] = useState<NightPlan | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [usedModules, setUsedModules] = useState<string[]>([]);
  const [helpfulness, setHelpfulness] = useState<Record<string, Helpfulness>>({});
  const [reviewOverall, setReviewOverall] = useState<'BETTER' | 'SAME' | 'WORSE' | ''>('');
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('completed');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [error, setError] = useState('');
  const [isStillAwake, setIsStillAwake] = useState(false);
  const [stillAwakePrompt, setStillAwakePrompt] = useState(false);
  const [moduleNote, setModuleNote] = useState('');
  const [moduleChoice, setModuleChoice] = useState('');
  const [audioErrorModule, setAudioErrorModule] = useState('');
  const [audioRetry, setAudioRetry] = useState(0);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreError, setRestoreError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const resume = async () => {
      setRestoreError('');
      const saved = await readNightCompanionProfile();
      if (cancelled) return;
      if (saved?.profile && typeof saved.profile === 'object') {
        const companion = normalizeNightCompanionState(saved.profile);
        if (!companion) throw new Error('Your saved Night Profile could not be read. Please retry.');
        setProfile(companion.profile);
        const resolvedState = companion.tonight_state?.current_state || (
          result?.primary_pattern === 'RACING_MIND' ? 'MIND_WONT_STOP' :
          result?.primary_pattern === 'SLEEP_ANXIETY' ? 'SLEEP_ANXIETY' :
          result?.primary_pattern === 'NIGHT_WAKING' ? 'WOKE_UP' :
          'MIND_WONT_STOP'
        );
        setState(resolvedState);
        const resolvedPlan = companion.night_one_plan || selectNightOnePlan(companion.profile, { night_number: 1, current_state: resolvedState, selected_at: new Date().toISOString() });
        setPlan(resolvedPlan);
        const audioIdx = resolvedPlan.modules.findIndex(m => m.module_id === 'calming_audio');
        if (companion.active_module_index !== undefined) setModuleIndex(companion.active_module_index);
        if (companion.review) { setCompletionStatus(companion.review.completion_status); setReviewSaved(true); }
        if (companion.module_feedback) { setUsedModules(companion.module_feedback.filter(item => item.used).map(item => item.module_id)); setHelpfulness(Object.fromEntries(companion.module_feedback.map(item => [item.module_id, item.helpfulness]))); }
        if (companion.post_listen_feedback) setPostListenFeedback(companion.post_listen_feedback);

        if (autoStartAudio) {
          setModuleIndex(audioIdx >= 0 ? audioIdx : 0);
          setSavedResumeStage('plan');
          trackNightFunnel('night_1_started', { night_number: 1, quick_start: true }, { night_profile_id: companion.profile.profile_id });
          onStarted?.();
          setStage('plan');
          return;
        }

        let targetResume: 'setup' | 'intro' | 'tonight' | 'plan' | 'feedback' | 'resting' | 'review' | 'done' = 'tonight';
        if (companion.review) targetResume = 'done';
        else if (companion.resume_stage === 'feedback' || companion.resume_stage === 'resting' || companion.resume_stage === 'done') targetResume = 'done';
        else if (companion.resume_stage === 'review') targetResume = 'review';
        else if (companion.resume_stage === 'plan' || companion.night_one_plan) targetResume = 'plan';
        else targetResume = 'tonight';
        setSavedResumeStage(targetResume);

        trackNightFunnel('returning_user_detected', { has_review: Boolean(companion.review) }, { night_profile_id: companion.profile.profile_id });
        setStage('map');
        return;
      }

      // If no saved profile but autoStartAudio is requested with result
      if (autoStartAudio && result) {
        const effectiveTonightState: TonightStateId = 
          result.primary_pattern === 'RACING_MIND' ? 'MIND_WONT_STOP' :
          result.primary_pattern === 'SLEEP_ANXIETY' ? 'SLEEP_ANXIETY' :
          result.primary_pattern === 'NIGHT_WAKING' ? 'WOKE_UP' :
          'MIND_WONT_STOP';

        const setup = {
          desired_bedtime: '23:00',
          usual_wake_time: '07:00',
          last_hour_behaviors: ['unfinished_thoughts'] as LastHourBehavior[],
          sleep_doesnt_come: 'thoughts_busier' as SleepDoesntCome,
        };
        const provisional = createNightProfile('quick-' + Date.now().toString(36), result, setup);
        const tonightState = { night_number: 1 as const, current_state: effectiveTonightState, selected_at: new Date().toISOString() };
        const quickPlan = selectNightOnePlan(provisional, tonightState);
        const audioIdx = quickPlan.modules.findIndex(m => m.module_id === 'calming_audio');

        setProfile(provisional);
        setState(effectiveTonightState);
        setPlan(quickPlan);
        setModuleIndex(audioIdx >= 0 ? audioIdx : 0);
        setSavedResumeStage('plan');
        setStage('plan');

        void createNightCompanionProfile({
          profile: provisional,
          tonight_state: tonightState,
          night_one_plan: quickPlan,
          module_feedback: [],
          resume_stage: 'plan',
          active_module_index: audioIdx >= 0 ? audioIdx : 0,
        }).then(created => {
          if (!cancelled && created?.profile_id) {
            setProfile(p => p ? { ...p, profile_id: created.profile_id } : null);
          }
        }).catch(() => {});

        track('night_profile_created', provisional);
        trackNightFunnel('night_1_started', { night_number: 1, quick_start: true }, { night_profile_id: provisional.profile_id });
        onStarted?.();
        return;
      }

      const draft = readNightCompanionSetupDraft();
      if (draft) { setSetupStep(draft.setupStep); setDesiredBedtime(draft.desiredBedtime); setUsualWakeTime(draft.usualWakeTime); setLastHour(draft.lastHour as LastHourBehavior[]); setSleepDoesntCome(draft.sleepDoesntCome as SleepDoesntCome); }
      setSavedResumeStage('setup');
      setStage('map');
    };
    const run = async () => {
      try { await resume(); } catch (caught) { if (!cancelled) { setRestoreError(caught instanceof Error ? caught.message : 'Your Night Profile could not be restored. Please retry.'); setStage('loading'); } }
    };
    void run();
    return () => { cancelled = true; };
  }, [result, restoreAttempt, autoStartAudio]);

  useEffect(() => {
    if (stage !== 'setup' || isSaving) return;
    saveNightCompanionSetupDraft({ setupStep, desiredBedtime, usualWakeTime, lastHour, sleepDoesntCome });
  }, [stage, isSaving, setupStep, desiredBedtime, usualWakeTime, lastHour, sleepDoesntCome]);

  const activeModule = plan?.modules[moduleIndex];
  const activeKind = activeModule?.kind || 'action';
  const activeDuration = activeModule?.duration_minutes || 5;
  const activeScript = activeModule?.module_id === 'guided_downshift' || activeModule?.module_id === 'reduce_sleep_pressure' || activeModule?.module_id === 'decompression' || activeModule?.module_id === 'back_to_sleep';
  const activeAudio = activeModule?.audio_asset_id === 'night1-ocean-waves-cc0';
  const activeAudioError = audioErrorModule === activeModule?.module_id;

  useEffect(() => {
    if (stage === 'plan' && profile && state && activeModule) track('module_started', profile, state, activeModule.module_id);
  }, [stage, profile, state, activeModule]);

  const persistProgress = async (nextPlan: NightPlan, nextUsed: string[], resumeStage: 'plan' | 'resting', nextIndex: number) => {
    if (!profile || !state) return;
    const nextState: NightCompanionState = { profile, tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() }, night_one_plan: nextPlan, module_feedback: nextPlan.modules.map(module => ({ module_id: module.module_id, used: nextUsed.includes(module.module_id), helpfulness: helpfulness[module.module_id] || 'NO' })), resume_stage: resumeStage, active_module_index: nextIndex };
    await updateNightCompanionProfile(nextState).catch(() => setError('Your plan is ready, but saving progress failed.'));
  };

  const beginSetup = async () => {
    const effectiveResult = result || buildNightPatternResult({ gender: '', ageGroup: '', issues: [], frequency: '', duration: '', sleepHours: '', bedtimeTension: '', racingThoughts: '', sleepSupport: '', concerns: [], primaryGoal: '' }, '');
    if (!desiredBedtime || !usualWakeTime || lastHour.length === 0) return;
    setError(''); setIsSaving(true); setStage('loading');
    try {
      const setup = { desired_bedtime: desiredBedtime, usual_wake_time: usualWakeTime, last_hour_behaviors: lastHour, sleep_doesnt_come: sleepDoesntCome };
      const provisional = createNightProfile('pending', effectiveResult, setup);
      const initialState: NightCompanionState = { profile: provisional, module_feedback: [], resume_stage: 'tonight' };
      const created = await createNightCompanionProfile(initialState);
      const nextProfile = { ...provisional, profile_id: created.profile_id };
      clearNightCompanionSetupDraft(); setProfile(nextProfile); setReviewSaved(false); setSavedResumeStage('tonight'); track('night_profile_created', nextProfile); trackNightFunnel('night_1_started', { night_number: 1 }, { night_profile_id: nextProfile.profile_id }); onStarted?.(); setStage('tonight');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save your Night Profile.'); setStage('setup'); } finally { setIsSaving(false); }
  };

  const chooseTonight = async (nextState: TonightStateId, stillAwake = false) => {
    if (!profile) return;
    const tonightState = { night_number: 1 as const, current_state: nextState, selected_at: new Date().toISOString() };
    const nextPlan = stillAwake ? selectStillAwakePlan(nextState) : selectNightOnePlan(profile, tonightState);
    setState(nextState); setPlan(nextPlan); setModuleIndex(0); setUsedModules([]); setHelpfulness({}); setReviewSaved(false); setModuleNote(''); setModuleChoice(''); setIsStillAwake(stillAwake); setStillAwakePrompt(false); setSavedResumeStage('plan'); setStage('plan');
    track(stillAwake ? 'still_awake_started' : 'tonight_state_selected', profile, nextState);
    if (!stillAwake) track('night_1_started', profile, nextState);
    await updateNightCompanionProfile({ profile, tonight_state: tonightState, night_one_plan: nextPlan, module_feedback: [], resume_stage: 'plan', active_module_index: 0 }).catch(() => setError('Your plan is ready, but saving progress failed.'));
  };

  const finishPlanOrReview = async (status: CompletionStatus) => {
    setCompletionStatus(status); setSavedResumeStage('review'); setStage('review');
    if (!profile || !state || !plan) return;
    await updateNightCompanionProfile({ profile, tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() }, night_one_plan: plan, module_feedback: plan.modules.map(module => ({ module_id: module.module_id, used: usedModules.includes(module.module_id), helpfulness: helpfulness[module.module_id] || 'NO' })), resume_stage: 'review', active_module_index: moduleIndex }).catch(() => setError('Your review screen is ready, but saving progress failed.'));
  };

  const completeModule = async () => {
    if (!profile || !plan || !activeModule || !state) return;
    const nextUsed = usedModules.includes(activeModule.module_id) ? usedModules : [...usedModules, activeModule.module_id];
    setUsedModules(nextUsed); track('module_completed', profile, state, activeModule.module_id);
    if (moduleIndex < plan.modules.length - 1) { setModuleNote(''); setModuleChoice(''); setAudioErrorModule(''); const nextIndex = moduleIndex + 1; setModuleIndex(nextIndex); await persistProgress(plan, nextUsed, 'plan', nextIndex); return; }
    track('night_1_completed', profile, state); await persistProgress(plan, nextUsed, 'resting', moduleIndex); setSavedResumeStage('resting'); setStage('resting');
  };

  const skipModule = async () => {
    if (!profile || !plan || !activeModule || !state) return;
    track('module_skipped', profile, state, activeModule.module_id);
    if (moduleIndex < plan.modules.length - 1) { setModuleNote(''); setModuleChoice(''); const nextIndex = moduleIndex + 1; setModuleIndex(nextIndex); await persistProgress(plan, usedModules, 'plan', nextIndex); return; }
    await finishPlanOrReview(usedModules.length ? 'partial' : 'skipped');
  };

  const stopForTonight = async () => { if (profile && state) track('night_1_stopped', profile, state, activeModule?.module_id); await finishPlanOrReview(usedModules.length ? 'partial' : 'skipped'); };
  const saveReview = async (saveStatus = completionStatus) => {
    if (!profile || !state || !plan) return;
    const review: NightReview = { night_number: 1, overall: reviewOverall || 'SAME', completion_status: saveStatus, module_feedback: plan.modules.map(module => ({ module_id: module.module_id, used: usedModules.includes(module.module_id), helpfulness: helpfulness[module.module_id] || 'NO' })), created_at: new Date().toISOString() };
    try { await updateNightCompanionProfile({ profile, tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() }, night_one_plan: plan, module_feedback: review.module_feedback, review }); } catch { setError('Review could not be saved. Nothing was marked complete.'); return; }
    setReviewSaved(true); setSavedResumeStage('done'); track('night_review_completed', profile, state); setStage('done');
  };
  const resetLocalTestSession = () => { if (process.env.NODE_ENV === 'production') return; clearNightCompanionToken(); clearNightCompanionSetupDraft(); window.location.reload(); };
  const toggleLastHour = (value: LastHourBehavior) => setLastHour(current => current.includes(value) ? current.filter(item => item !== value) : [...current.filter(item => item !== 'inconsistent_routine'), value]);

  if (stage === 'map') {
    return (
      <JourneyMapView
        profile={profile}
        stage={savedResumeStage}
        hasReview={reviewSaved}
        onSelectNight={(nightNumber) => {
          if (nightNumber === 1) {
            trackNightFunnel('night_1_card_clicked', {
              has_profile: Boolean(profile),
              saved_resume_stage: savedResumeStage,
              has_review: reviewSaved,
            }, {
              night_profile_id: profile?.profile_id,
            });
            // Section B: Always show the clear Night 1 Intro Screen
            setStage('intro');
          }
        }}
        onResetTest={process.env.NODE_ENV !== 'production' ? resetLocalTestSession : undefined}
      />
    );
  }

  if (stage === 'intro') {
    return (
      <CompanionShell onBackToMap={() => setStage('map')}>
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
            <BilingualLine english="Night 1 — A Gentle Beginning" />
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            <BilingualLine
              english="You don’t have to solve the whole day right now"
            />
          </h2>
          <div className="rounded-2xl border border-teal-900/60 bg-teal-950/20 p-4 text-sm leading-6 text-slate-300">
            <p>
              <BilingualLine
                english="Tonight helps you gently transition from a busy day into a restful space. You will have a natural-paced breathing practice and calming sound tailored to how you are feeling tonight."
              />
            </p>
            <p className="mt-2 text-xs text-slate-400">
              <BilingualLine
                english="No medical claims. No pressure to sleep immediately. This is a quiet, comfortable space to unwind."
              />
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!profile) {
                const effectiveResult = result || buildNightPatternResult({ gender: '', ageGroup: '', issues: [], frequency: '', duration: '', sleepHours: '', bedtimeTension: '', racingThoughts: '', sleepSupport: '', concerns: [], primaryGoal: '' }, '');
                const setup = { desired_bedtime: '23:00', usual_wake_time: '07:00', last_hour_behaviors: ['unfinished_thoughts'] as LastHourBehavior[], sleep_doesnt_come: 'thoughts_busier' as SleepDoesntCome };
                const provisional = createNightProfile('quick-' + Date.now().toString(36), effectiveResult, setup);
                const tonightState = { night_number: 1 as const, current_state: 'MIND_WONT_STOP' as const, selected_at: new Date().toISOString() };
                const quickPlan = selectNightOnePlan(provisional, tonightState);
                const audioIdx = quickPlan.modules.findIndex(m => m.module_id === 'calming_audio');
                setProfile(provisional);
                setState('MIND_WONT_STOP');
                setPlan(quickPlan);
                setModuleIndex(audioIdx >= 0 ? audioIdx : 0);
                setSavedResumeStage('plan');
                setStage('plan');
                void createNightCompanionProfile({
                  profile: provisional,
                  tonight_state: tonightState,
                  night_one_plan: quickPlan,
                  module_feedback: [],
                  resume_stage: 'plan',
                  active_module_index: audioIdx >= 0 ? audioIdx : 0,
                }).catch(() => {});
                track('night_profile_created', provisional);
                trackNightFunnel('night_1_started', { night_number: 1, quick_start: true }, { night_profile_id: provisional.profile_id });
                onStarted?.();
              } else if (savedResumeStage === 'plan' && plan) {
                setStage('plan');
              } else {
                trackNightFunnel('night_1_replayed', {}, { night_profile_id: profile.profile_id });
                setSavedResumeStage('tonight');
                setStage('tonight');
              }
            }}
            className="companion-button mt-4"
          >
            <BilingualLine english="Start Night 1 Audio Now (Free)" vietnamese="Bắt đầu nghe Đêm 1 ngay (Miễn phí)" />
          </button>
          {!profile && (
            <button
              type="button"
              onClick={() => setStage('setup')}
              className="mt-2.5 w-full text-center text-xs font-semibold text-indigo-300 underline underline-offset-4 hover:text-white"
            >
              <BilingualLine english="Or customize sleep schedule first" vietnamese="Hoặc tùy chỉnh lịch ngủ & thói quen trước" />
            </button>
          )}

          <p className="text-center text-xs text-slate-400">
            <BilingualLine
              english="Skip or stop whenever you like"
            />
          </p>
        </div>
      </CompanionShell>
    );
  }

  if (stage === 'loading') return <CompanionShell onBackToMap={() => setStage('map')}>{restoreError ? <><BilingualLine english={restoreError} /><button type="button" onClick={() => setRestoreAttempt(value => value + 1)} className="companion-button mt-6"><BilingualLine english="Retry" /></button></> : <BilingualLine english={isSaving ? 'Saving your Night Profile...' : 'Loading your Night Profile...'} />}</CompanionShell>;
  if (stage === 'done') return <CompanionShell onBackToMap={() => setStage('map')}>{reviewSaved ? <><Check className="mx-auto h-8 w-8 text-teal-300" /><h2 className="mt-3 text-2xl font-black text-white"><BilingualLine english="Night 1 is complete." /></h2><p className="mt-2 text-sm leading-6 text-slate-300"><BilingualLine english={completionStatus === 'completed' ? 'Your review is saved for future learning.' : 'Your pause is saved. You stopped before finishing every module, and that is okay.'} /> You can stop here whenever you want.</p><button type="button" onClick={() => setStage('map')} className="companion-button mt-5"><BilingualLine english="View 7-Night Journey" /></button><SupportNote /></> : <><h2 className="mt-3 text-2xl font-black text-white"><BilingualLine english="No Night 1 review saved yet." /></h2><p className="mt-2 text-sm leading-6 text-slate-300"><BilingualLine english="Start from the quiz to create a Night Profile and choose tonight’s state." /></p></>}{process.env.NODE_ENV !== 'production' && <button type="button" onClick={resetLocalTestSession} className="mt-6 w-full rounded-xl border border-amber-700/70 px-4 py-3 text-sm font-bold text-amber-200"><BilingualLine english="Reset local test session" /></button>}</CompanionShell>;
  if (stage === 'setup') return <CompanionShell onBackToMap={() => setStage('map')}><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="Free Night 1 beta" /></p><h2 className="mt-2 text-3xl font-black text-white"><BilingualLine english="Set up tonight gently." /></h2><p className="mt-2 text-sm leading-6 text-slate-300"><BilingualLine english="No payment or account required. This is a wellness companion, not medical treatment." /></p>{setupStep === 0 && <div className="mt-7 space-y-5"><Field label="What time would you ideally like to be asleep tonight?" value={desiredBedtime} onChange={setDesiredBedtime} /><Field label="What time do you usually wake up?" value={usualWakeTime} onChange={setUsualWakeTime} type="time" /><button type="button" disabled={!desiredBedtime || !usualWakeTime} onClick={() => setSetupStep(1)} className="companion-button"><BilingualLine english="Continue" /></button></div>}{setupStep === 1 && <div className="mt-7"><h3 className="text-xl font-bold text-white"><BilingualLine english="What usually happens during your last hour before bed?" /></h3><div className="mt-4 space-y-2">{lastHourOptions.map(([value, label]) => <Choice key={value} selected={lastHour.includes(value)} onClick={() => toggleLastHour(value)}>{label}</Choice>)}</div><button type="button" disabled={!lastHour.length} onClick={() => setSetupStep(2)} className="companion-button mt-5"><BilingualLine english="Continue" /></button></div>}{setupStep === 2 && <div className="mt-7"><h3 className="text-xl font-bold text-white"><BilingualLine english="What usually happens when you can’t sleep?" /></h3><div className="mt-4 space-y-2">{[['thoughts_busier', 'My thoughts get busier'], ['check_phone', 'I check my phone'], ['check_time', 'I check the time'], ['try_harder', 'I stay in bed trying harder'], ['get_up', 'I get up for a while'], ['varies', 'It varies']].map(([value, label]) => <Choice key={value} selected={sleepDoesntCome === value} onClick={() => setSleepDoesntCome(value as SleepDoesntCome)}>{label}</Choice>)}</div><button type="button" onClick={beginSetup} className="companion-button mt-5"><BilingualLine english="Create my Night Profile" /></button></div>}{error && <p className="mt-4 text-sm text-rose-300"><BilingualLine english={error} /></p>}</CompanionShell>;
  if (stage === 'tonight') return <CompanionShell onBackToMap={() => setStage('map')}><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Night 1</p><h2 className="mt-2 text-3xl font-black text-white"><BilingualLine english="How’s tonight going?" /></h2><p className="mt-2 text-sm text-slate-300"><BilingualLine english="Choose what is happening now. Your Night Pattern stays separate from this Tonight State." /></p><div className="mt-6 space-y-2">{tonightOptions.map(([value, label]) => <Choice key={value} onClick={() => void chooseTonight(value, isStillAwake)}>{label}</Choice>)}</div></CompanionShell>;
  
  if (stage === 'feedback') {
    return (
      <CompanionShell onBackToMap={() => setStage('map')}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
          <BilingualLine english="Post-listening reflection" />
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
          <BilingualLine
            english="Did the listening experience help you feel a little more at ease?"
          />
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          <BilingualLine
            english="Your honest response helps tailor future nights."
          />
        </p>

        <div className="mt-6 space-y-2">
          {[
            { id: 'A_LITTLE' as const, en: 'A little' },
            { id: 'NOT_MUCH' as const, en: 'Not much' },
            { id: 'NOT_FOR_ME' as const, en: 'It wasn’t for me' },
            { id: 'NOT_ENOUGH' as const, en: 'I didn’t listen enough' },
          ].map(option => (
            <button
              key={option.id}
              type="button"
              onClick={async () => {
                setPostListenFeedback(option.id);
                trackNightFunnel('post_listen_feedback_selected', { feedback: option.id }, { night_profile_id: profile?.profile_id });
                if (profile && state && plan) {
                  await updateNightCompanionProfile({
                    profile,
                    tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() },
                    night_one_plan: plan,
                    module_feedback: plan.modules.map(module => ({
                      module_id: module.module_id,
                      used: usedModules.includes(module.module_id),
                      helpfulness: helpfulness[module.module_id] || 'NO',
                    })),
                    resume_stage: 'feedback',
                    post_listen_feedback: option.id,
                    last_session_has_listened: true,
                    active_module_index: moduleIndex,
                  }).catch(() => setError('Could not save feedback to server.'));
                }
              }}
              className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                postListenFeedback === option.id
                  ? 'border-teal-300 bg-teal-300 text-slate-950'
                  : 'border-indigo-800 bg-indigo-950/40 text-slate-200 hover:border-indigo-500'
              }`}
            >
              <BilingualLine english={option.en} />
              {postListenFeedback === option.id && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>

        {postListenFeedback && (
          <div className="mt-5 rounded-2xl border border-teal-900/60 bg-teal-950/20 p-4 text-sm leading-6 text-slate-300">
            {postListenFeedback === 'A_LITTLE' && (
              <p>
                <BilingualLine
                  english="Glad it provided a bit of comfort. You can close your eyes and rest now."
                />
              </p>
            )}
            {postListenFeedback === 'NOT_MUCH' && (
              <p>
                <BilingualLine
                  english="That is okay. Resting quietly without pressure to sleep is still restorative."
                />
              </p>
            )}
            {postListenFeedback === 'NOT_FOR_ME' && (
              <p>
                <BilingualLine
                  english="Thank you for noting that. Next time you can choose soothing background sound only without voice guidance."
                />
              </p>
            )}
            {postListenFeedback === 'NOT_ENOUGH' && (
              <p>
                <BilingualLine
                  english="No worries at all. You can replay the practice whenever you like, or rest in quiet comfort."
                />
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={async () => {
              setSavedResumeStage('done');
              if (profile && state && plan) {
                await updateNightCompanionProfile({
                  profile,
                  tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() },
                  night_one_plan: plan,
                  module_feedback: plan.modules.map(module => ({
                    module_id: module.module_id,
                    used: usedModules.includes(module.module_id),
                    helpfulness: helpfulness[module.module_id] || 'NO',
                  })),
                  resume_stage: 'done',
                  post_listen_feedback: postListenFeedback || undefined,
                  last_session_has_listened: true,
                  active_module_index: moduleIndex,
                }).catch(() => {});
              }
              setStage('map');
            }}
            className="companion-button"
          >
            <BilingualLine english="Rest now & Back to map" />
          </button>
          <button
            type="button"
            onClick={() => setStage('review')}
            className="w-full rounded-xl border border-indigo-800 px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-900/40"
          >
            <BilingualLine english="Leave detailed review" />
          </button>
          <button
            type="button"
            onClick={() => {
              const audioIndex = plan?.modules.findIndex(m => m.module_id === 'calming_audio') ?? 0;
              setModuleIndex(audioIndex >= 0 ? audioIndex : 0);
              setSavedResumeStage('plan');
              setStage('plan');
            }}
            className="w-full rounded-xl border border-indigo-900/80 px-4 py-3 text-sm text-slate-400 hover:text-white"
          >
            <BilingualLine english="Listen again" />
          </button>
        </div>
      </CompanionShell>
    );
  }

  if (stage === 'resting') return (
    <CompanionShell onBackToMap={() => setStage('map')}>
      <div className="space-y-4 text-center py-2">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300">
          <Moon className="h-7 w-7 text-teal-300" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Night 1 · Gentle Rest</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          <BilingualLine english="You can put the phone down now." />
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          <BilingualLine english="The journey has gently faded to silence. Close your eyes, let your breathing stay soft, and rest comfortably until morning." />
        </p>
        <div className="pt-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              setSavedResumeStage('done');
              setStage('map');
            }}
            className="companion-button"
          >
            <BilingualLine english="Close & Sleep" />
          </button>
          <button
            type="button"
            onClick={() => setStage('feedback')}
            className="w-full rounded-xl border border-indigo-900/80 px-4 py-2.5 text-xs text-slate-400 hover:text-white"
          >
            <BilingualLine english="Leave a reflection now (optional)" />
          </button>
          <button
            type="button"
            onClick={stopForTonight}
            className="w-full pt-1 text-xs font-semibold text-indigo-300/80 hover:text-indigo-200"
          >
            <BilingualLine english="I’m still awake" />
          </button>
        </div>
      </div>
    </CompanionShell>
  );
  
  if (stage === 'plan' && activeModule?.module_id === 'calming_audio') {
    return (
      <CompanionShell onBackToMap={() => setStage('map')}>
        <NightAudioPlayer
          script={NIGHT_ONE_SCRIPTS.gentle_breathing_v1}
          state={state || undefined}
          voices={selectNightOneVoiceOptions(state || undefined)}
          backgrounds={Object.values(NIGHT_ONE_AUDIO)}
          presets={NIGHT_ONE_BACKGROUND_PRESETS}
          profileId={profile?.profile_id}
          onSkip={() => void skipModule()}
          onComplete={async () => {
            if (profile && state && plan) {
              track('audio_completed', profile, state, 'calming_audio');
              const nextUsed = usedModules.includes('calming_audio') ? usedModules : [...usedModules, 'calming_audio'];
              setUsedModules(nextUsed);
              setSavedResumeStage('resting');
              setStage('resting');
              await updateNightCompanionProfile({
                profile,
                tonight_state: { night_number: 1, current_state: state, selected_at: new Date().toISOString() },
                night_one_plan: plan,
                module_feedback: plan.modules.map(module => ({
                  module_id: module.module_id,
                  used: nextUsed.includes(module.module_id),
                  helpfulness: helpfulness[module.module_id] || 'NO',
                })),
                resume_stage: 'resting',
                last_session_has_listened: true,
                active_module_index: moduleIndex,
              }).catch(() => setError('Progress updated locally.'));
            } else {
              setStage('resting');
            }
          }}
          onBackToMap={() => setStage('map')}
          onStillAwake={() => setStillAwakePrompt(true)}
          stillAwakeContent={stillAwakePrompt && <div className="mt-4 space-y-2 rounded-2xl border border-indigo-800/60 p-3"><p className="text-xs text-slate-400"><BilingualLine english="Choose a bounded reset. The current audio is paused before the new activity starts." /></p>{tonightOptions.map(([value, label]) => <Choice key={value} onClick={() => void chooseTonight(value, true)}>{label}</Choice>)}</div>}
        />
      </CompanionShell>
    );
  }

  if (stage === 'plan' && activeModule) return <CompanionShell onBackToMap={() => setStage('map')}><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">{isStillAwake ? <BilingualLine english="Still awake reset" /> : <BilingualLine english="Night 1 plan" />} · {moduleIndex + 1} of {plan?.modules.length} · <BilingualLine english="optional" /></p>{moduleIndex === 0 && plan?.explanation && <div className="mt-4 rounded-2xl border border-teal-900/60 bg-teal-950/20 p-4 text-sm leading-6 text-slate-200"><p className="font-bold text-teal-200"><BilingualLine english="Why this is suggested" /></p><p className="mt-2"><BilingualLine english={plan.explanation} /></p></div>}<h2 className="mt-5 text-3xl font-black text-white"><BilingualLine english={activeModule.title} /></h2><p className="mt-2 text-xs text-slate-400">About {activeDuration} min · <BilingualLine english="choose what feels useful" /></p><p className="mt-4 text-base leading-7 text-slate-200"><BilingualLine english={activeModule.instruction} /></p><p className="mt-4 rounded-2xl border border-indigo-800/60 bg-indigo-950/40 p-4 text-sm leading-6 text-indigo-100"><BilingualLine english={activeModule.opening} /></p>{activeKind === 'writing' && <label className="mt-5 block text-sm font-semibold text-slate-200"><BilingualLine english="One short note (optional)" /><input type="text" value={moduleNote} maxLength={140} onChange={event => setModuleNote(event.target.value)} placeholder="A few words are enough" className="mt-2 min-h-12 w-full rounded-xl border border-indigo-800 bg-[#080b15] px-4 text-white outline-none focus:border-teal-300" /><span className="mt-2 block text-xs text-slate-500"><BilingualLine english="You can use paper instead. This note is not sent to analytics or saved to your profile." /></span></label>}{activeKind === 'choice' && <div className="mt-5 space-y-2">{(activeModule.module_id === 'quiet_activity' ? quietActivityOptions : routineCueOptions).map(option => <Choice key={option} selected={moduleChoice === option} onClick={() => setModuleChoice(option)}>{option}</Choice>)}</div>}{activeScript && <details className="mt-5 rounded-2xl border border-indigo-800/60 bg-[#080b15] p-4"><summary className="cursor-pointer text-sm font-bold text-teal-200"><BilingualLine english="Read the text guidance" /></summary><div className="mt-3 space-y-3 text-sm leading-6 text-slate-300"><p><BilingualLine english="Voice audio is not available in this workspace yet. Follow the text at your own pace." /></p><p><BilingualLine english={activeModule.opening} /></p><p><BilingualLine english={activeModule.instruction} /></p></div></details>}{activeAudio && <div className="mt-5 rounded-2xl border border-indigo-800/60 bg-[#080b15] p-4"><p className="text-sm font-bold text-white"><BilingualLine english="Background sound only" /></p><p className="mt-1 text-xs leading-5 text-slate-400"><BilingualLine english="Quiet ocean sound · 6.4 minutes · no voice track" /></p><audio key={audioRetry} controls preload="metadata" className="mt-3 w-full" src="/audio/night-companion/ocean-waves.ogg" onError={() => setAudioErrorModule(activeModule.module_id)} /><p className="mt-2 text-xs leading-5 text-slate-400"><BilingualLine english="No autoplay. Play, pause, seek, or stop whenever you want." /></p>{activeAudioError && <div className="mt-3 rounded-xl border border-rose-800/60 bg-rose-950/30 p-3 text-sm text-rose-200"><BilingualLine english="This audio could not be loaded. Check your connection and try again." /><button type="button" onClick={() => { setAudioErrorModule(''); setAudioRetry(value => value + 1); }} className="mt-2 underline"><BilingualLine english="Retry" /></button></div>}</div>}<p className="mt-4 text-sm leading-6 text-slate-400"><BilingualLine english={activeModule.closing} /></p><button type="button" onClick={() => void completeModule()} className="companion-button mt-6"><BilingualLine english={activeModule.action_label} /></button>{plan.modules.some(m => m.module_id === 'calming_audio') && activeModule.module_id !== 'calming_audio' && (<button type="button" onClick={() => { const audioIdx = plan.modules.findIndex(m => m.module_id === 'calming_audio'); if (audioIdx >= 0) { setModuleIndex(audioIdx); void persistProgress(plan, usedModules, 'plan', audioIdx); } }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/70 bg-teal-950/40 px-4 py-3 text-sm font-bold text-teal-200 hover:bg-teal-900/60"><BilingualLine english="Listen now (skip prep)" /></button>)}<button type="button" onClick={() => void skipModule()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-800 px-4 py-3 text-sm font-bold text-indigo-200"><PauseCircle className="h-4 w-4" /><BilingualLine english={activeModule.skip_label} /></button><button type="button" onClick={stopForTonight} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-900 px-4 py-3 text-sm text-slate-400"><Square className="h-3.5 w-3.5" /><BilingualLine english="I’m done for tonight" /></button><button type="button" onClick={() => setStillAwakePrompt(value => !value)} className="mt-3 w-full text-sm font-bold text-indigo-300 underline underline-offset-4"><BilingualLine english="I’m still awake" /></button>{stillAwakePrompt && <div className="mt-4 space-y-2 rounded-2xl border border-indigo-800/60 p-3"><p className="text-xs text-slate-400"><BilingualLine english="Choose a bounded reset. Starting it will replace this activity." /></p>{tonightOptions.map(([value, label]) => <Choice key={value} onClick={() => void chooseTonight(value, true)}>{label}</Choice>)}</div>}</CompanionShell>;
  if (stage === 'review' && plan && state) return <CompanionShell onBackToMap={() => setStage('map')}><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="Night 1 review · optional" /></p><h2 className="mt-2 text-3xl font-black text-white"><BilingualLine english="How did tonight feel?" /></h2>{completionStatus !== 'completed' && <p className="mt-3 rounded-xl border border-indigo-800/60 bg-indigo-950/40 p-3 text-sm leading-6 text-slate-300"><BilingualLine english="You chose to stop before finishing the plan. Nothing is saved as complete until you choose an option below." /></p>}<div className="mt-5 grid grid-cols-3 gap-2">{(['BETTER', 'SAME', 'WORSE'] as const).map(value => <Choice key={value} selected={reviewOverall === value} onClick={() => setReviewOverall(value)}>{value}</Choice>)}</div><div className="mt-7 space-y-4"><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300"><BilingualLine english="Module feedback" /></h3>{plan.modules.map(module => <div key={module.module_id} className="border-b border-indigo-900/60 pb-3"><p className="text-sm font-bold text-white"><BilingualLine english={module.title} /></p><div className="mt-2 flex gap-2">{(['YES', 'A_LITTLE', 'NO'] as const).map(value => <button key={value} type="button" onClick={() => setHelpfulness(current => ({ ...current, [module.module_id]: value }))} className={`rounded-lg border px-3 py-2 text-xs font-bold ${helpfulness[module.module_id] === value ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-indigo-800 text-slate-300'}`}>{value === 'A_LITTLE' ? 'A LITTLE' : value}</button>)}</div></div>)}</div><div className="mt-6 grid gap-2"><button type="button" onClick={() => void saveReview()} className="companion-button"><BilingualLine english="Save review" /></button><button type="button" onClick={() => void saveReview('partial')} className="rounded-xl border border-indigo-800 px-4 py-3 text-sm font-bold text-indigo-200"><BilingualLine english="Save and rest" /></button></div><p className="mt-4 text-xs leading-5 text-slate-500"><BilingualLine english="You can leave the review now. It is not a condition for resting." /></p>{error && <p className="mt-4 text-sm text-rose-300"><BilingualLine english={error} /></p>}</CompanionShell>;
  return null;
}

function SupportNote() { return <p className="mt-5 text-xs leading-5 text-slate-500"><BilingualLine english="If sleep trouble lasts for months, affects daytime life, or comes with loud snoring, pauses, or gasping, consider speaking with a healthcare professional." /></p>; }
function CompanionShell({ children, onBackToMap }: { children: React.ReactNode; onBackToMap?: () => void }) {
  return (
    <section className="mx-auto my-3 sm:my-4 w-full max-w-xl rounded-2xl border border-teal-900/50 bg-[#0c1222] p-4 sm:p-5 shadow-2xl shadow-indigo-950/30">
      <div className="mb-3.5 flex items-center justify-between text-xs font-bold tracking-[0.16em] text-indigo-200">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-teal-300" />
          <span>NIGHT COMPANION BETA</span>
        </div>
        {onBackToMap && (
          <button
            type="button"
            onClick={onBackToMap}
            className="flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-teal-200"
          >
            <Map className="h-3 w-3" />
            <BilingualLine english="Journey Map" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
function Field({ label, value, onChange, type = 'time' }: { label: string; value: string; onChange: (value: string) => void; type?: 'time' | 'text' }) { return <label className="block text-sm font-semibold text-slate-200"><BilingualLine english={label} /> <input type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-indigo-800 bg-[#080b15] px-4 text-white outline-none focus:border-teal-300" /></label>; }
function Choice({ children, selected, onClick }: { children: React.ReactNode; selected?: boolean; onClick: () => void }) { const english = typeof children === 'string' ? children : ''; return <button type="button" onClick={onClick} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-indigo-800 bg-indigo-950/40 text-slate-200 hover:border-indigo-500'}`}>{english ? <BilingualLine english={english} /> : children}{selected && <Check className="h-4 w-4 shrink-0" />}</button>; }
