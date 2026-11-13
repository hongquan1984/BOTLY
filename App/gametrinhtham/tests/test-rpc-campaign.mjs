import pg from "pg";

const client = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});

async function run() {
  try {
    await client.connect();
    console.log("Connected for RPC Campaign verification test.");
  } catch (err) {
    console.log(`[INFO] Local Supabase Postgres on 54322 is offline (${err.message}). Skipping DB RPC verification.`);
    return;
  }

  // Fetch a valid user from auth.users
  const userRes = await client.query("SELECT id FROM auth.users LIMIT 1;");
  if (!userRes.rows[0]) {
    throw new Error("No users found in auth.users");
  }
  const testUserId = userRes.rows[0].id;
  const testWorldId = "00000000-0000-0000-0000-000000008888";
  console.log(`Using test user ID: ${testUserId}`);

  // Clean previous test data for this test user
  await client.query("DELETE FROM public.healthclues_detective_player_progress WHERE user_id = $1;", [testUserId]);
  await client.query("DELETE FROM public.healthclues_xp_ledger WHERE user_id = $1 AND source_type = 'detective_campaign';", [testUserId]);

  console.log("1. Testing unauthorized unlock skip: Player tries solving case-gout-002 first...");
  let skipFailedProperly = false;
  try {
    await client.query(
      `SELECT public.healthclues_solve_detective_case_v1(
        $1, $2, 'case-gout-002', 3,
        array['clue-gout-photo', 'clue-gout-bill']::text[],
        '[]'::jsonb
      );`,
      [testUserId, testWorldId]
    );
  } catch (err) {
    skipFailedProperly = true;
    console.log("   -> Properly rejected with error:", err.message);
  }
  if (!skipFailedProperly) {
    throw new Error("FAILED: Server allowed solving locked case-gout-002 without prerequisite!");
  }
  console.log("   PASS: Locked case was prevented from being solved.");

  console.log("\n2. Solving Case 001 (Bí ẩn đêm không ngủ)...");
  const res1 = await client.query(
    `SELECT public.healthclues_solve_detective_case_v1(
      $1, $2, 'case-sleep-001', 3,
      array['clue-sleep-coffee', 'clue-sleep-phone', 'clue-sleep-schedule']::text[],
      '[]'::jsonb
    ) as outcome;`,
    [testUserId, testWorldId]
  );

  const outcome1 = res1.rows[0].outcome;
  console.log("   Outcome 1:", outcome1);
  if (!outcome1.success || outcome1.unlocked_next_case_id !== "case-gout-002") {
    throw new Error("FAILED: Case 001 did not unlock case-gout-002!");
  }
  console.log("   PASS: Case 001 solved, immediately unlocked next case: case-gout-002.");

  console.log("\n3. Testing Idempotency & Replay: Re-solving Case 001...");
  const resReplay = await client.query(
    `SELECT public.healthclues_solve_detective_case_v1(
      $1, $2, 'case-sleep-001', 3,
      array['clue-sleep-coffee', 'clue-sleep-phone', 'clue-sleep-schedule']::text[],
      '[]'::jsonb
    ) as outcome;`,
    [testUserId, testWorldId]
  );
  const outcomeReplay = resReplay.rows[0].outcome;
  console.log("   Outcome Replay:", outcomeReplay);
  if (outcomeReplay.exp_awarded !== 0) {
    throw new Error("FAILED: Replay granted duplicate EXP!");
  }
  console.log("   PASS: Replay granted 0 duplicate EXP (Idempotent).");

  console.log("\n4. Solving Case 002 (Bí ẩn cơn đau lúc nửa đêm)...");
  const res2 = await client.query(
    `SELECT public.healthclues_solve_detective_case_v1(
      $1, $2, 'case-gout-002', 3,
      array['clue-gout-photo', 'clue-gout-bill', 'clue-gout-water', 'clue-gout-meds']::text[],
      '[]'::jsonb
    ) as outcome;`,
    [testUserId, testWorldId]
  );
  const outcome2 = res2.rows[0].outcome;
  console.log("   Outcome 2:", outcome2);
  if (!outcome2.success || outcome2.unlocked_next_case_id !== "case-migraine-003") {
    throw new Error("FAILED: Case 002 did not unlock case-migraine-003!");
  }
  console.log("   PASS: Case 002 solved, immediately unlocked next case: case-migraine-003.");

  // Check XP Ledger
  const xpRes = await client.query(
    "SELECT source_type, source_id, amount, reason_code FROM public.healthclues_xp_ledger WHERE user_id = $1 AND source_type = 'detective_campaign';",
    [testUserId]
  );
  console.log("\nXP Ledger records for player:");
  console.table(xpRes.rows);

  // Clean up test data
  await client.query("DELETE FROM public.healthclues_detective_player_progress WHERE user_id = $1;", [testUserId]);
  await client.query("DELETE FROM public.healthclues_xp_ledger WHERE user_id = $1 AND source_type = 'detective_campaign';", [testUserId]);

  console.log("\nALL CAMPAIGN RPC TESTS PASSED 100%!");
  await client.end();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
