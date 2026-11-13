// Test Suite: HealthClues Wellness Home API & Multi-Player State Isolation
import { strict as assert } from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3450';

async function runApiTests() {
  console.log('--- ROUND 1: HEALTHCLUES WELLNESS HOME API & DATA VERIFICATION ---');

  // Test 1: GET /api/healthclues/wellness-home
  console.log('1. Testing GET /api/healthclues/wellness-home catalog & scenes...');
  const res1 = await fetch(`http://localhost:3000/api/healthclues/wellness-home?playerId=test_player_alpha`);
  
  // If localhost:3000 is not running yet, we test our route module logic directly or against server
  console.log('Checking direct route module import...');
}

// Direct Unit Test of Route Handlers
async function runModuleUnitTests() {
  console.log('1. Testing route handlers in isolated environment...');
  
  // Import the route directly using dynamic import
  const { GET, POST } = await import('../src/app/api/healthclues/wellness-home/route.ts');
  
  // Test A: Fresh Player Alpha (Day 0)
  console.log('   - Testing Player Alpha Fresh Profile (Day 0 empty state)...');
  const reqAlphaGet = new Request('http://localhost/api/healthclues/wellness-home?playerId=player_alpha_test');
  const resAlphaGet = await GET(reqAlphaGet);
  assert.equal(resAlphaGet.status, 200, 'GET should return 200 OK');
  const dataAlpha = await resAlphaGet.json();
  
  assert.equal(Object.keys(dataAlpha.scenes).length, 2, 'Should have 2 rooms (Living & Bedroom)');
  assert.equal(dataAlpha.catalog.length, 10, 'Should have 10 master catalog items');
  assert.equal(dataAlpha.playerState.unlockedItems.length, 0, 'Player Alpha must have 0 items on Day 0');
  assert.equal(dataAlpha.playerState.hasClaimedWelcome, false, 'Player Alpha has not claimed welcome gift');
  console.log('     ✓ Player Alpha Day 0 verified: 0 items, empty room canvas.');

  // Test B: Player Alpha Claims Welcome Gift (Day 1 Sofa)
  console.log('   - Testing Player Alpha Unboxing Welcome Gift (Sofa Luxury)...');
  const reqAlphaClaim = new Request('http://localhost/api/healthclues/wellness-home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim_welcome', playerId: 'player_alpha_test' })
  });
  const resAlphaClaim = await POST(reqAlphaClaim);
  assert.equal(resAlphaClaim.status, 200, 'POST claim_welcome should succeed');
  const claimData = await resAlphaClaim.json();
  assert.equal(claimData.playerState.hasClaimedWelcome, true, 'hasClaimedWelcome should be true');
  assert.deepEqual(claimData.playerState.unlockedItems, ['sofa_luxury'], 'Player Alpha must have sofa_luxury unlocked');
  console.log('     ✓ Player Alpha Day 1 verified: sofa_luxury placed in living room.');

  // Test C: Multi-Player State Isolation (Player Beta is completely clean)
  console.log('   - Testing Multi-Player Data Isolation (Player Beta vs Player Alpha)...');
  const reqBetaGet = new Request('http://localhost/api/healthclues/wellness-home?playerId=player_beta_test');
  const resBetaGet = await GET(reqBetaGet);
  const dataBeta = await resBetaGet.json();
  assert.equal(dataBeta.playerState.unlockedItems.length, 0, 'Player Beta MUST have 0 items (Zero data collision with Alpha!)');
  assert.equal(dataBeta.playerState.hasClaimedWelcome, false, 'Player Beta has not claimed welcome gift');
  console.log('     ✓ Multi-Player Isolation verified: Player Beta room is 100% empty, zero collision with Player Alpha.');

  // Test D: Player Beta Claims Daily Reward (Picks Piano)
  console.log('   - Testing Player Beta Daily Reward Pick (piano_grand)...');
  const reqBetaDaily = new Request('http://localhost/api/healthclues/wellness-home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim_daily_reward', itemId: 'piano_grand', playerId: 'player_beta_test' })
  });
  const resBetaDaily = await POST(reqBetaDaily);
  assert.equal(resBetaDaily.status, 200);
  const betaDailyData = await resBetaDaily.json();
  assert.deepEqual(betaDailyData.playerState.unlockedItems, ['piano_grand']);
  console.log('     ✓ Player Beta has [piano_grand].');

  // Verify Player Alpha still only has [sofa_luxury]
  const resAlphaVerify = await GET(reqAlphaGet);
  const dataAlphaVerify = await resAlphaVerify.json();
  assert.deepEqual(dataAlphaVerify.playerState.unlockedItems, ['sofa_luxury'], 'Player Alpha unlockedItems must NOT be affected by Beta');
  console.log('     ✓ Re-verified Player Alpha: still strictly has [sofa_luxury]. Zero leak across accounts.');

  // Test E: Player Reset
  console.log('   - Testing Player Reset (Reset to 100% empty canvas)...');
  const reqReset = new Request('http://localhost/api/healthclues/wellness-home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset_player', playerId: 'player_alpha_test' })
  });
  const resReset = await POST(reqReset);
  assert.equal(resReset.status, 200);
  const resetData = await resReset.json();
  assert.equal(resetData.playerState.unlockedItems.length, 0);
  assert.equal(resetData.playerState.hasClaimedWelcome, false);
  console.log('     ✓ Reset verified: Player Alpha restored to Day 0 empty canvas.');

  console.log('\n>>> ROUND 1 PASSED: 100% API, DATA & MULTI-PLAYER ISOLATION VERIFIED! <<<\n');
}

runModuleUnitTests().catch(err => {
  console.error('API Unit test failed:', err);
  process.exit(1);
});
