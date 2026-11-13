import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Since this is a TS file, let's verify either by reading and parsing or running through tsx/esbuild
const tsFilePath = resolve('d:/botly/src/data/healthclues-botanical-library.ts');
const fileContent = readFileSync(tsFilePath, 'utf-8');

console.log('Testing botanical library content & integrity...');

// 1. Verify all 4 required botanicals are present
const expectedIds = [
  'perilla-frutescens',
  'hibiscus-sabdariffa',
  'matricaria-chamomilla',
  'passiflora-incarnata'
];

for (const id of expectedIds) {
  if (!fileContent.includes(`id: '${id}'`)) {
    console.error(`FAIL: Missing expected ID: ${id}`);
    process.exit(1);
  }
}
console.log('PASS: All 4 botanicals present by ID.');

// 2. Verify all real PubMed links
const expectedPMIDs = [
  '26425999', // Perilla Huo et al. 2015
  '30600717', // Perilla Liu et al. 2020
  '18423919', // Hibiscus Prasongwatana et al. 2008
  '20018807', // Hibiscus McKay et al. 2010
  '29154054', // Chamomile Adib-Hajbaghery et al. 2017
  '21939549', // Chamomile Zick et al. 2011
  '7617761',  // Chamomile Viola et al. 1995
  '33352740', // Passiflora Janda et al. 2020 (Systematic Review)
  '21294203', // Passiflora Ngan & Conduit 2011
  '21089181'  // Passiflora Appel et al. 2011
];

for (const pmid of expectedPMIDs) {
  const expectedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  if (!fileContent.includes(expectedUrl)) {
    console.error(`FAIL: Missing verified PubMed URL: ${expectedUrl}`);
    process.exit(1);
  }
}
console.log('PASS: All real PubMed URLs and PMIDs verified.');

// 3. Verify forbidden promissory language
const forbiddenPatterns = [
  /chữa khỏi bệnh/i,
  /dùng để điều trị/i,
  /uống mỗi ngày để trị/i,
  /cure for gout/i,
  /cure for insomnia/i
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(fileContent)) {
    console.error(`FAIL: Found forbidden promotional/promissory phrase matching: ${pattern}`);
    process.exit(1);
  }
}
console.log('PASS: No forbidden promotional/cure claims found.');

// 4. Verify evidence levels
const requiredEvidenceLevels = [
  'animal',
  'human_observational',
  'human_clinical_trial',
  'systematic_review'
];

for (const level of requiredEvidenceLevels) {
  if (!fileContent.includes(`evidenceLevel: '${level}'`)) {
    console.error(`FAIL: Missing evidenceLevel: ${level}`);
    process.exit(1);
  }
}
console.log('PASS: Distinct evidence levels verified.');

// 5. Verify reviewStatus and lastVerifiedDate
if (!fileContent.includes(`reviewStatus: 'approved'`)) {
  console.error("FAIL: Missing reviewStatus: 'approved'");
  process.exit(1);
}
if (!fileContent.includes(`lastVerifiedDate: '2026-11-07'`)) {
  console.error("FAIL: Missing lastVerifiedDate: '2026-11-07'");
  process.exit(1);
}
console.log('PASS: Approved status and lastVerifiedDate 2026-11-07 verified.');

// 6. Verify helper functions are exported
const expectedHelpers = [
  'searchBotanicalLibrary',
  'getBotanicalsByTopic',
  'filterByEvidenceLevel',
  'getBotanicalById',
  'getBotanicalBySlug'
];

for (const helper of expectedHelpers) {
  if (!fileContent.includes(`export function ${helper}`)) {
    console.error(`FAIL: Missing exported helper: ${helper}`);
    process.exit(1);
  }
}
console.log('PASS: All helper functions exported.');

console.log('\nALL BOTANICAL LIBRARY INTEGRITY CHECKS PASSED SUCCESSFULLY!');
