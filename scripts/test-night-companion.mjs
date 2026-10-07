import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildNightPatternResult } from '../src/lib/night-pattern.ts';
import { createNightProfile, normalizeNightCompanionState, selectNightOnePlan, selectStillAwakePlan, sanitizeReview } from '../src/lib/night-companion.ts';

const answers = {
  gender: '', ageGroup: '', issues: ['racing_mind'], frequency: '3-4', duration: '1-6m', sleepHours: '6-7h', bedtimeTension: 'moderate', racingThoughts: 'high', sleepSupport: 'None', concerns: [], primaryGoal: 'quiet_mind'
};
const result = buildNightPatternResult(answers, 'overthinking');
const profile = createNightProfile('profile-test', result, { desired_bedtime: '23:00', usual_wake_time: '07:00', last_hour_behaviors: ['scrolling'], sleep_doesnt_come: 'thoughts_busier' });
assert.equal(profile.profile_id, 'profile-test');
assert.equal(profile.quiz_result.primary_pattern, 'RACING_MIND');
assert.equal(profile.operational_setup.desired_bedtime, '23:00');
assert.equal(normalizeNightCompanionState(profile)?.profile.operational_setup.usual_wake_time, '07:00');
assert.equal(normalizeNightCompanionState({ profile, module_feedback: [], resume_stage: 'tonight' })?.profile.profile_id, 'profile-test');
assert.equal(normalizeNightCompanionState({ unrelated: true }), null);

const states = ['MIND_WONT_STOP', 'SLEEP_ANXIETY', 'NOT_SLEEPY', 'WOKE_UP', 'STRESS_CARRYOVER'];
for (const current_state of states) {
  const plan = selectNightOnePlan(profile, { night_number: 1, current_state, selected_at: '2026-01-01T00:00:00.000Z' });
  assert.equal(plan.night_number, 1);
  assert.ok(plan.modules.length <= 3);
  assert.equal(plan.source, 'deterministic_rule_engine');
  assert.ok(plan.reason_code);
  assert.ok(plan.explanation);
  assert.ok(plan.modules.length <= 3);
}
assert.equal(selectNightOnePlan(profile, { night_number: 1, current_state: 'MIND_WONT_STOP', selected_at: 'x' }).modules[0].module_id, 'mental_unload');
assert.equal(selectNightOnePlan(profile, { night_number: 1, current_state: 'WOKE_UP', selected_at: 'x' }).modules[0].module_id, 'calming_audio');
assert.equal(selectNightOnePlan(profile, { night_number: 1, current_state: 'NOT_SLEEPY', selected_at: 'x' }).modules[0].module_id, 'quiet_activity');
assert.equal(selectNightOnePlan(profile, { night_number: 1, current_state: 'WOKE_UP', selected_at: 'x' }).modules.some(module => module.module_id === 'mental_unload'), false);
assert.equal(selectStillAwakePlan('STRESS_CARRYOVER').modules[0].module_id, 'decompression');

const review = sanitizeReview({ night_number: 1, overall: 'BETTER', completion_status: 'completed', module_feedback: [{ module_id: 'mental_unload', used: true, helpfulness: 'YES' }], created_at: 'x' });
assert.deepEqual(review.module_feedback[0], { module_id: 'mental_unload', used: true, helpfulness: 'YES' });

const flow = await readFile(new URL('../src/components/night-companion/NightCompanionFlow.tsx', import.meta.url), 'utf8');
assert.ok(flow.includes('night_profile_created'));
assert.ok(flow.includes('module_started'));
assert.ok(flow.includes('night_review_completed'));
assert.ok(flow.includes("I’m still awake") || flow.includes("I'm still awake"));
assert.ok(flow.includes('module_skipped'));
assert.ok(flow.includes('night_1_stopped'));
assert.ok(flow.includes('audio'));
assert.ok(flow.includes('resetLocalTestSession'));
assert.ok(flow.includes('process.env.NODE_ENV !== \'production\''));
assert.ok(flow.includes('Review could not be saved. Nothing was marked complete.'));
assert.ok(flow.includes('reviewSaved'));
assert.ok(flow.includes('resume_stage'));
assert.ok(flow.includes("resume_stage === 'review'"));
assert.ok(flow.includes("resume_stage: 'review'"));
assert.ok(flow.includes('active_module_index'));
assert.ok(flow.includes('Background sound only'));
assert.equal(flow.includes('Night 2'), false, 'Night 2 is not implemented in NightCompanionFlow directly');
assert.equal(flow.includes('textarea'), false, 'raw free-form thought input is not persisted');

const route = await readFile(new URL('../src/app/api/night-companion/profile/route.ts', import.meta.url), 'utf8');
assert.ok(route.includes('access_token_hash'));
assert.ok(route.includes('randomBytes'));
assert.equal(route.includes('visitor_id'), false, 'analytics visitor identity is not product identity');

const client = await readFile(new URL('../src/lib/night-companion-client.ts', import.meta.url), 'utf8');
assert.ok(client.includes('clearNightCompanionToken'));
assert.ok(client.includes('localStorage.removeItem(TOKEN_KEY)'));
assert.ok(client.includes('readNightCompanionSetupDraft'));
assert.ok(client.includes('Your Night Profile could not be restored'));
assert.ok(client.includes('saveNightCompanionToken(data.access_token)'));
assert.ok(client.includes('localStorage.setItem(SETUP_DRAFT_KEY'));

console.log('Night Companion Phase 1 tests passed');
