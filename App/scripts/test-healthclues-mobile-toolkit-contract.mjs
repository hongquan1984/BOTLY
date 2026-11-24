import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const route = fs.readFileSync(path.join(root, '..', 'src/app/api/healthclues/mobile-toolkit/route.ts'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'healthclues-mobile/src/services/toolkitStorage.ts'), 'utf8');
const bag = fs.readFileSync(path.join(root, 'healthclues-mobile/app/(game)/inventory.tsx'), 'utf8');
const herbal = fs.readFileSync(path.join(root, 'healthclues-mobile/src/modules/herbal/HerbalGardenModal.tsx'), 'utf8');
const sound = fs.readFileSync(path.join(root, 'healthclues-mobile/src/modules/sound/SoundGardenModal.tsx'), 'utf8');
const breath = fs.readFileSync(path.join(root, 'healthclues-mobile/src/modules/breath/ZenBreathModal.tsx'), 'utf8');
const migration = fs.readFileSync(path.join(root, '..', 'supabase/migrations/20261122120000_healthclues_mobile_toolkit.sql'), 'utf8');
const roundtrip = fs.readFileSync(path.join(root, 'scripts/test-healthclues-mobile-toolkit-roundtrip.mjs'), 'utf8');

const legacyItemKeys = /hc_mobile_(toolkit_sounds|toolkit_breaths|botanical_bookmarks)/;
const scopedBagPaths = [
  path.join(root, 'healthclues-mobile/app/(game)'),
  path.join(root, 'healthclues-mobile/src/modules/herbal'),
  path.join(root, 'healthclues-mobile/src/modules/sound'),
  path.join(root, 'healthclues-mobile/src/modules/breath'),
  path.join(root, 'healthclues-mobile/src/services/toolkitStorage.ts'),
];

function readScopedSources(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [{ file: target, source: fs.readFileSync(target, 'utf8') }];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    return entry.isDirectory() ? readScopedSources(child) : readScopedSources(child);
  });
}

for (const { file, source } of scopedBagPaths.flatMap(readScopedSources)) {
  assert.doesNotMatch(source, legacyItemKeys, `legacy device-storage item key remains in ${path.relative(root, file)}`);
}

assert.match(route, /requireUser\(request\)/, 'API route must authenticate every request');
assert.equal((route.match(/requireUser\(request\)/g) || []).length, 2, 'GET and POST must authenticate independently');
assert.match(route, /Cache-Control.*no-store/, 'Toolkit responses must not be cached across accounts');
assert.match(route, /const userId = encodeURIComponent\(auth\.id\)/, 'route must URL-encode the authenticated user id before filtering');
assert.match(route, /user_id=eq\.\$\{userId\}/, 'GET and DELETE must scope reads/removes to the authenticated user');
assert.match(route, /item_type=eq\.\$\{encodeURIComponent\(itemType\)\}/, 'DELETE must encode the item type filter');
assert.match(route, /item_id=eq\.\$\{encodeURIComponent\(itemId\)\}/, 'DELETE must encode the item id filter');
assert.match(route, /user_id: auth\.id/, 'POST must write the authenticated user id');
assert.match(route, /new Set\(\["herb", "sound", "breath"\]\)/, 'API must support exactly the three toolkit types');
assert.match(route, /\^\[A-Za-z0-9_\.:-\]\{1,160\}\$/, 'API must validate item IDs without accepting arbitrary input');
assert.match(route, /on_conflict=user_id,item_type,item_id/, 'save must be idempotent per user/type/item');
assert.match(route, /method: "DELETE"/, 'remove must delete through the API');
assert.match(route, /return response\(\{ error:/, 'API failures must return a structured error response');
assert.match(route, /\}, 400\)/, 'malformed Toolkit mutation payloads must be rejected with 400');
assert.match(route, /\}, 503\)/, 'database/API failures must return retryable 503 responses');
assert.doesNotMatch(route, /localStorage|sessionStorage|AsyncStorage/, 'API route must not use device/browser storage');

