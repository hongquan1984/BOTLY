import http from 'node:http';
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES } from '../../../gametrinhtham/src/data/cases.ts';
import { CASE_CERVICAL_007 } from '../../../gametrinhtham/src/data/cases-chapter3.ts';

const root = 'http://127.0.0.1:3339';
const assets = [
  ['scene-main', 'scene-main.jpg'], ['mai-before', 'mai-before.jpg'], ['mai-after', 'mai-after.jpg'],
  ['clue-closeup', 'closeup-01-pillow.jpg', 'clue-mai-pillow'], ['clue-closeup', 'closeup-02-laptop.jpg', 'clue-mai-laptop'],
  ['clue-closeup', 'closeup-03-mouse.jpg', 'clue-mai-mouse'], ['clue-closeup', 'closeup-04-phone.jpg', 'clue-mai-phone'],
  ['clue-closeup', 'closeup-05-ac-remote.jpg', 'clue-mai-ac'], ['clue-closeup', 'closeup-06-chicken.jpg', 'clue-mai-chicken'],
].map(([role, file, clueId], sortOrder) => ({ role, clueId, sortOrder, url: `/gametrinhtham/cases/case-007/${file}`, storageKey: `gametrinhtham/cases/case-007/${file}` }));
const case007ApiShape = {
  ...CASE_CERVICAL_007,
  clues: CASE_CERVICAL_007.clues.map((clue) => ({
    ...clue,
    title: clue.title ?? clue.name,
    shortDescription: clue.shortDescription ?? clue.description,
    detailedObservation: clue.detailedObservation ?? clue.description,
    icon: clue.icon ?? clue.discoveredIcon,
  })),
};
const cases = ALL_DETECTIVE_CASES.map((item) => ({ ...item, ...(item.id === CASE_CERVICAL_007.id ? case007ApiShape : {}), assets: item.id === CASE_CERVICAL_007.id ? assets : [] }));
const payload = { chapters: ALL_CHAPTERS, cases, rankTitle: 'Thám tử tập sự' };
const server = http.createServer((req, res) => {
  if (req.url === '/api/healthclues/mobile-detective/campaign') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(payload));
    return;
  }
  if (req.url === '/api/healthclues/mobile-detective/solve' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ success: true, caseId: 'case-cervical-007', stars: 3, expAwarded: 70, coinsAwarded: 150, unlockedNextCaseId: null }));
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(3339, '127.0.0.1', () => console.log(`local DB contract server ${root}`));
