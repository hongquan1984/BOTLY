export type PatternId =
  | 'RACING_MIND'
  | 'SLEEP_ANXIETY'
  | 'STRESS_CARRYOVER'
  | 'BEDTIME_PROCRASTINATION'
  | 'NIGHT_WAKING'
  | 'SLEEP_RHYTHM';

export type FactorLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export type NightPatternAnswers = {
  gender: string;
  ageGroup: string;
  issues: string[];
  frequency: string;
  duration: string;
  sleepHours: string;
  bedtimeTension: string;
  racingThoughts: string;
  sleepSupport: string;
  concerns: string[];
  primaryGoal: string;
};

export type NightPatternResult = {
  primary_pattern: PatternId;
  secondary_pattern: PatternId | '';
  factors: {
    racing_thoughts: FactorLevel;
    bedtime_tension: FactorLevel;
    sleep_disruption: FactorLevel;
    routine_consistency: FactorLevel;
  };
  primary_goal: string;
  tonight_plan: { title: string; duration: string; description: string }[];
  source_intent: string;
  scores: Record<PatternId, number>;
};

const patternOrder: PatternId[] = [
  'RACING_MIND',
  'SLEEP_ANXIETY',
  'STRESS_CARRYOVER',
  'BEDTIME_PROCRASTINATION',
  'NIGHT_WAKING',
  'SLEEP_RHYTHM',
];

const plans: Record<PatternId, NightPatternResult['tonight_plan']> = {
  RACING_MIND: [
    { title: 'Mental Unload', duration: '2 min', description: 'Put the open loops down so your mind does not have to hold them in bed.' },
    { title: 'Guided Wind-down', duration: '5 min', description: 'A gentle transition from active thinking toward rest.' },
    { title: 'Calming Sleep Audio', duration: '20 min', description: 'Let a steady soundscape give your attention somewhere softer to land.' },
  ],
  SLEEP_ANXIETY: [
    { title: 'Reduce Sleep Pressure', duration: '2 min', description: 'Release the feeling that you have to force sleep right now.' },
    { title: 'Calming Exercise', duration: '4 min', description: 'A quiet body-based reset for bedtime tension.' },
    { title: 'Guided Wind-down', duration: '8 min', description: 'Ease into rest without measuring or chasing sleep.' },
  ],
  STRESS_CARRYOVER: [
    { title: 'Decompression', duration: '3 min', description: 'Create a small boundary between the day you had and the night ahead.' },
    { title: 'Mental Unload', duration: '2 min', description: 'Park unfinished tasks until tomorrow instead of carrying them to bed.' },
    { title: 'Calming Sleep Audio', duration: '20 min', description: 'A low-effort soundscape for a slower evening landing.' },
  ],
  BEDTIME_PROCRASTINATION: [
    { title: 'Screen-Off Transition', duration: '2 min', description: 'Make the first step away from content simple and achievable.' },
    { title: 'Short Wind-down', duration: '5 min', description: 'A compact ritual for nights when bedtime keeps moving later.' },
    { title: 'Sleep Routine', duration: '10 min', description: 'Repeat one calm cue so your evening has an easier stopping point.' },
  ],
  NIGHT_WAKING: [
    { title: 'Back-to-Sleep Exercise', duration: '3 min', description: 'A quiet reset for when you wake and do not want to start the day.' },
    { title: 'Quiet Mind Session', duration: '5 min', description: 'Give your attention a gentle anchor while the night is still going.' },
    { title: 'Sleep Audio', duration: '20 min', description: 'A soft background layer for returning to rest.' },
  ],
  SLEEP_RHYTHM: [
    { title: 'Routine Reset', duration: '3 min', description: 'Choose one realistic anchor for tonight instead of rebuilding everything.' },
    { title: 'Wind-down Cue', duration: '5 min', description: 'Use a repeatable signal that tells your body the day is ending.' },
    { title: 'Consistency Plan', duration: '4 min', description: 'Set up a small next-night action you can repeat without pressure.' },
  ],
};

function level(value: string, map: Record<string, FactorLevel>): FactorLevel {
  return map[value] || 'MODERATE';
}

function add(scores: Record<PatternId, number>, pattern: PatternId, points: number) {
  scores[pattern] += points;
}