assert.match(storage, /apiFetch<ToolkitState>\("\/api\/healthclues\/mobile-toolkit"\)/, 'mobile storage must load from the authenticated API');
assert.match(storage, /apiFetch\("\/api\/healthclues\/mobile-toolkit", \{ method: "POST"/, 'mobile storage mutations must call the authenticated API');
assert.doesNotMatch(storage, /AsyncStorage|localStorage|sessionStorage/, 'toolkit storage must not persist item state locally');
assert.doesNotMatch(storage, /async getSaved(?:Sound|Breath|Herb)Ids\(\): Promise<string\[\]> \{\s*try\s*\{[\s\S]*?catch\s*\{\s*return \[\];\s*\}/, 'Toolkit reads must not turn API failures into a misleading empty Bag');

for (const [name, source] of [['Bag', bag], ['Herbal Garden', herbal], ['Sound Garden', sound], ['Breath Garden', breath]]) {
  assert.match(source, /toolkitStorage/, `${name} must use toolkitStorage`);
}
for (const [name, source] of [['Herbal Garden', herbal], ['Sound Garden', sound], ['Breath Garden', breath]]) {
  assert.match(source, /toolkitLoading/, `${name} must expose Toolkit loading state`);
  assert.match(source, /toolkitError/, `${name} must expose Toolkit error state`);
  assert.match(source, /Could not update your Bag|Không thể cập nhật Túi Đồ/, `${name} must surface mutation failures`);
}
assert.match(sound, /let isMounted = true/, 'Sound Garden must cancel late Toolkit load updates');
assert.match(breath, /let isMounted = true/, 'Breath Garden must cancel late Toolkit load updates');
assert.match(herbal, /let isMounted = true/, 'Herbal Garden must cancel late Toolkit load updates');
assert.match(sound, /if \(isMounted\) setToolkitLoading\(false\)/, 'Sound Garden must not clear loading after unmount');
assert.match(breath, /if \(isMounted\) setToolkitLoading\(false\)/, 'Breath Garden must not clear loading after unmount');
assert.match(herbal, /if \(isMounted\) setToolkitLoading\(false\)/, 'Herbal Garden must not clear loading after unmount');
assert.match(bag, /toolkitStorage\.getState\(\)/, 'Bag must rehydrate all categories in one API read');
assert.match(bag, /toolkitLoading/, 'Bag must expose loading state');
assert.match(bag, /toolkitError/, 'Bag must expose retryable error state');
assert.match(bag, /let isMounted = true/, 'Bag must cancel late Toolkit load updates');
assert.match(bag, /if \(isMounted\) setToolkitLoading\(false\)/, 'Bag must not clear loading after unmount');
assert.doesNotMatch(bag, /hc_mobile_(toolkit|botanical_bookmarks)/, 'Bag must not retain legacy local item keys');

assert.match(migration, /create table if not exists public\.healthclues_mobile_toolkit_items/, 'migration must create the database table');
assert.match(migration, /primary key \(user_id, item_type, item_id\)/, 'migration must enforce per-user item uniqueness');
assert.match(migration, /enable row level security/, 'migration must enable RLS');
assert.match(migration, /grant all on table public\.healthclues_mobile_toolkit_items to service_role/, 'only the server service role may access the table');
assert.match(roundtrip, /auth\/v1\/admin\/users/, 'round-trip harness must create isolated local synthetic accounts');
assert.match(roundtrip, /database readback/, 'round-trip harness must read back persisted database rows');
assert.match(roundtrip, /cross-account isolation/, 'round-trip harness must verify account isolation');
assert.doesNotMatch(roundtrip, /localStorage|sessionStorage|AsyncStorage/, 'round-trip harness must not seed or persist Bag state in device/browser storage');

console.log('PASS mobile Toolkit Bag authenticated database contract');
