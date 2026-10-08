import type { ModuleId, TonightStateId } from './night-companion';

export const SUPABASE_AUDIO_BASE = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')}/storage/v1/object/public/night-companion-audio/`;

export type NightScript = {
  id: string;
  version: string;
  module_id: ModuleId;
  suitable_states: TonightStateId[];
  goal: string;
  transcript: string[];
  pause_direction: string;
  duration_minutes: number;
  opening: string;
  closing: string;
  skip_or_stop: string;
  sources: string[];
  expert_review: string;
};

export const NIGHT_ONE_SCRIPTS: Record<string, NightScript> = {
  gentle_breathing_v1: {
    id: 'gentle_breathing_v1', version: '1.0.0', module_id: 'guided_downshift',
    suitable_states: ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'STRESS_CARRYOVER'],
    goal: 'Offer a comfortable attention anchor without forcing a pace or breath depth.',
    transcript: [
      'Settle in any position that feels comfortable. You do not need to close your eyes.',
      'Let the next breath be ordinary. Notice the air moving in and out without trying to improve it.',
      'If it feels comfortable, allow the inhale to come in gently through the nose and let the exhale leave easily. If not, breathe in your usual way.',
      'You may count softly from one to five on the inhale and one to five on the exhale. Counting is optional, and reaching five is not a goal.',
      'If the count or the breathing feels uncomfortable, stop counting and return to natural breathing.',
      'Stay for a few more comfortable breaths. There is nothing to achieve and no need to check whether sleep is happening.',
    ],
    pause_direction: 'Leave 5 to 8 seconds after each sentence; leave 20 seconds after the optional count instruction.',
    duration_minutes: 5,
    opening: 'Nothing to force. Let the next comfortable breath be enough.',
    closing: 'Let the exercise end without checking whether it worked. Rest can be the next thing.',
    skip_or_stop: 'Stop if breathing becomes uncomfortable, dizzy, anxious, or effortful. Return to natural breathing or skip the module.',
    sources: ['NHS breathing exercises for stress (comfortable depth, optional counting, repeat for at least 5 minutes)', 'NCCIH relaxation techniques (limited/low-quality sleep evidence; safety boundary)'],
    expert_review: 'Clinician or respiratory-health review recommended before publishing as voice guidance.',
  },
  reduce_sleep_pressure_v1: {
    id: 'reduce_sleep_pressure_v1', version: '1.0.0', module_id: 'reduce_sleep_pressure',
    suitable_states: ['SLEEP_ANXIETY', 'WOKE_UP'],
    goal: 'Reduce the demand to make sleep happen right now.',
    transcript: [
      'Notice the sentence: “I must sleep now.” You do not have to argue with it.',
      'Try a gentler option: “I can rest without forcing sleep.”',
      'Let that sentence be an option, not a rule. You can be awake and still choose a quieter next moment.',
      'If frustration builds, leave the bed for a calm, low-stimulation activity and return when you feel sleepier.',
    ],
    pause_direction: 'Leave 8 seconds after each sentence; leave 15 seconds before the final suggestion.',
    duration_minutes: 2,
    opening: 'The aim is not to make sleep happen. It is to make this moment less of a performance.',
    closing: 'You can rest without measuring the result. Choose what feels kind and low effort next.',
    skip_or_stop: 'Skip or stop if the wording feels unhelpful. Choose your own neutral sentence instead.',
    sources: ['NHS sleep guidance (do not force sleep; choose a relaxing activity if awake)', 'NHLBI insomnia treatment (sleep habits and stimulus-control description)'],
    expert_review: 'Sleep clinician review recommended; this is intentionally not presented as CBT-I.',
  },
  body_unwind_v1: {
    id: 'body_unwind_v1', version: '1.0.0', module_id: 'decompression',
    suitable_states: ['STRESS_CARRYOVER', 'MIND_WONT_STOP'],
    goal: 'Offer a brief, non-demanding body attention shift after a stressful day.',
    transcript: [
      'Notice your jaw. If it is comfortable, let it unclench by a small amount.',
      'Notice your shoulders. Let them be supported rather than asking them to hold the day.',
      'Notice your hands and belly. There is no need to change them; allow one easy breath.',
      'Move only in ways that feel comfortable. This is noticing, not stretching or fixing.',
      'Let your body return to its own position and choose what feels easiest next.',
    ],
    pause_direction: 'Leave 6 to 10 seconds after each body-area cue.',
    duration_minutes: 4,
    opening: 'You do not have to relax perfectly. Notice one place that can soften by a small amount.',
    closing: 'Let your body return to its own position. There is no need to check for a particular feeling.',
    skip_or_stop: 'Stop if body attention increases distress, pain, or intrusive memories. Choose a neutral activity instead.',
    sources: ['NCCIH relaxation techniques (generally safe for healthy people, but occasional negative experiences can occur)', 'NHLBI insomnia treatment (wind-down activities as a sleep-habit example)'],
    expert_review: 'Trauma-informed and physiotherapy-informed review recommended.',
  },
  back_to_rest_v1: {
    id: 'back_to_rest_v1', version: '1.0.0', module_id: 'back_to_sleep',
    suitable_states: ['WOKE_UP', 'SLEEP_ANXIETY'],
    goal: 'Make returning to rest a small choice rather than a demand.',
    transcript: [
      'Waking up is not a problem you have to solve immediately.',
      'Let your attention rest on one ordinary sensation: the mattress, the blanket, or a comfortable breath.',
      'You do not need to check the time. If sleep returns, let it return. If it does not, stay with a quiet next step.',
      'If you become frustrated, get up for a calm, low-stimulation activity and return when you feel sleepy.',
    ],
    pause_direction: 'Leave 8 seconds after each sentence; leave 20 seconds after the final choice.',
    duration_minutes: 3,
    opening: 'Waking is not a task to solve. Start with one comfortable breath and a softer goal.',
    closing: 'If sleep does not return, that is information, not failure. Choose a quiet activity instead of forcing it.',
    skip_or_stop: 'Stop as soon as you want. The module is optional and does not need to be completed for the night to count.',
    sources: ['NHS sleep guidance (avoid forcing sleep; get up for a relaxing activity if awake)', 'NHLBI insomnia treatment (stimulus-control description)'],
    expert_review: 'Sleep clinician review recommended.',
  },
};

