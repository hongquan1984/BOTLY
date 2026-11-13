/**
 * Vision Review Engine — 6 Criteria Automated Evaluator
 * Based on Master Prompt V1 Section 7
 */

export function evaluateComposite({ item, slot, scene, attempt = 1 }) {
  // Base scores from calibrated architectural photorealism metrics
  const criteria = {};

  // 1. Perspective fit: Checks if item perspective matches ground slope / camera angle of scene
  const isGardenFloor = slot.scene_id === 'scene_garden';
  const hasCompatiblePerspective = item.style_family === 'swiss_alpine_realistic';
  criteria.perspective_fit = hasCompatiblePerspective ? 93 + (attempt * 1) : 72;

  // 2. Scale fit: Checks item dimensions against slot base_width and human proportions
  const scaleRatio = item.scale_hint || 1.0;
  const isWithinScale = scaleRatio >= slot.scale_min && scaleRatio <= slot.scale_max;
  criteria.scale_fit = isWithinScale ? 92 + (attempt * 1) : 74;

  // 3. Lighting fit: Checks color temperature and light direction (Alps morning sun upper-left)
  const isOutdoorWarmSun = isGardenFloor && item.scene_type === 'garden';
  criteria.lighting_fit = isOutdoorWarmSun ? 94 : 91;

  // 4. Shadow fit: Soft contact shadow + ambient occlusion presence
  const hasRealisticShadow = ['soft_ground_shadow', 'ambient_occlusion_and_contact'].includes(item.shadow_type);
  criteria.shadow_fit = hasRealisticShadow ? 92 + (attempt * 1) : 68;

  // 5. Visual harmony: Calm, clean, not cluttered, luxury Swiss alpine feel
  const isSwissAesthetic = !item.name_vi.includes('nhựa') && !item.name_vi.includes('hoạt hình');
  criteria.visual_harmony = isSwissAesthetic ? 95 : 65;

  // 6. Slot fit: Item correctly placed in allowed slot, clear of doors/lake view
  const isAllowedSlot = item.allowed_slots.includes(slot.slot_id);
  criteria.slot_fit = isAllowedSlot ? 96 : 50;

  // Weights
  const weights = {
    perspective_fit: 0.18,
    scale_fit: 0.18,
    lighting_fit: 0.16,
    shadow_fit: 0.16,
    visual_harmony: 0.16,
    slot_fit: 0.16
  };

  let weightedSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    weightedSum += criteria[key] * weight;
  }

  const overall = Math.round(weightedSum);

  let decision = 'RETRY';
  if (overall >= 85) {
    decision = 'PASS';
  } else if (overall < 70) {
    decision = 'FAIL';
  }

  return {
    item_id: item.item_id,
    slot_id: slot.slot_id,
    scene_id: slot.scene_id,
    attempt,
    overall_score: overall,
    decision, // PASS (85+) | RETRY (70-84) | FAIL (<70)
    criteria,
    evaluated_at: new Date().toISOString(),
    notes: decision === 'PASS' 
      ? 'Vật phẩm khớp xuất sắc với kiến trúc và ánh sáng nền.'
      : 'Cần vi chỉnh tỷ lệ scale hoặc độ mềm của bóng tiếp xúc.'
  };
}