export function buildNightPatternResult(
  answers: NightPatternAnswers,
  sourceIntent = '',
): NightPatternResult {
  const scores = Object.fromEntries(patternOrder.map(pattern => [pattern, 0])) as Record<PatternId, number>;

  for (const issue of answers.issues) {
    if (issue === 'racing_mind') { add(scores, 'RACING_MIND', 5); add(scores, 'STRESS_CARRYOVER', 1); }
    if (issue === 'difficulty_falling_asleep') add(scores, 'SLEEP_ANXIETY', 2);
    if (issue === 'night_waking') add(scores, 'NIGHT_WAKING', 7);
    if (issue === 'sleep_anxiety') add(scores, 'SLEEP_ANXIETY', 6);
    if (issue === 'phone_use' || issue === 'bedtime_procrastination') add(scores, 'BEDTIME_PROCRASTINATION', 7);
    if (issue === 'inconsistent_routine') add(scores, 'SLEEP_RHYTHM', 7);
    if (issue === 'stress_carryover') { add(scores, 'STRESS_CARRYOVER', 6); add(scores, 'RACING_MIND', 1); }
  }

  if (answers.racingThoughts === 'high') { add(scores, 'RACING_MIND', 7); add(scores, 'STRESS_CARRYOVER', 2); }
  if (answers.racingThoughts === 'moderate') { add(scores, 'RACING_MIND', 4); add(scores, 'STRESS_CARRYOVER', 1); }
  if (answers.bedtimeTension === 'high') add(scores, 'SLEEP_ANXIETY', 7);
  if (answers.bedtimeTension === 'moderate') add(scores, 'SLEEP_ANXIETY', 4);
  if (answers.frequency === '5+') add(scores, 'SLEEP_ANXIETY', 1);
  if (answers.primaryGoal === 'quiet_mind') add(scores, 'RACING_MIND', 3);
  if (answers.primaryGoal === 'less_anxious') add(scores, 'SLEEP_ANXIETY', 3);
  if (answers.primaryGoal === 'fall_asleep') add(scores, 'SLEEP_ANXIETY', 2);
  if (answers.primaryGoal === 'stop_waking') add(scores, 'NIGHT_WAKING', 3);
  if (answers.primaryGoal === 'phone_earlier') add(scores, 'BEDTIME_PROCRASTINATION', 3);
  if (answers.primaryGoal === 'consistent_routine') add(scores, 'SLEEP_RHYTHM', 3);

  const ranked = [...patternOrder].sort((a, b) => scores[b] - scores[a] || patternOrder.indexOf(a) - patternOrder.indexOf(b));
  const primary_pattern = ranked[0];
  const secondary_pattern = ranked.find(pattern => pattern !== primary_pattern && scores[pattern] > 0) || '';
  const disruptionScore = (answers.issues.includes('night_waking') ? 2 : 0) + (answers.issues.includes('difficulty_falling_asleep') ? 1 : 0) + (answers.frequency === '5+' ? 2 : answers.frequency === '3-4' ? 1 : 0);

  return {
    primary_pattern,
    secondary_pattern,
    factors: {
      racing_thoughts: level(answers.racingThoughts, { low: 'LOW', moderate: 'HIGH', high: 'VERY_HIGH' }),
      bedtime_tension: level(answers.bedtimeTension, { low: 'LOW', moderate: 'HIGH', high: 'VERY_HIGH' }),
      sleep_disruption: disruptionScore >= 4 ? 'VERY_HIGH' : disruptionScore >= 2 ? 'HIGH' : disruptionScore === 1 ? 'MODERATE' : 'LOW',
      routine_consistency: answers.issues.includes('inconsistent_routine') ? 'VERY_HIGH' : answers.issues.includes('phone_use') ? 'HIGH' : 'MODERATE',
    },
    primary_goal: answers.primaryGoal,
    tonight_plan: plans[primary_pattern],
    source_intent: sourceIntent,
    scores,
  };
}

export function patternLabel(pattern: PatternId): string {
  return {
    RACING_MIND: 'Racing Mind',
    SLEEP_ANXIETY: 'Sleep Anxiety',
    STRESS_CARRYOVER: 'Stress Carryover',
    BEDTIME_PROCRASTINATION: 'Bedtime Procrastination',
    NIGHT_WAKING: 'Night Waking',
    SLEEP_RHYTHM: 'Sleep Rhythm',
  }[pattern];
}
