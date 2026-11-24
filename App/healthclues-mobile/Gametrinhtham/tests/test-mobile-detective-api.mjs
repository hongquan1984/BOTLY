import assert from 'node:assert/strict';

const base = process.env.DETECTIVE_URL || 'http://127.0.0.1:3329';
const response = await fetch(`${base}/api/healthclues/mobile-detective/campaign`);
assert.equal(response.status, 200, `mobile campaign API returned ${response.status}`);
const payload = await response.json();
const case007 = payload.cases.find((item) => item.id === 'case-cervical-007');
assert.ok(case007, 'Case 007 must come from the campaign API');
const assets = case007.assets ?? [];
assert.equal(assets.filter((asset) => asset.role === 'scene-main').length, 1, 'Case 007: scene-main');
assert.equal(assets.filter((asset) => asset.role === 'mai-before').length, 1, 'Case 007: mai-before');
assert.equal(assets.filter((asset) => asset.role === 'mai-after').length, 1, 'Case 007: mai-after');
assert.equal(assets.filter((asset) => asset.role === 'clue-closeup').length, 6, 'Case 007: six closeups');
assert.ok(case007.clues.every((clue) => clue.title && clue.shortDescription && clue.detailedObservation && clue.icon), 'Case 007 clue source shape');
console.log(`PASS mobile detective API contract (${payload.cases.length} cases, Case 007 has ${assets.length} assets)`);