export const MODULE_SCRIPT: Partial<Record<ModuleId, NightScript>> = {
  guided_downshift: NIGHT_ONE_SCRIPTS.gentle_breathing_v1,
  reduce_sleep_pressure: NIGHT_ONE_SCRIPTS.reduce_sleep_pressure_v1,
  decompression: NIGHT_ONE_SCRIPTS.body_unwind_v1,
  back_to_sleep: NIGHT_ONE_SCRIPTS.back_to_rest_v1,
};

export interface NightIntroTrack {
  asset_id: string;
  target_state: TonightStateId | 'GENERAL';
  local_path: string;
  title_en: string;
  title_vi: string;
  transcript_en: string;
  transcript_vi: string;
  duration_seconds: number;
}

export const NIGHT_ONE_INTROS: Record<string, NightIntroTrack> = {
  GENERAL: {
    asset_id: 'night1_intro_general_en_v1',
    target_state: 'GENERAL',
    local_path: '/audio/night-companion/intro/night1_intro_general_en_v1.mp3',
    title_en: 'General Welcome & Gentle Settling',
    title_vi: 'Lời mở đầu chung & Thả lỏng nhẹ nhàng',
    transcript_en: "Welcome. For the next few minutes, there's nothing else you need to finish. Find a position that feels comfortable. You can close your eyes if you like, or keep them open. Let your breathing stay natural for now. You don't need to force sleep. This is simply a little time to rest.",
    transcript_vi: "Chào mừng bạn. Trong vài phút tới, bạn không còn việc gì cần phải hoàn thành. Hãy tìm một tư thế nằm thật thoải mái. Bạn có thể nhắm mắt lại nếu muốn, hoặc mở mắt. Cứ để hơi thở tự nhiên như vốn có. Bạn không cần phải ép mình ngủ. Đây đơn giản là một khoảng thời gian nhỏ để bạn được nghỉ ngơi.",
    duration_seconds: 23.76,
  },
  MIND_WONT_STOP: {
    asset_id: 'night1_intro_mind_wont_stop_en_v2',
    target_state: 'MIND_WONT_STOP',
    local_path: '/audio/night-companion/intro/night1_intro_mind_wont_stop_en_v2.mp3',
    title_en: 'Busy Mind Settling',
    title_vi: 'Lời mở đầu khi tâm trí bận rộn',
    transcript_en: 'Welcome. You mentioned that your mind feels busy tonight. For the next few minutes, you don’t need to work through every thought. Let’s begin gently, with no need to force sleep.',
    transcript_vi: 'Chào bạn. Bạn chia sẻ rằng tâm trí đang bận rộn tối nay. Trong vài phút tới, bạn không cần giải quyết từng suy nghĩ. Mình bắt đầu nhẹ nhàng, không cần cố ngủ.',
    duration_seconds: 13.76,
  },
  SLEEP_ANXIETY: {
    asset_id: 'night1_intro_sleep_anxiety_en_v1',
    target_state: 'SLEEP_ANXIETY',
    local_path: '/audio/night-companion/intro/night1_intro_sleep_anxiety_en_v1.mp3',
    title_en: 'Sleep Anxiety Downshift',
    title_vi: 'Lời mở đầu giảm áp lực phải ngủ',
    transcript_en: "Welcome. You don't need to make sleep happen during this practice. There is nothing to achieve or get right. Find a restful position, let your shoulders drop, and simply allow yourself a few minutes of quiet ease.",
    transcript_vi: "Chào mừng bạn. Bạn không cần phải cố làm cho giấc ngủ đến trong bài thực hành này. Không có mục tiêu nào phải đạt hay phải làm cho đúng. Hãy chọn một tư thế thư thái, thả lỏng bờ vai và cho phép mình có vài phút nhẹ nhàng, êm dịu.",
    duration_seconds: 18.32,
  },
  STRESS_CARRYOVER: {
    asset_id: 'night1_intro_stress_carryover_en_v1',
    target_state: 'STRESS_CARRYOVER',
    local_path: '/audio/night-companion/intro/night1_intro_stress_carryover_en_v1.mp3',
    title_en: 'Stress Carryover Unwind',
    title_vi: 'Lời mở đầu xoa dịu căng thẳng trong ngày',
    transcript_en: "Welcome. If the day still feels close, we can begin with a little space to unwind. Settle in and notice your posture. You can let the tension soften without forcing it. Right now, there is nothing else you need to carry.",
    transcript_vi: "Chào mừng bạn. Nếu những chuyện trong ngày vẫn còn quẩn quanh, chúng ta có thể bắt đầu bằng một khoảng nhỏ để thả lỏng. Hãy nằm xuống và cảm nhận cơ thể. Bạn có thể để sự căng thẳng dịu bớt mà không cần gượng ép. Lúc này, bạn không còn phải gánh vác điều gì nữa.",
    duration_seconds: 18.32,
  },
  NOT_SLEEPY: {
    asset_id: 'night1_intro_not_sleepy_en_v1',
    target_state: 'NOT_SLEEPY',
    local_path: '/audio/night-companion/intro/night1_intro_not_sleepy_en_v1.mp3',
    title_en: 'Tired but Not Sleepy Ease',
    title_vi: 'Lời mở đầu khi chưa thấy buồn ngủ',
    transcript_en: "Welcome. If you don't feel sleepy yet, that is completely okay. You can take some quiet time here, rest your body, and return to sleep whenever you feel ready. There's no rush and nothing you need to force.",
    transcript_vi: "Chào mừng bạn. Nếu bạn chưa thấy buồn ngủ lúc này, điều đó hoàn toàn bình thường. Bạn có thể dành chút thời gian yên tĩnh ở đây, để cơ thể được nghỉ và quay lại ngủ khi sẵn sàng. Không cần vội vã và không có gì phải ép buộc.",
    duration_seconds: 18.24,
  },
  WOKE_UP: {
    asset_id: 'night1_intro_woke_up_en_v2',
    target_state: 'WOKE_UP',
    local_path: '/audio/night-companion/intro/night1_intro_woke_up_en_v2.mp3',
    title_en: 'Middle of the Night Resting',
    title_vi: 'Lời mở đầu khi tỉnh giấc giữa đêm',
    transcript_en: "Welcome. Waking up during the night happens to all of us. You don't need to restart your night or check the time. Settle into comfort, let your breath stay easy, and let rest be enough for now.",
    transcript_vi: "Chào bạn. Việc thức giấc giữa đêm là điều ai trong chúng ta cũng từng trải qua. Bạn không cần phải bắt đầu lại đêm nay hay nhìn đồng hồ. Hãy tìm một tư thế dễ chịu, để hơi thở êm dịu và để sự nghỉ ngơi là đủ lúc này.",
    duration_seconds: 16.96,
  },
};

