import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const runtimePath = process.env.HEALTHCLUES_OWNER_DEMO_RUNTIME
  ? path.resolve(process.env.HEALTHCLUES_OWNER_DEMO_RUNTIME)
  : path.join(appRoot, ".tmp", "healthclues-owner-demo", "owner-demo-runtime.json");
assert.ok(existsSync(runtimePath), `Local Owner Demo runtime metadata is required: ${runtimePath}`);
const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
assert.equal(runtime.projectId, "healthclues-owner-demo", "Refusing a non-isolated runtime.");

const appUrl = (process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329").replace(/\/$/, "");
const apiUrl = runtime.apiUrl.replace(/\/$/, "");
const jsonHeaders = { "Content-Type": "application/json" };

async function expectOk(response, label) {
  const body = await response.json().catch(() => ({}));
  assert.ok(response.ok, `${label} returned HTTP ${response.status}`);
  return body;
}

async function createAccount(label) {
  const email = `hc-toolkit-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.invalid`;
  const password = `HC-local-${crypto.randomUUID()}-Aa9!`;
  const admin = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: runtime.secretKey, Authorization: `Bearer ${runtime.secretKey}`, ...jsonHeaders },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { test_only: true, suite: "mobile-toolkit-roundtrip" } }),
  });
  const created = await expectOk(admin, `${label} local account creation`);
  const login = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, ...jsonHeaders },
    body: JSON.stringify({ email, password }),
  });
  const session = await expectOk(login, `${label} local sign-in`);
  assert.equal(session.user?.id, created.id, `${label} token belongs to the created account.`);
  return { id: created.id, token: session.access_token };
}

async function toolkit(account, init = {}) {
  return fetch(`${appUrl}/api/healthclues/mobile-toolkit`, {
    ...init,
    headers: { Authorization: `Bearer ${account.token}`, ...init.headers },
  });
}

async function readRows(accountId) {
  const response = await fetch(`${apiUrl}/rest/v1/healthclues_mobile_toolkit_items?user_id=eq.${encodeURIComponent(accountId)}&select=user_id,item_type,item_id&order=item_type.asc,item_id.asc`, {
    headers: { apikey: runtime.secretKey, Authorization: `Bearer ${runtime.secretKey}` },
  });
  return expectOk(response, "database readback");
}

const [primary, other] = await Promise.all([createAccount("primary"), createAccount("other")]);
const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const items = [
  { itemType: "herb", itemId: `hc-roundtrip-herb-${suffix}` },
  { itemType: "sound", itemId: `hc-roundtrip-sound-${suffix}` },
  { itemType: "breath", itemId: `hc-roundtrip-breath-${suffix}` },
];

const unauthenticated = await fetch(`${appUrl}/api/healthclues/mobile-toolkit`, { cache: "no-store" });
assert.equal(unauthenticated.status, 401, "Unauthenticated Toolkit reads must be rejected.");

for (const item of items) {
  await expectOk(await toolkit(primary, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ action: "save", ...item }) }), `save ${item.itemType}`);
}
assert.equal((await (await toolkit(primary, { cache: "no-store" })).json()).herbs.length, 1, "herb reload rehydrates from the API.");
const reloaded = await (await toolkit(primary, { cache: "no-store" })).json();
assert.deepEqual(reloaded, { herbs: [items[0].itemId], sounds: [items[1].itemId], breaths: [items[2].itemId] }, "all three item types survive API reload.");
const databaseRows = await readRows(primary.id);
const expectedRows = items
  .map(({ itemType, itemId }) => ({ item_type: itemType, item_id: itemId }))
  .sort((left, right) => `${left.item_type}:${left.item_id}`.localeCompare(`${right.item_type}:${right.item_id}`));
assert.deepEqual(databaseRows.map((row) => ({ item_type: row.item_type, item_id: row.item_id })), expectedRows, "database readback matches the authenticated Bag.");

const otherState = await (await toolkit(other, { cache: "no-store" })).json();
assert.deepEqual(otherState, { herbs: [], sounds: [], breaths: [] }, "a second account cannot read the first account's Bag.");

const malformed = await toolkit(primary, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ action: "save", itemType: "herb", itemId: "not allowed/with spaces" }) });
assert.equal(malformed.status, 400, "malformed item IDs must return structured 400 errors.");

for (const item of items) {
  await expectOk(await toolkit(primary, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ action: "remove", ...item }) }), `remove ${item.itemType}`);
}
assert.deepEqual(await (await toolkit(primary, { cache: "no-store" })).json(), { herbs: [], sounds: [], breaths: [] }, "removed items disappear after API reload.");
assert.deepEqual(await readRows(primary.id), [], "database rows are removed for all three item types.");

console.log(JSON.stringify({ result: "PASS", flow: "authenticated Toolkit save -> API reload -> database readback -> cross-account isolation -> remove", itemTypes: items.map((item) => item.itemType), appUrl, runtime: runtime.projectId }, null, 2));
