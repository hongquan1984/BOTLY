import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildNightPatternResult } from '../src/lib/night-pattern.ts';
import { getRecommendations, PATTERN_SOLUTION_MAPPING, PROVIDERS, SOLUTIONS, resolveDestination, resolveProvider } from '../src/lib/recommendations.ts';

const base = {
  gender: '',
  ageGroup: '',
  issues: [],
  frequency: '1-2',
  duration: '1-6m',
  sleepHours: '6-7h',
  bedtimeTension: 'low',
  racingThoughts: 'low',
  sleepSupport: 'None',
  concerns: [],
  primaryGoal: '',
};

const cases = {
  overthinker: { ...base, issues: ['racing_mind', 'stress_carryover'], racingThoughts: 'high', bedtimeTension: 'moderate', primaryGoal: 'quiet_mind', expected: 'RACING_MIND' },
  sleepAnxiety: { ...base, issues: ['sleep_anxiety'], racingThoughts: 'moderate', bedtimeTension: 'high', primaryGoal: 'less_anxious', expected: 'SLEEP_ANXIETY' },
  phoneDelayer: { ...base, issues: ['phone_use', 'bedtime_procrastination'], primaryGoal: 'phone_earlier', expected: 'BEDTIME_PROCRASTINATION' },
  nightWaker: { ...base, issues: ['night_waking'], primaryGoal: 'stop_waking', expected: 'NIGHT_WAKING' },
  irregularRoutine: { ...base, issues: ['inconsistent_routine'], primaryGoal: 'consistent_routine', expected: 'SLEEP_RHYTHM' },
  mixed: { ...base, issues: ['racing_mind', 'sleep_anxiety', 'stress_carryover'], racingThoughts: 'high', bedtimeTension: 'high', primaryGoal: 'quiet_mind', expected: 'RACING_MIND', secondary: 'SLEEP_ANXIETY' },
};

for (const [name, input] of Object.entries(cases)) {
  const { expected, secondary, ...answers } = input;
  const result = buildNightPatternResult(answers, 'test');
  assert.equal(result.primary_pattern, expected, `${name}: primary pattern`);
  if (secondary) assert.equal(result.secondary_pattern, secondary, `${name}: secondary pattern`);
  assert.equal(result.tonight_plan.length, 3, `${name}: tonight plan has three steps`);
  assert.equal(result.source_intent, 'test', `${name}: source intent preserved`);
}

const racing = buildNightPatternResult({ ...base, issues: ['racing_mind'], racingThoughts: 'high' }, 'overthinking');
const racingRecommendations = getRecommendations(racing, 'android');
assert.deepEqual(racingRecommendations.map(item => item.id), ['thought_dump', 'sleep_sounds', 'sleep_tracking']);
assert.equal(racingRecommendations[0].provider?.id, 'soulscape');
assert.equal(racingRecommendations[0].can_open, true, 'active Soulscape provider has a destination');
assert.equal(racingRecommendations[1].can_open, false, 'pending sound provider has no CTA');
assert.equal(racingRecommendations[2].can_open, false, 'pending tracking provider has no CTA');
assert.ok(resolveDestination(PROVIDERS.soulscape, 'android')?.startsWith('https://play.google.com/'));
assert.equal(resolveDestination({ ...PROVIDERS.soulscape, status: 'pending' }, 'android'), null, 'pending provider has no destination');
assert.equal(resolveDestination({ ...PROVIDERS.soulscape, status: 'inactive' }, 'android'), null, 'inactive provider has no destination');

assert.ok(Object.values(SOLUTIONS).some(solution => (solution.provider_ids || []).length > 1), 'a solution supports multiple provider candidates');
assert.equal(resolveProvider(SOLUTIONS.thought_dump, 'android')?.id, 'soulscape', 'active compatible provider is selected after pending candidate');
assert.equal(resolveProvider({ ...SOLUTIONS.thought_dump, provider_ids: ['shuteye'] }, 'android'), null, 'pending provider is skipped');
assert.equal(resolveProvider({ ...SOLUTIONS.thought_dump, provider_ids: ['inactive'] }, 'android', {}, {
  ...PROVIDERS,
  inactive: { ...PROVIDERS.soulscape, id: 'inactive', status: 'inactive' },
}), null, 'inactive provider is skipped');
assert.equal(resolveProvider({ ...SOLUTIONS.thought_dump, provider_ids: ['invalid'] }, 'android', {}, {
  ...PROVIDERS,
  invalid: { ...PROVIDERS.soulscape, id: 'invalid', destinations: { android: 'not-a-url' } },
}), null, 'provider without valid destination is skipped');
assert.deepEqual(Object.keys(PATTERN_SOLUTION_MAPPING), ['RACING_MIND', 'SLEEP_ANXIETY', 'STRESS_CARRYOVER', 'NIGHT_WAKING', 'BEDTIME_PROCRASTINATION', 'SLEEP_RHYTHM'], 'all six mappings remain present');

const recommendationUi = await readFile(new URL('../src/components/quiz/CompactResultScreen.tsx', import.meta.url), 'utf8');
assert.equal(recommendationUi.includes('does not have an approved destination'), false, 'pending provider operational state is not user-facing');
assert.equal(recommendationUi.includes('No provider is connected'), false, 'missing provider operational state is not user-facing');

console.log(`Night Pattern persona tests passed: ${Object.keys(cases).length}`);
