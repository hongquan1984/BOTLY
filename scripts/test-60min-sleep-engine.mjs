import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import {
  COGNITIVE_PIVOT_TRACKS,
  selectCognitivePivotTrack,
  DEEP_DELTA_TRACK,
  SLEEP_COCOON_TRACK,
  SLEEP_JOURNEY_STAGES,
  NIGHT_ONE_VOICES,
  selectNightOneIntro,
  selectNightOneVoiceOptions,
} from '../src/lib/night-companion-content.ts';

const states = ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'NOT_SLEEPY', 'WOKE_UP', 'STRESS_CARRYOVER'];

console.log('--- 1. Testing Insomnia States Coverage ---');
for (const state of states) {
  const intro = selectNightOneIntro(state);
  assert.ok(intro && intro.local_path, `State ${state} must have an intro track`);
  await access(new URL(`../public${intro.local_path}`, import.meta.url));

  const voices = selectNightOneVoiceOptions(state);
  assert.ok(voices.length >= 4, `State ${state} must have all 4 voice options available`);

  const pivot = selectCognitivePivotTrack(state);
  assert.ok(pivot && pivot.local_path, `State ${state} must have a tailored cognitive pivot track`);
  await access(new URL(`../public${pivot.local_path}`, import.meta.url));
  console.log(`✓ State ${state}: Intro (${intro.title_en}) -> Voices (${voices.length}) -> Pivot (${pivot.title_en})`);
}

console.log('\n--- 2. Testing Stage 4 Deep Delta & Stage 5 Sleep Cocoon Assets ---');
assert.ok(DEEP_DELTA_TRACK.local_path);
await access(new URL(`../public${DEEP_DELTA_TRACK.local_path}`, import.meta.url));
console.log(`✓ Stage 4 Deep Delta asset verified: ${DEEP_DELTA_TRACK.local_path}`);

assert.ok(SLEEP_COCOON_TRACK.local_path);
await access(new URL(`../public${SLEEP_COCOON_TRACK.local_path}`, import.meta.url));
console.log(`✓ Stage 5 Sleep Cocoon asset verified: ${SLEEP_COCOON_TRACK.local_path}`);

console.log('\n--- 3. Testing 60-Minute Progressive Stage Pipeline Structure ---');
assert.equal(SLEEP_JOURNEY_STAGES.length, 6);
const stageIds = SLEEP_JOURNEY_STAGES.map(s => s.id);
assert.deepEqual(stageIds, ['intro', 'guided', 'theta_drift', 'cognitive_pivot', 'delta_immersion', 'sleep_cocoon']);
console.log('✓ 60-Minute pipeline stages order: ' + stageIds.join(' -> '));

console.log('\nAll 60-Minute Sleep Engine tests passed with 100% verification!');
