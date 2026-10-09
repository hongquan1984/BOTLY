import type { FactorLevel, NightPatternResult, PatternId } from './night-pattern';

export type LastHourBehavior = 'scrolling' | 'checking_work' | 'unfinished_thoughts' | 'relaxing' | 'inconsistent_routine' | 'other';
export type SleepDoesntCome = 'thoughts_busier' | 'check_phone' | 'check_time' | 'try_harder' | 'get_up' | 'varies';
export type TonightStateId = 'MIND_WONT_STOP' | 'SLEEP_ANXIETY' | 'NOT_SLEEPY' | 'WOKE_UP' | 'STRESS_CARRYOVER';
export type ModuleId = 'mental_unload' | 'tomorrow_list' | 'guided_downshift' | 'calming_audio' | 'reduce_sleep_pressure' | 'decompression' | 'screen_transition' | 'back_to_sleep' | 'quiet_activity' | 'routine_cue';
export type Helpfulness = 'YES' | 'A_LITTLE' | 'NO';
export type CompletionStatus = 'completed' | 'partial' | 'skipped';
export type NightModuleKind = 'writing' | 'guided' | 'choice' | 'audio' | 'action';

export type OperationalSetup = { desired_bedtime: string; usual_wake_time: string; last_hour_behaviors: LastHourBehavior[]; sleep_doesnt_come: SleepDoesntCome };
export type NightProfile = { profile_id: string; created_at: string; quiz_result: Pick<NightPatternResult, 'primary_pattern' | 'secondary_pattern' | 'factors' | 'primary_goal' | 'source_intent'>; operational_setup: OperationalSetup };
export type TonightState = { night_number: 1; current_state: TonightStateId; selected_at: string };
export type NightPlanModule = { module_id: ModuleId; title: string; instruction: string; action_label: string; kind: NightModuleKind; duration_minutes: number; opening: string; closing: string; skip_label: string; audio_asset_id?: string };
export type NightPlan = { night_number: 1; modules: NightPlanModule[]; created_at: string; source: 'deterministic_rule_engine'; reason_code?: string; explanation?: string; explanation_vi?: string };
export type ModuleFeedback = { module_id: ModuleId; used: boolean; helpfulness: Helpfulness };
export type NightReview = { night_number: 1; overall: 'BETTER' | 'SAME' | 'WORSE'; completion_status: CompletionStatus; module_feedback: ModuleFeedback[]; created_at: string };
export type PostListenFeedback = 'A_LITTLE' | 'NOT_MUCH' | 'NOT_FOR_ME' | 'NOT_ENOUGH';

export type NightCompanionState = {
  profile: NightProfile;
  tonight_state?: TonightState;
  night_one_plan?: NightPlan;
  module_feedback: ModuleFeedback[];
  review?: NightReview;
  resume_stage?: 'intro' | 'tonight' | 'plan' | 'resting' | 'review' | 'feedback' | 'done';
  active_module_index?: number;
  post_listen_feedback?: PostListenFeedback;
  last_session_has_listened?: boolean;
  night1_intro_seen?: boolean;
};

export function normalizeNightCompanionState(raw: unknown): NightCompanionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<NightCompanionState> & Partial<NightProfile>;
  if (value.profile && typeof value.profile === 'object' && 'quiz_result' in value.profile) return value as NightCompanionState;
  if ('quiz_result' in value && 'operational_setup' in value) return { profile: value as NightProfile, module_feedback: [], resume_stage: 'intro' };
  return null;
}