export function selectNightOneIntro(state?: TonightStateId): NightIntroTrack {
  if (state && NIGHT_ONE_INTROS[state]) {
    return NIGHT_ONE_INTROS[state];
  }
  return NIGHT_ONE_INTROS.GENERAL;
}

export const NIGHT_ONE_AUDIO = {
  'night1-ocean-waves-cc0': {
    asset_id: 'night1-ocean-waves-cc0',
    local_path: '/audio/night-companion/ocean-waves.ogg',
    label: 'Quiet ocean sound',
    label_vi: 'Sóng biển nhiệt đới CC0',
    duration_seconds: 384.268,
    intended_use: 'Optional background sound for calming_audio; no autoplay and no completion requirement.',
    kind: 'background' as const,
  },
  'music-ocean-waves': {
    asset_id: 'music-ocean-waves',
    local_path: '/audio/night-companion/music/ocean-waves.mp3',
    label: 'Ocean waves · RMultimediaEU',
    label_vi: 'Sóng biển êm đềm',
    duration_seconds: 71.208,
    kind: 'background' as const,
  },
  'music-calming-rain': {
    asset_id: 'music-calming-rain',
    local_path: '/audio/night-companion/music/calming-rain.mp3',
    label: 'Calming rain · Liecio',
    label_vi: 'Mưa đêm êm dịu',
    duration_seconds: 108.669,
    kind: 'background' as const,
  },
  'music-nature-forest': {
    asset_id: 'music-nature-forest',
    local_path: '/audio/night-companion/music/nature-forest.mp3',
    label: 'Nature forest · SoundReality',
    label_vi: 'Rừng đêm thanh vắng',
    duration_seconds: 302.04,
    kind: 'background' as const,
  },
  'music-birds': {
    asset_id: 'music-birds',
    local_path: '/audio/night-companion/music/birds.mp3',
    label: 'Evening birds · Freesound',
    label_vi: 'Tiếng chim chiều',
    duration_seconds: 636.312,
    kind: 'background' as const,
  },
  'music-rain-sound': {
    asset_id: 'music-rain-sound',
    local_path: '/audio/night-companion/music/rain-sound.mp3',
    label: 'Rain sound · boons_freak',
    label_vi: 'Tiếng mưa rơi nhẹ',
    duration_seconds: 91.115,
    kind: 'background' as const,
  },
} as const;

