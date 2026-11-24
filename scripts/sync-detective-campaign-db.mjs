import fs from 'node:fs/promises';
import path from 'node:path';
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES } from '../App/gametrinhtham/src/data/cases.ts';

const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required; no production target is selected implicitly.');

async function rest(table, init = {}) {
  const response = await fetch(`${base}/rest/v1/${table}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${table} ${response.status}: ${await response.text()}`);
  return response;
}

const case007Files = [
  ['scene-main', 'scene-main.jpg', null],
  ['mai-before', 'mai-before.jpg', null],
  ['mai-after', 'mai-after.jpg', null],
  ['clue-closeup', 'closeup-01-pillow.jpg', 'clue-mai-pillow'],
  ['clue-closeup', 'closeup-02-laptop.jpg', 'clue-mai-laptop'],
  ['clue-closeup', 'closeup-03-mouse.jpg', 'clue-mai-mouse'],
  ['clue-closeup', 'closeup-04-phone.jpg', 'clue-mai-phone'],
  ['clue-closeup', 'closeup-05-ac-remote.jpg', 'clue-mai-ac'],
  ['clue-closeup', 'closeup-06-chicken.jpg', 'clue-mai-chicken'],
];

await rest('healthclues_detective_chapters', { method: 'POST', body: JSON.stringify(ALL_CHAPTERS) });
await rest('healthclues_detective_case_files', {
  method: 'POST',
  body: JSON.stringify(ALL_DETECTIVE_CASES.map((item) => ({
    id: item.id, chapter_id: item.chapterId, chapter_order: item.chapterOrder,
    prerequisite_case_id: item.prerequisiteCaseId ?? null, title: item.title, subtitle: item.subtitle,
    topic: item.topic, region: item.region, difficulty: item.difficulty, content_version: item.contentVersion,
    publication_status: item.publicationStatus, exp_reward: item.resolution?.expReward ?? 50, case_payload: item,
  }))),
});

const case007Dir = path.resolve('public/gametrinhtham/cases/case-007');
const case007Assets = [];
for (let index = 0; index < case007Files.length; index += 1) {
  const [role, file, clueId] = case007Files[index];
  await fs.access(path.join(case007Dir, file));
  case007Assets.push({
    case_id: 'case-cervical-007', role, clue_id: clueId, sort_order: index,
    storage_key: `gametrinhtham/cases/case-007/${file}`,
    public_url: `/gametrinhtham/cases/case-007/${file}`,
    alt_text: `${role} ${file}`,
  });
}
if (case007Assets.length !== 9) throw new Error(`Case 007 must have 9 assets, got ${case007Assets.length}`);
await rest('healthclues_detective_case_assets', { method: 'POST', body: JSON.stringify(case007Assets) });
console.log(`Synced ${ALL_DETECTIVE_CASES.length} DB cases and ${case007Assets.length} Case 007 assets.`);
