import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { NIGHT_ONE_AUDIO, NIGHT_ONE_SCRIPTS, NIGHT_ONE_VOICES, selectNightOneVoiceOptions } from '../src/lib/night-companion-content.ts';
import { buildNightPatternResult } from '../src/lib/night-pattern.ts';
import { createNightProfile, selectNightOnePlan } from '../src/lib/night-companion.ts';

const answers = { gender: '', ageGroup: '', issues: ['racing_mind'], frequency: '3-4', duration: '1-6m', sleepHours: '6-7h', bedtimeTension: 'moderate', racingThoughts: 'high', sleepSupport: 'None', concerns: [], primaryGoal: 'quiet_mind' };
const result = buildNightPatternResult(answers, 'content-test');
const profile = createNightProfile('content-test', result, { desired_bedtime: '23:00', usual_wake_time: '07:00', last_hour_behaviors: [], sleep_doesnt_come: 'varies' });
for (const state of ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'NOT_SLEEPY', 'WOKE_UP', 'STRESS_CARRYOVER']) {
  const plan = selectNightOnePlan(profile, { night_number: 1, current_state: state, selected_at: 'x' });
  assert.ok(plan.modules.length <= 3, `${state} exceeds three modules`);
}
assert.ok(Object.values(NIGHT_ONE_SCRIPTS).every(script => script.id && script.version && script.transcript.length > 0 && script.skip_or_stop && script.sources.length > 0));
const audio = NIGHT_ONE_AUDIO['night1-ocean-waves-cc0'];
await access(new URL(`../public${audio.local_path}`, import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../public/audio/night-companion/manifest.json', import.meta.url), 'utf8'));
const player = await readFile(new URL('../src/components/night-companion/NightAudioPlayer.tsx', import.meta.url), 'utf8');
assert.ok(player.includes('loop\n          onError') || player.includes('loop onError'), 'background tracks loop for timed playback');
assert.ok(player.includes("timer === 'until_voice'"), 'background stops when guided voice ends');
assert.ok(player.includes('disabled={!selectedVoice}'), 'stop-with-voice timer is disabled without a voice');
assert.equal(manifest[0].asset_id, audio.asset_id);
assert.ok(manifest[0].license && manifest[0].license_url && manifest[0].source_url);
assert.equal(manifest[0].kind, 'background');
assert.equal(Object.keys(NIGHT_ONE_AUDIO).length, 6);
assert.equal(manifest.length, 12);
assert.equal(Object.keys(NIGHT_ONE_VOICES).length, 4, 'all four production guided voice assets are registered');
assert.equal(NIGHT_ONE_VOICES['night1-guided-coherent-5-5'].recommended, true);
assert.equal(NIGHT_ONE_VOICES['night1-guided-coherent-5-5'].duration_seconds, 181.348);
assert.equal(selectNightOneVoiceOptions('MIND_WONT_STOP')[0].asset_id, 'night1-guided-coherent-5-5');
assert.ok(selectNightOneVoiceOptions('NOT_SLEEPY').length > 0, 'NOT_SLEEPY has voice options fallback');
assert.ok(player.includes('Start listening'));
assert.ok(player.includes('Stop listening'));
assert.ok(player.includes('visibilitychange'));
assert.ok(player.includes('fadeAndStopBackground'));
assert.ok(player.includes('No background'));
assert.ok(player.includes('15 minutes'));
console.log('Night Companion content and audio manifest tests passed');