export type NightOneBackgroundPreset = { id: string; label: string; label_vi: string; description: string; description_vi: string; asset_ids: string[] };
export const NIGHT_ONE_BACKGROUND_PRESETS: NightOneBackgroundPreset[] = [
  { id: 'ocean', label: 'Quiet ocean', label_vi: 'Sóng biển êm', description: 'Gentle, steady waves to anchor attention', description_vi: 'Tiếng sóng vỗ đều giúp tâm trí neo lại', asset_ids: ['music-ocean-waves'] },
  { id: 'rain', label: 'Gentle rain', label_vi: 'Mưa đêm êm', description: 'Soft rainfall for quiet contemplation', description_vi: 'Mưa rơi nhẹ nhàng tạo cảm giác an bình', asset_ids: ['music-calming-rain'] },
  { id: 'forest', label: 'Night forest', label_vi: 'Rừng đêm yên ả', description: 'Deep forest ambiance with subtle natural sounds', description_vi: 'Không gian tĩnh mịch của rừng cây ban đêm', asset_ids: ['music-nature-forest'] },
];

export interface NightVoiceTrack {
  asset_id: string;
  local_path: string;
  pacer_path: string;
  pacer_pattern: '5-5' | '4-7-8' | '4-4-4-4' | '4-2-6';
  pacer_title_en: string;
  pacer_title_vi: string;
  label: string;
  label_vi: string;
  duration_seconds: number;
  kind: 'voice';
  recommended: boolean;
  suitable_states: TonightStateId[];
}

