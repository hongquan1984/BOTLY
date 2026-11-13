import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DOCS=['MASTER_SPEC.md','BUSINESS_RULES.md','DECISIONS_AND_ASSUMPTIONS.md','IMPLEMENTATION_PLAN.md','ACCEPTANCE_TESTS.md','CURRENT_STATE.md','UI_UX_SPEC.md','KNOWLEDGE_AND_SAFETY_SPEC.md','DATABASE_DESIGN.md','USE_CASES.md','COMMUNITY_AND_PRIVACY_SPEC.md','HEALTHCLUES_CONTEXT.md','README.md'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export async function buildIndex(docsRoot, projectRoot, outFile) {
  const entries=[];
  for(const name of DOCS){const file=path.join(docsRoot,name);try{const s=await fs.readFile(file,'utf8'); entries.push({file:name,bytes:Buffer.byteLength(s),sha256:hash(s),modifiedAt:(await fs.stat(file)).mtime.toISOString(),heading:s.split(/\r?\n/).filter(x=>/^#{1,3}\s/.test(x)).slice(0,18)});}catch{entries.push({file:name,missing:true});}}
  const inventory=[];
  for(const [base,d] of [[projectRoot,'src/app/play'],[projectRoot,'src/components/healthclues'],[projectRoot,'src/features/healthclues'],[projectRoot,'scripts'],[projectRoot,'supabase/migrations'],[docsRoot,'reports'],[docsRoot,'references']]){try{const full=path.join(base,d); const found=[]; async function walk(dir,depth=0){if(depth>3||found.length>=180)return;for(const ent of await fs.readdir(dir,{withFileTypes:true})){if(ent.name==='node_modules'||ent.name==='.git'||ent.name==='secrets')continue;const p=path.join(dir,ent.name);if(ent.isDirectory())await walk(p,depth+1);else found.push(path.relative(base,p).replaceAll('\\','/'));}} await walk(full);inventory.push({directory:path.join(base===docsRoot?'App': '',d).replaceAll('\\','/'),files:found});}catch{inventory.push({directory:path.join(base===docsRoot?'App': '',d).replaceAll('\\','/'),missing:true});}}
  const index=`# HealthClues Project Index\n\nGenerated ${new Date().toISOString()}. This is a navigation index, not requirements authority.\n\n## Actual layout\n\n- Git checkout and application source: \`${projectRoot}\`\n- HealthClues specifications and owner launcher: \`${docsRoot}\`\n- Manager: \`${path.dirname(outFile)}\`\n- The launcher at \`${path.join(docsRoot,'HealthClues_start_auto.bat')}\` changes into docsRoot, not the checkout root.\n\n## Project objective

HealthClues is a bilingual, safety-oriented wellness learning game. Its player flow connects Discovery Quiz, a personalized Wellness Plan, authenticated World/regions, lessons and activities, My Journey, NPC/Pet guidance, and private persistence. The actual app is a Next.js project pinned to version 16.3.0 with React 19.2.8 and Node 24.16.0 in this checkout. Its build script is the guarded isolated HealthClues build. No direct Playwright/Puppeteer dependency is listed; browser evidence comes from existing project scripts and local Chromium/CDP infrastructure. Shared game presentation lives in src/components/healthclues; the route is src/app/play; feature logic is under src/features/healthclues; API boundaries are under src/app/api/healthclues; local Supabase migrations are under supabase/migrations; browser and focused acceptance harnesses are under scripts.

## Factual baseline from latest dated sources (2026-11-02)

- MP17 Plan browser and persistence acceptance passed with explicitly synthetic fixtures and two isolated local accounts. This does not prove live AI recommendation quality or provider-generated persistence.
- A documented live Gemini request reached provider HTTP 200, while the app returned 503 RESPONSE_SCHEMA_MISMATCH before safety validation or Plan persistence. Reports say no more provider calls are authorized; recommendation quality remains unverified.
- EN/VI localization remains PARTIAL. Latest MP17 visual evidence showed Vietnamese AI goal titles on English My Journey. The NPC shell locale slice passed, while broader player localization and populated legacy 96-question account regression remain open.
- Latest MP17 acceptance says the current profile does not provide a persisted original 96-answer history source; do not claim retention proof without finding a real source.
- Evidence: App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md, App/reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md, App/reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md, and latest dated sections in App/CURRENT_STATE.md, App/IMPLEMENTATION_PLAN.md, and App/ACCEPTANCE_TESTS.md. These are dated evidence with stated limits, not blanket completion claims.
\n\nHealthClues is a bilingual, safety-oriented wellness learning game. Treat approved source specifications as authority; historical prompts and HEALTHCLUES_FINAL_COMPLETE.md are context only. Verify all status claims against source, tests, and dated reports. Never inspect secrets.\n\n## Source documents\n\n${entries.map(e=>`- ${e.file}${e.missing?' (missing)':` — ${e.bytes} bytes; SHA-256 ${e.sha256}; modified ${e.modifiedAt}`}\n  - ${e.heading?.slice(0,6).map(h=>h.replace(/^#+\s*/, '')).join('; ')||''}`).join('\n')}\n\n## Navigation / discovered implementation\n\n${inventory.map(x=>`### ${x.directory}${x.missing?' (not present)':''}\n${(x.files||[]).slice(0,60).map(f=>`- \`${f}\``).join('\n')}`).join('\n')}\n\n## Known review leads (not yet asserted as defects)\n\nAudit personalized recommendation quality, EN/VI consistency, legacy account regression, In-World Plan acceptance, Botanist RPG presentation, My Journey visual quality, pet guided spotlight, NPC equipment behavior, and other current acceptance requirements. Establish evidence per task before scheduling implementation.\n\n## Phase order and dependencies\n\nFirst establish a factual acceptance baseline; then prioritize safety/security and data boundaries; resolve functional/data integrations; address localization and visual acceptance; run regression and full acceptance. Use IMPLEMENTATION_PLAN.md and ACCEPTANCE_TESTS.md for actual dependency order.\n`;
  await fs.writeFile(outFile,index,'utf8'); return {documents:entries,inventory:inventory.map(x=>({directory:x.directory,count:x.files?.length||0,missing:!!x.missing}))};
}
export async function relevantContext(task, docsRoot, { overrides = {} } = {}) { const out=[];const terms=`${task.title} ${task.objective}`.toLowerCase().split(/[^a-z0-9-]+/).filter(x=>x.length>4);for(const rel of task.sourceRequirements||[]){if(rel.includes('..')||rel.toLowerCase().includes('secret'))continue;try{const file=path.resolve(docsRoot,rel);if(!file.startsWith(path.resolve(docsRoot)+path.sep))continue;const text=Object.hasOwn(overrides,rel)?overrides[rel]:await fs.readFile(file,'utf8');const sections=text.split(/(?=^#{1,3}\s)/m).filter(Boolean);const ranked=sections.map((body,index)=>({body,index,score:terms.reduce((n,w)=>n+(body.toLowerCase().includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).sort((a,b)=>a.index-b.index);out.push(`## ${rel}\n${ranked.map(x=>x.body.slice(0,4200)).join('\n')}`);}catch{}} return out.join('\n\n').slice(0,42000); }

// Source sent to audit-only AI is selected here by the trusted reader, never by AI output.
const AUDIT_FILES = {
  'HC-001': [
    'src/features/healthclues/personalized-wellness-plan.ts',
    'src/features/healthclues/gemini-wellness-plan.ts',
    'src/features/healthclues/server/wellness-plan-proof.ts',
    'src/features/healthclues/wellness-plan.ts',
    'src/features/healthclues/PersonalizedSuggestions.tsx',
    'scripts/test-healthclues-personalized-plan-contract.mjs',
    'scripts/test-healthclues-gemini-plan-pipeline.mjs',
    'scripts/test-healthclues-personalized-recommendations.mjs',
    'App/CURRENT_STATE.md',
    'App/ACCEPTANCE_TESTS.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_GEMINI_REALTIME_ADVISOR_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md'
  ],
  'HC-002': [
    'src/features/healthclues/personalized-wellness-plan.ts',
    'src/features/healthclues/PersonalizedSuggestions.tsx',
    'src/features/healthclues/wellness-plan.ts',
    'scripts/test-healthclues-localization.mjs',
    'scripts/test-healthclues-personalized-plan-contract.mjs',
    'scripts/test-healthclues-wellness-plan.mjs',
    'App/reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md'
  ],
  'HC-003': [
    'src/app/api/healthclues/account/route.ts',
    'src/app/api/healthclues/profile/route.ts',
    'src/app/api/healthclues/plan/route.ts',
    'src/features/healthclues/WorldAuthCallback.tsx',
    'src/components/healthclues/HealthCluesGameShell.tsx',
    'src/components/healthclues/HealthCluesDashboard.tsx',
    'scripts/test-healthclues-profile-activity-rest-e2e.mjs',
    'scripts/test-healthclues-owner-auth-demo.mjs',
    'scripts/verify-healthclues-owner-resume-after-restart.mjs',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_20_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md'
  ],
  'HC-004': [
    'src/components/healthclues/WellnessPlanBuilder.tsx',
    'src/features/healthclues/personalized-wellness-plan.ts',
    'src/features/healthclues/wellness-plan.ts',
    'src/app/api/healthclues/plan/route.ts',
    'scripts/test-healthclues-mp17-plan-selection-browser.mjs',
    'scripts/test-healthclues-mp20-two-question-browser.mjs',
    'scripts/test-healthclues-post-quiz-plan-browser.mjs',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_20_ACCEPTANCE.md'
  ],
  'HC-005': [
    'src/features/healthclues/WellnessWorldGame.tsx',
    'src/features/healthclues/WorldAdventureScene.tsx',
    'src/features/healthclues/RegionMapScene.tsx',
    'src/features/healthclues/HealthCluesPet.tsx',
    'src/components/healthclues/HealthCluesGameShell.tsx',
    'src/components/healthclues/HealthCluesLocaleProvider.tsx',
    'src/app/api/healthclues/npc-chat/route.ts',
    'scripts/test-healthclues-region-layout.mjs',
    'scripts/run-healthclues-game-e2e.mjs',
    'App/reports/RPG_VISUAL_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md'
  ],
  'HC-006': [
    'src/features/healthclues/JourneyToolkitSummary.tsx',
    'src/features/healthclues/ToolkitCollection.tsx',
    'src/features/healthclues/WellnessWorldGame.tsx',
    'src/components/healthclues/WellnessPlanBuilder.tsx',
    'src/features/healthclues/personalized-wellness-plan.ts',
    'src/app/api/healthclues/plan/route.ts',
    'src/app/api/healthclues/world/collection/route.ts',
    'scripts/test-healthclues-mp17-plan-selection-browser.mjs',
    'scripts/test-healthclues-mp20-two-question-browser.mjs',
    'App/reports/HEALTHCLUES_MY_JOURNEY_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_20_ACCEPTANCE.md'
  ],
  'HC-007': [
    'src/features/healthclues/HealthCluesPet.tsx',
    'src/features/healthclues/WellnessWorldGame.tsx',
    'src/features/healthclues/WorldAdventureScene.tsx',
    'src/features/healthclues/ToolkitCollection.tsx',
    'src/app/api/healthclues/world/collection/route.ts',
    'src/app/api/healthclues/world/route.ts',
    'src/app/api/healthclues/npc-chat/route.ts',
    'scripts/run-healthclues-game-e2e.mjs',
    'scripts/test-healthclues-world-db.mjs',
    'App/reports/PET_TOOLKIT_KNOWLEDGE_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md'
  ],
  'HC-008': [
    'src/components/healthclues/HealthCluesGameShell.tsx',
    'src/components/healthclues/WellnessPlanBuilder.tsx',
    'src/features/healthclues/personalized-wellness-plan.ts',
    'src/features/healthclues/WellnessWorldGame.tsx',
    'src/features/healthclues/WorldAdventureScene.tsx',
    'src/features/healthclues/HealthCluesPet.tsx',
    'src/app/api/healthclues/plan/route.ts',
    'src/app/api/healthclues/world/route.ts',
    'scripts/test-healthclues-localization.mjs',
    'scripts/test-healthclues-mp20-two-question-browser.mjs',
    'scripts/run-healthclues-game-e2e.mjs',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md',
    'App/reports/HEALTHCLUES_MASTER_PROMPT_20_ACCEPTANCE.md',
    'App/ACCEPTANCE_TESTS.md'
  ]
};

const safeRel = rel => typeof rel === 'string' && !path.isAbsolute(rel) && !rel.includes('..') && !/[<>:"|?*]/.test(rel) && !/(^|[\\/])(?:secrets?|\.env(?:\.|$)|node_modules|\.git|Manager)(?:[\\/]|$)/i.test(rel);
export async function readAuditEvidence(projectRoot, taskId, { maxFileBytes = 300_000, maxTotalBytes = 900_000 } = {}) {
  const allow = AUDIT_FILES[taskId];
  if (!allow) throw new Error(`No trusted audit reader allowlist for ${taskId}`);
  const root = await fs.realpath(projectRoot), files = [];
  let total = 0;
  for (const rel of allow) {
    if (!safeRel(rel)) throw new Error(`Unsafe trusted reader path: ${rel}`);
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(root + path.sep)) throw new Error(`Path escaped project root: ${rel}`);
    let cursor = root;
    for (const component of rel.split(/[\\/]/)) {
      cursor = path.join(cursor, component);
      const st = await fs.lstat(cursor);
      if (st.isSymbolicLink() || st.isReparsePoint?.()) throw new Error(`Symlink/reparse point in audit input: ${rel}`);
    }
    const st = await fs.stat(abs);
    if (!st.isFile() || st.size > maxFileBytes) throw new Error(`Audit input is not a regular bounded file: ${rel}`);
    const bytes = await fs.readFile(abs);
    total += bytes.length;
    if (total > maxTotalBytes) throw new Error(`Audit context exceeds ${maxTotalBytes} bytes`);
    files.push({ path: rel.replaceAll('\\', '/'), sha256: hash(bytes), bytes: bytes.length, content: bytes.toString('utf8') });
  }
  return { root, files, totalBytes: total, manifest: files.map(({ path, sha256, bytes }) => ({ path, sha256, bytes })) };
}

export async function verifyAuditEvidenceUnchanged(projectRoot, manifest) {
  const root = await fs.realpath(projectRoot), changed = [];
  for (const item of manifest) {
    if (!safeRel(item.path)) { changed.push(item.path); continue; }
    const abs = path.resolve(root, item.path);
    if (!abs.startsWith(root + path.sep)) { changed.push(item.path); continue; }
    try {
      const st = await fs.lstat(abs);
      if (st.isSymbolicLink() || st.isReparsePoint?.() || !st.isFile()) { changed.push(item.path); continue; }
      if (hash(await fs.readFile(abs)) !== item.sha256) changed.push(item.path);
    } catch { changed.push(item.path); }
  }
  return { ok: changed.length === 0, changed };
}

export async function hashTaskRequirements(docsRoot, projectRoot, requirements) {
  const docs = await fs.realpath(docsRoot), project = await fs.realpath(projectRoot), files = [];
  for (const rel of requirements || []) {
    if (!safeRel(rel)) throw new Error(`Unsafe requirement document path: ${rel}`);
    const abs = path.resolve(docs, rel);
    if (!abs.startsWith(docs + path.sep)) throw new Error(`Requirement document escaped docs root: ${rel}`);
    let cursor = docs;
    for (const component of rel.split(/[\\/]/)) {
      cursor = path.join(cursor, component);
      const st = await fs.lstat(cursor);
      if (st.isSymbolicLink() || st.isReparsePoint?.()) throw new Error(`Symlink/reparse point in requirement document: ${rel}`);
    }
    const st = await fs.stat(abs);
    if (!st.isFile()) throw new Error(`Requirement path is not a file: ${rel}`);
    const bytes = await fs.readFile(abs);
    const projectRelative = path.relative(project, abs).replaceAll('\\', '/');
    if (!safeRel(projectRelative) || projectRelative.startsWith('../')) throw new Error(`Requirement path escaped project root: ${rel}`);
    files.push({ path: projectRelative, sha256: hash(bytes), bytes: bytes.length, modifiedAt: st.mtime.toISOString() });
  }
  return [...new Map(files.map(file => [file.path, file])).values()];
}

export function affectedTasksByChangedSources(queue, docsRoot, projectRoot, changedPaths, staleAcceptedIds = []) {
  const changed = new Set(changedPaths.map(file => path.relative(projectRoot, path.resolve(projectRoot, file)).replaceAll('\\', '/').toLowerCase()));
  const staleIds = new Set(staleAcceptedIds);
  return queue.filter(task => {
    const documentMatch = (task.sourceRequirements || []).some(rel => {
      if (!safeRel(rel)) return false;
      const absolute = path.resolve(docsRoot, rel);
      const projectRelative = path.relative(projectRoot, absolute).replaceAll('\\', '/').toLowerCase();
      return changed.has(projectRelative);
    });
    return documentMatch || (task.dependencies || []).some(id => staleIds.has(id));
  }).map(task => task.taskId);
}