const baseModules: Record<ModuleId, NightPlanModule> = {
  mental_unload: { module_id: 'mental_unload', title: 'Mental unload', instruction: 'Write one short label for the open loop, then let it be enough for tonight.', action_label: 'Park it for tomorrow', kind: 'writing', duration_minutes: 2, opening: 'You do not need to solve the thought here. A short label is enough.', closing: 'That open loop has a place to wait. You can return to the rest of tonight without carrying it in working memory.', skip_label: 'Skip writing' },
  tomorrow_list: { module_id: 'tomorrow_list', title: 'Tomorrow list', instruction: 'Write one small next step for tomorrow. Keep it concrete and small.', action_label: 'Choose one next step', kind: 'writing', duration_minutes: 2, opening: 'One next step is enough. This is a reminder, not a plan to finish tonight.', closing: 'The next step is noted. The rest can wait for daylight.', skip_label: 'Skip the list' },
  guided_downshift: { module_id: 'guided_downshift', title: 'Gentle breathing', instruction: 'Follow the words at your own pace. Let the breath stay comfortable; return to natural breathing whenever you want.', action_label: 'Finish the downshift', kind: 'guided', duration_minutes: 5, opening: 'Nothing to force. Let the next comfortable breath be enough.', closing: 'Let the exercise end without checking whether it worked. Rest can be the next thing.', skip_label: 'Skip breathing' },
  calming_audio: { module_id: 'calming_audio', title: 'Quiet ocean sound', instruction: 'Play a steady, low-demand sound if it feels useful. Keep the volume comfortable, and stop whenever you want.', action_label: 'Finish with sound', kind: 'audio', duration_minutes: 6.4, opening: 'This is optional background sound, not a test to complete.', closing: 'You can leave the sound playing, pause it, or stop here. There is nothing else you must do.', skip_label: 'Skip audio', audio_asset_id: 'night1-ocean-waves-cc0' },
  reduce_sleep_pressure: { module_id: 'reduce_sleep_pressure', title: 'Reduce sleep pressure', instruction: 'For this moment, replace “I must sleep” with “I can rest without forcing it.” Notice which version feels less demanding.', action_label: 'Release the pressure', kind: 'guided', duration_minutes: 2, opening: 'The aim is not to make sleep happen. It is to make this moment less of a performance.', closing: 'You can rest without measuring the result. If you stay awake, choose what feels kind and low effort next.', skip_label: 'Skip this step' },
  decompression: { module_id: 'decompression', title: 'Body unwind', instruction: 'Let your attention move through your jaw, shoulders, hands, and belly. Soften only what feels comfortable; do not force a stretch.', action_label: 'Finish body unwind', kind: 'guided', duration_minutes: 4, opening: 'You do not have to relax perfectly. Notice one place that can soften by a small amount.', closing: 'Let your body return to its own position. There is no need to check for a particular feeling.', skip_label: 'Skip body unwind' },
  screen_transition: { module_id: 'screen_transition', title: 'Screen transition', instruction: 'Put the next piece of content down. Dim the screen or place the phone out of reach, then make one small move toward your sleep space.', action_label: 'Make the transition', kind: 'action', duration_minutes: 1, opening: 'Choose the smallest change that makes the next few minutes quieter.', closing: 'The transition is complete when you decide it is. You do not need to make the whole night perfect.', skip_label: 'Skip transition' },
  back_to_sleep: { module_id: 'back_to_sleep', title: 'Back to rest', instruction: 'Keep the goal small: soften your attention and give the night time to continue. If you remain awake and become frustrated, leave the bed for a quiet activity and return when sleepy.', action_label: 'Try the reset', kind: 'guided', duration_minutes: 3, opening: 'Waking is not a task to solve. Start with one comfortable breath and a softer goal.', closing: 'If sleep does not return, that is information, not failure. Choose a quiet, low-stimulation activity instead of forcing it.', skip_label: 'Skip reset' },
  quiet_activity: { module_id: 'quiet_activity', title: 'Quiet activity', instruction: 'Choose one low-stimulation activity for a few minutes without checking the time. Return to bed when you feel sleepier.', action_label: 'Choose quiet activity', kind: 'choice', duration_minutes: 10, opening: 'This is a change of setting, not a punishment and not a race.', closing: 'When sleepiness returns, you can return to bed. If it does not, keep the activity quiet and comfortable.', skip_label: 'Skip activity' },
  routine_cue: { module_id: 'routine_cue', title: 'Routine cue', instruction: 'Choose one repeatable cue that tells your evening the active part of the day is closing.', action_label: 'Choose tonight’s cue', kind: 'choice', duration_minutes: 2, opening: 'One small cue is more useful than a perfect bedtime routine.', closing: 'You have chosen a cue to test tonight. You can adjust it another evening.', skip_label: 'Skip routine cue' },
};