// Keep this registry explicit.
export const NIGHT_ONE_VOICES: Record<string, NightVoiceTrack> = {
  'night1-guided-coherent-5-5': {
    asset_id: 'night1-guided-coherent-5-5',
    local_path: '/audio/night-companion/voice/guided-coherent-5-5.mp3',
    pacer_path: '/audio/night-companion/pacer/pacer-chime-coherent-5-5.mp3',
    pacer_pattern: '5-5',
    pacer_title_en: '432Hz Sleep Frequency & 5s In · 5s Out Gentle Waves (Soft volume)',
    pacer_title_vi: 'Nhạc tần số 432Hz ru ngủ & Sóng thở 5s Hít · 5s Thở (Âm lượng nhỏ dịu)',
    label: 'Coherent breathing 5–5',
    label_vi: 'Thở nhịp đều 5–5 (Khuyên dùng)',
    duration_seconds: 181.348,
    kind: 'voice',
    recommended: true,
    suitable_states: ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'WOKE_UP', 'STRESS_CARRYOVER', 'NOT_SLEEPY'],
  },
  'night1-guided-4-7-8': {
    asset_id: 'night1-guided-4-7-8',
    local_path: '/audio/night-companion/voice/guided-4-7-8.mp3',
    pacer_path: '/audio/night-companion/pacer/pacer-chime-4-7-8.mp3',
    pacer_pattern: '4-7-8',
    pacer_title_en: '432Hz Sleep Frequency & 4-7-8 Relaxing Waves (Soft volume)',
    pacer_title_vi: 'Nhạc tần số 432Hz ru ngủ & Sóng thư giãn 4-7-8 (Âm lượng nhỏ dịu)',
    label: '4–7–8 relaxing breathing',
    label_vi: 'Thở thư giãn 4–7–8',
    duration_seconds: 377.487,
    kind: 'voice',
    recommended: false,
    suitable_states: ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'WOKE_UP', 'STRESS_CARRYOVER', 'NOT_SLEEPY'],
  },
  'night1-guided-box-4-4-4-4': {
    asset_id: 'night1-guided-box-4-4-4-4',
    local_path: '/audio/night-companion/voice/guided-box-4-4-4-4.mp3',
    pacer_path: '/audio/night-companion/pacer/pacer-chime-box-4-4-4-4.mp3',
    pacer_pattern: '4-4-4-4',
    pacer_title_en: '432Hz Sleep Frequency & Box 4-4-4-4 Waves (Soft volume)',
    pacer_title_vi: 'Nhạc tần số 432Hz ru ngủ & Sóng hộp 4-4-4-4 (Âm lượng nhỏ dịu)',
    label: 'Box breathing 4–4–4–4',
    label_vi: 'Thở hộp 4–4–4–4',
    duration_seconds: 185.063,
    kind: 'voice',
    recommended: false,
    suitable_states: ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'WOKE_UP', 'STRESS_CARRYOVER', 'NOT_SLEEPY'],
  },
  'night1-guided-4-2-6': {
    asset_id: 'night1-guided-4-2-6',
    local_path: '/audio/night-companion/voice/guided-4-2-6.mp3',
    pacer_path: '/audio/night-companion/pacer/pacer-chime-4-2-6.mp3',
    pacer_pattern: '4-2-6',
    pacer_title_en: '432Hz Sleep Frequency & 4-2-6 Downshift Waves (Soft volume)',
    pacer_title_vi: 'Nhạc tần số 432Hz ru ngủ & Sóng hạ áp 4-2-6 (Âm lượng nhỏ dịu)',
    label: '4–2–6 downshift breathing',
    label_vi: 'Thở hạ áp 4–2–6',
    duration_seconds: 12.053,
    kind: 'voice',
    recommended: false,
    suitable_states: ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'WOKE_UP', 'STRESS_CARRYOVER', 'NOT_SLEEPY'],
  },
};

