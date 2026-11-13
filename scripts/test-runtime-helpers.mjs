import {
  botanicalLibrary,
  searchBotanicalLibrary,
  getBotanicalsByTopic,
  filterByEvidenceLevel,
  getBotanicalById,
  getBotanicalBySlug
} from '../src/data/healthclues-botanical-library.ts';

console.log('Total articles:', botanicalLibrary.length);
if (botanicalLibrary.length !== 4) throw new Error('Expected 4 articles');

const goutArticles = getBotanicalsByTopic('gout');
console.log('Gout articles count:', goutArticles.length);
if (goutArticles.length !== 2) throw new Error('Expected 2 gout articles');

const sleepArticles = getBotanicalsByTopic('sleep');
console.log('Sleep articles count:', sleepArticles.length);
if (sleepArticles.length !== 2) throw new Error('Expected 2 sleep articles');

const perillaSearch = searchBotanicalLibrary('tía tô');
console.log('Search "tía tô" count:', perillaSearch.length);
if (perillaSearch.length < 1 || perillaSearch[0].id !== 'perilla-frutescens') throw new Error('Failed search for tía tô');

const xoSearch = searchBotanicalLibrary('xanthine oxidase');
console.log('Search "xanthine oxidase" count:', xoSearch.length);
if (xoSearch.length < 1) throw new Error('Failed search for xanthine oxidase');

const gabaSearch = searchBotanicalLibrary('GABA');
console.log('Search "GABA" count:', gabaSearch.length);
if (gabaSearch.length !== 2) throw new Error('Expected 2 articles matching GABA (chamomile and passiflora)');

const animalArticles = filterByEvidenceLevel('animal');
console.log('Animal evidence count:', animalArticles.length);
if (animalArticles.length !== 1 || animalArticles[0].id !== 'perilla-frutescens') throw new Error('Failed filterByEvidenceLevel animal');

const srArticles = filterByEvidenceLevel('systematic_review');
console.log('Systematic review count:', srArticles.length);
if (srArticles.length !== 1 || srArticles[0].id !== 'passiflora-incarnata') throw new Error('Failed filterByEvidenceLevel systematic_review');

const byId = getBotanicalById('hibiscus-sabdariffa');
if (!byId || byId.commonName.vi !== 'Atiso đỏ / Bụp giấm') throw new Error('Failed getBotanicalById');

const bySlug = getBotanicalBySlug('cuc-la-ma-matricaria-chamomilla');
if (!bySlug || bySlug.scientificName !== 'Matricaria chamomilla L. (syn. Matricaria recutita L.)') throw new Error('Failed getBotanicalBySlug');

console.log('ALL RUNTIME FUNCTION TESTS PASSED WITH 100% SUCCESS!');