const patternBase: Record<PatternId, ModuleId[]> = {
  RACING_MIND: ['mental_unload', 'tomorrow_list', 'calming_audio'],
  SLEEP_ANXIETY: ['reduce_sleep_pressure', 'guided_downshift', 'calming_audio'],
  STRESS_CARRYOVER: ['decompression', 'mental_unload', 'calming_audio'],
  BEDTIME_PROCRASTINATION: ['screen_transition', 'guided_downshift', 'routine_cue'],
  NIGHT_WAKING: ['back_to_sleep', 'quiet_activity', 'calming_audio'],
  SLEEP_RHYTHM: ['routine_cue', 'guided_downshift', 'calming_audio'],
};

const stateOverrides: Record<TonightStateId, ModuleId> = { MIND_WONT_STOP: 'mental_unload', SLEEP_ANXIETY: 'reduce_sleep_pressure', NOT_SLEEPY: 'quiet_activity', WOKE_UP: 'back_to_sleep', STRESS_CARRYOVER: 'decompression' };
function uniqueModules(ids: ModuleId[]): ModuleId[] { return ids.filter((id, index) => ids.indexOf(id) === index).slice(0, 3); }

function explainPlan(profile: NightProfile, state: TonightStateId) {
  const setup = profile?.operational_setup;
  if (state === 'MIND_WONT_STOP' && setup && (setup.last_hour_behaviors?.includes('unfinished_thoughts') || setup.sleep_doesnt_come === 'thoughts_busier')) {
    return {
      reason_code: 'unfinished_thoughts',
      explanation: 'Your thoughts are still running with today’s unfinished things. We start with a brief option to park thoughts for tonight, then move into calm audio without forcing your mind to be silent.',
      explanation_vi: 'Những suy nghĩ về việc chưa xong vẫn còn hoạt động. Chúng ta bắt đầu bằng bước tạm cất suy nghĩ tùy chọn, sau đó vào bài nghe êm dịu mà không ép tâm trí phải im bặt.',
    };
  }
  if (state === 'MIND_WONT_STOP') {
    return {
      reason_code: 'busy_mind',
      explanation: 'Your mind is active tonight. Instead of trying to stop your thoughts, we acknowledge them and move to a gentle breathing rhythm.',
      explanation_vi: 'Đầu óc bạn đang còn nhiều hoạt động tối nay. Thay vì cố dừng suy nghĩ, chúng ta công nhận chúng và chuyển sang nhịp thở êm dịu.',
    };
  }
  if (state === 'SLEEP_ANXIETY') {
    return {
      reason_code: 'sleep_pressure',
      explanation: 'You are feeling pressure about falling asleep. Tonight is about resting comfortably, not making sleep happen on a schedule.',
      explanation_vi: 'Bạn đang cảm thấy áp lực về việc phải ngủ. Tối nay mục tiêu là nghỉ ngơi thoải mái, không phải ép giấc ngủ đến theo lịch trình.',
    };
  }
  if (state === 'STRESS_CARRYOVER') {
    return {
      reason_code: 'day_carryover',
      explanation: 'You are still holding stress from the day. We offer a brief body unwind for your shoulders and jaw, then rest with calming guidance.',
      explanation_vi: 'Bạn vẫn còn mang theo căng thẳng từ ban ngày. Chúng ta có thể thả lỏng nhanh ở vai và hàm, sau đó nghỉ ngơi cùng lời dẫn êm dịu.',
    };
  }
  if (state === 'NOT_SLEEPY') {
    return {
      reason_code: 'not_sleepy',
      explanation: 'You feel tired but not sleepy. Give your eyes and body a quiet break without forcing sleep before you are ready.',
      explanation_vi: 'Bạn cảm thấy mệt nhưng chưa buồn ngủ. Hãy cho mắt và cơ thể nghỉ ngơi yên tĩnh mà không cần ép ngủ trước khi sẵn sàng.',
    };
  }
  if (state === 'WOKE_UP') {
    return {
      reason_code: 'night_waking',
      explanation: 'You woke up in the night. Keep the room dim, avoid checking the clock, and let quiet audio welcome you back to rest.',
      explanation_vi: 'Bạn tỉnh giấc giữa đêm. Hãy giữ phòng tối, không kiểm tra đồng hồ và để bài nghe êm dịu đưa bạn trở lại với sự nghỉ ngơi.',
    };
  }
  return {
    reason_code: 'default',
    explanation: 'A gentle transition into rest with comfortable breathing and quiet sound.',
    explanation_vi: 'Chuyển đổi nhẹ nhàng sang trạng thái nghỉ ngơi với nhịp thở dễ chịu và âm thanh êm dịu.',
  };
}