export function selectNightOneVoiceOptions(state?: TonightStateId) {
  const allVoices = Object.values(NIGHT_ONE_VOICES);
  if (!state) return allVoices;
  const filtered = allVoices.filter(voice => voice.suitable_states.includes(state));
  return filtered.length > 0 ? filtered : allVoices;
}

// Stage 3: Cognitive Pivot & Paradoxical Whispers (Min 25 - 40)
export interface CognitivePivotTrack {
  asset_id: string;
  local_path: string;
  state: TonightStateId;
  title_en: string;
  subtitle_en: string;
  technique: 'cognitive_shuffle' | 'paradoxical_intention' | 'midnight_reassurance' | 'somatic_release' | 'nsdr_drift';
  duration_seconds: number;
}

export const COGNITIVE_PIVOT_TRACKS: Record<TonightStateId, CognitivePivotTrack> = {
  MIND_WONT_STOP: {
    asset_id: 'pivot-mind-wont-stop',
    local_path: '/audio/night-companion/pivot/pivot_mind_wont_stop.mp3',
    state: 'MIND_WONT_STOP',
    title_en: 'Cognitive Shuffle & Mind Wandering',
    subtitle_en: 'Random sensory imagery to disengage analytical thinking loops',
    technique: 'cognitive_shuffle',
    duration_seconds: 120,
  },
  SLEEP_ANXIETY: {
    asset_id: 'pivot-sleep-anxiety',
    local_path: '/audio/night-companion/pivot/pivot_sleep_anxiety.mp3',
    state: 'SLEEP_ANXIETY',
    title_en: 'Paradoxical Intention & Sleep Release',
    subtitle_en: 'Releasing the demand to sleep; passive physical restoration',
    technique: 'paradoxical_intention',
    duration_seconds: 70,
  },
  WOKE_UP: {
    asset_id: 'pivot-woke-up',
    local_path: '/audio/night-companion/pivot/pivot_woke_up.mp3',
    state: 'WOKE_UP',
    title_en: 'Midnight Awakening Reassurance',
    subtitle_en: 'Clock-check prevention and quiet nighttime sanctuary',
    technique: 'midnight_reassurance',
    duration_seconds: 48,
  },
  STRESS_CARRYOVER: {
    asset_id: 'pivot-stress-carryover',
    local_path: '/audio/night-companion/pivot/pivot_stress_carryover.mp3',
    state: 'STRESS_CARRYOVER',
    title_en: 'Somatic Decompression & Gravity Release',
    subtitle_en: 'Unclamping jaw, shoulders, and muscular holding patterns',
    technique: 'somatic_release',
    duration_seconds: 53,
  },
  NOT_SLEEPY: {
    asset_id: 'pivot-not-sleepy',
    local_path: '/audio/night-companion/pivot/pivot_not_sleepy.mp3',
    state: 'NOT_SLEEPY',
    title_en: 'Non-Sleep Deep Rest (NSDR) Drift',
    subtitle_en: 'Metabolic slow-down and restful alertness without strain',
    technique: 'nsdr_drift',
    duration_seconds: 49,
  },
};

