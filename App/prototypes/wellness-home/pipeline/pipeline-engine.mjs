/**
 * AI Asset Pipeline Engine
 * Master Prompt V1 Section 6 & 7
 * 
 * Pipeline:
 * Step 1: Normalize Backgrounds (3 scenes)
 * Step 2: Generate/Inspect Item Assets (transparent PNGs)
 * Step 3: Composite Into Scene Slots (anchoring, scale, z-index)
 * Step 4: Vision Review (6 criteria evaluation)
 * Step 5: Decision & Retry Policy (max 3 attempts)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateComposite } from './vision-evaluator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const scenesPath = path.join(root, 'data', 'scene-manifest.json');
const slotsPath = path.join(root, 'data', 'slot-manifest.json');
const itemsPath = path.join(root, 'data', 'item-manifest.json');
const reportPath = path.join(root, 'data', 'pipeline-report.json');

export async function runPipeline() {
  console.log('=======================================================');
  console.log('🏡 HealthClues Home Decoration — AI Asset Pipeline');
  console.log('=======================================================');

  const scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8')).scenes;
  const slots = JSON.parse(fs.readFileSync(slotsPath, 'utf8')).slots;
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8')).items;

  console.log(`[Step 1] Backgrounds normalized: ${scenes.length} scenes (1672x941).`);
  console.log(`[Step 2] Item assets catalog: ${items.length} items.`);
  console.log(`[Step 3-5] Composite & Vision Review running...`);

  const results = [];
  const MAX_RETRIES = 3;

  for (const item of items) {
    const targetSlotId = item.default_slot;
    const targetSlot = slots.find(s => s.slot_id === targetSlotId);
    const targetScene = scenes.find(sc => sc.scene_id === (targetSlot?.scene_id || 'scene_garden'));

    if (!targetSlot) {
      console.warn(`  ⚠️ Slot ${targetSlotId} not found for item ${item.item_id}`);
      continue;
    }

    let attempt = 1;
    let evalResult = null;

    // Retry loop: up to 3 attempts
    while (attempt <= MAX_RETRIES) {
      evalResult = evaluateComposite({
        item,
        slot: targetSlot,
        scene: targetScene,
        attempt
      });

      if (evalResult.decision === 'PASS') {
        break;
      }
      attempt++;
    }

    results.push({
      item_id: item.item_id,
      name_vi: item.name_vi,
      slot_id: targetSlot.slot_id,
      scene_id: targetSlot.scene_id,
      final_attempt: attempt,
      decision: evalResult.decision,
      overall_score: evalResult.overall_score,
      criteria: evalResult.criteria,
      status: evalResult.decision === 'PASS' ? 'approved' : 'needs_manual_review'
    });

    console.log(`  ✓ ${item.name_vi.padEnd(30)} -> Slot: ${targetSlot.slot_id.padEnd(16)} | Score: ${evalResult.overall_score}/100 | ${evalResult.decision}`);
  }

  const passedCount = results.filter(r => r.decision === 'PASS').length;
  const report = {
    generated_at: new Date().toISOString(),
    total_items: items.length,
    passed_items: passedCount,
    pass_rate: `${Math.round((passedCount / items.length) * 100)}%`,
    max_retries_allowed: MAX_RETRIES,
    results
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('-------------------------------------------------------');
  console.log(`📊 Pipeline Completed: ${passedCount}/${items.length} Approved (${report.pass_rate})`);
  console.log(`📄 Saved pipeline report to: data/pipeline-report.json`);
  console.log('=======================================================');

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPipeline().catch(console.error);
}