export function createNightProfile(profileId: string, result: NightPatternResult, setup: OperationalSetup, createdAt = new Date().toISOString()): NightProfile {
  return { profile_id: profileId, created_at: createdAt, quiz_result: { primary_pattern: result.primary_pattern, secondary_pattern: result.secondary_pattern, factors: result.factors, primary_goal: result.primary_goal, source_intent: result.source_intent }, operational_setup: setup };
}

export function selectNightOnePlan(profile: NightProfile, tonightState: TonightState, createdAt = new Date().toISOString()): NightPlan {
  const stateId = tonightState.current_state;
  let prepModuleId: ModuleId | null = null;

  if (stateId === 'MIND_WONT_STOP') prepModuleId = 'mental_unload';
  else if (stateId === 'SLEEP_ANXIETY') prepModuleId = 'reduce_sleep_pressure';
  else if (stateId === 'STRESS_CARRYOVER') prepModuleId = 'decompression';
  else if (stateId === 'NOT_SLEEPY') prepModuleId = 'quiet_activity';
  else if (stateId === 'WOKE_UP') prepModuleId = null; // straight to audio!

  const modules: NightPlanModule[] = [];
  if (prepModuleId) {
    modules.push(baseModules[prepModuleId]);
  }
  modules.push(baseModules.calming_audio);

  const explanation = explainPlan(profile, stateId);
  return {
    night_number: 1,
    modules,
    created_at: createdAt,
    source: 'deterministic_rule_engine',
    ...explanation,
  };
}

export function selectStillAwakePlan(state: TonightStateId, createdAt = new Date().toISOString()): NightPlan {
  const modules: NightPlanModule[] = [];
  if (state === 'WOKE_UP') {
    modules.push(baseModules.calming_audio);
  } else if (state === 'MIND_WONT_STOP') {
    modules.push(baseModules.mental_unload, baseModules.calming_audio);
  } else if (state === 'SLEEP_ANXIETY') {
    modules.push(baseModules.reduce_sleep_pressure, baseModules.calming_audio);
  } else if (state === 'STRESS_CARRYOVER') {
    modules.push(baseModules.decompression, baseModules.calming_audio);
  } else if (state === 'NOT_SLEEPY') {
    modules.push(baseModules.quiet_activity, baseModules.calming_audio);
  }
  return {
    night_number: 1,
    modules,
    created_at: createdAt,
    source: 'deterministic_rule_engine',
    ...explainPlan({} as NightProfile, state),
  };
}

export function sanitizeReview(review: NightReview): NightReview {
  return { night_number: 1, overall: review.overall, completion_status: review.completion_status, module_feedback: review.module_feedback.map(item => ({ module_id: item.module_id, used: Boolean(item.used), helpfulness: item.helpfulness })), created_at: review.created_at };
}

export const MODULE_IDS = Object.keys(baseModules) as ModuleId[];
export const TONIGHT_STATE_IDS = Object.keys(stateOverrides) as TonightStateId[];
export type { FactorLevel };