export function selectCognitivePivotTrack(state?: TonightStateId): CognitivePivotTrack {
  if (state && COGNITIVE_PIVOT_TRACKS[state]) return COGNITIVE_PIVOT_TRACKS[state];
  return COGNITIVE_PIVOT_TRACKS.MIND_WONT_STOP;
}

// Stage 4: Deep Delta & Velvet Brown Noise (Min 40 - 55)
export const DEEP_DELTA_TRACK = {
  asset_id: 'delta-brown-noise',
  local_path: '/audio/night-companion/delta/deep_delta_brown_noise.mp3',
  title_en: '1.8Hz Deep Delta Waves & Velvet Brown Noise',
  subtitle_en: 'Slow-wave brain entrainment with acoustic masking for deep sleep',
  duration_seconds: 600,
} as const;

// Stage 5: Infinite Sleep Cocoon (Min 55 - 60+)
export const SLEEP_COCOON_TRACK = {
  asset_id: 'sleep-cocoon-continuous',
  local_path: '/audio/night-companion/cocoon/sleep_cocoon_continuous.mp3',
  title_en: 'Sub-Bass Sleep Cocoon',
  subtitle_en: 'Continuous acoustic cushion protecting deep uninterrupted sleep',
  duration_seconds: 600,
} as const;

export type SleepJourneyStageId = 'intro' | 'guided' | 'theta_drift' | 'cognitive_pivot' | 'delta_immersion' | 'sleep_cocoon';

export interface SleepJourneyStageInfo {
  id: SleepJourneyStageId;
  stageNumber: number;
  timeRange: string;
  name_en: string;
  description_en: string;
  scienceNote_en: string;
}

export const SLEEP_JOURNEY_STAGES: SleepJourneyStageInfo[] = [
  {
    id: 'intro',
    stageNumber: 1,
    timeRange: '0:00 - 0:20',
    name_en: 'State Intro',
    description_en: 'Personalized arrival and phone-down orientation',
    scienceNote_en: 'Initial boundary setting to break daytime momentum',
  },
  {
    id: 'guided',
    stageNumber: 1,
    timeRange: '0:20 - 6:00',
    name_en: 'Guided Breathing',
    description_en: 'Paced somatic downshift with real-time breathing visualizer',
    scienceNote_en: 'Vagal nerve stimulation; shifts autonomic nervous system to parasympathetic',
  },
  {
    id: 'theta_drift',
    stageNumber: 2,
    timeRange: '6:00 - 25:00',
    name_en: '432Hz Theta Drift',
    description_en: 'Harmonic 432Hz chimes and theta wave soundscape',
    scienceNote_en: 'Encourages transition from Alpha (8-12Hz) to Theta (4-7Hz) hypnagogic state',
  },
  {
    id: 'cognitive_pivot',
    stageNumber: 3,
    timeRange: '25:00 - 40:00',
    name_en: 'Cognitive Pivot',
    description_en: 'Whisper Cognitive Shuffle or Paradoxical Intention',
    scienceNote_en: 'Breaks the 30-min sleep-effort crisis and dissolves analytical loops',
  },
  {
    id: 'delta_immersion',
    stageNumber: 4,
    timeRange: '40:00 - 55:00',
    name_en: 'Deep Delta & Brown Noise',
    description_en: '1.8Hz binaural delta entrainment and warm low-frequency noise',
    scienceNote_en: 'Direct entrainment for N3 slow-wave deep sleep; sound masking prevents arousals',
  },
  {
    id: 'sleep_cocoon',
    stageNumber: 5,
    timeRange: '55:00 - 60:00+',
    name_en: 'Sleep Cocoon',
    description_en: 'Ultra-gentle sub-bass cushion running seamlessly all night',
    scienceNote_en: 'Sustained sleep protection and acoustic isolation throughout the night',
  },
];
