/**
 * Prompt Output Standard - 全局提示词标准字段规范机制
 * v6.6.9.4-patch21: 外部专家方案 - Prompt收口器
 * 
 * 职责：
 * 1. 定义标准字段列表（STANDARD_PROMPT_FIELDS）
 * 2. 提供 applyGlobalPromptStandard(shots, stages) 统一收口
 * 3. 确保每个 shot 输出都包含 referenceImages、characterCard、characterRef 等字段
 * 4. 兜底：如果 referenceImages 为空，从 stages.characters 重建
 */

'use strict';

const { buildReferenceImagesForShot, buildCharacterCardText } = require('./prompt-reference-fix');

// ========== 标准字段定义 ==========
const STANDARD_PROMPT_FIELDS = [
  'shotId', 'id', 'type', 'scene', 'prompt', 'referenceImages',
  'duration', 'length', 'mouthAction', 'utilization', 'utilizationStatus',
  'qualityScore', 'enhanced', 'cameraMovement', 'emotionPhase',
  'importance', 'visualComplexity', 'dialogue', 'narration',
  'characterRef', 'character', 'timeline', 'backgroundSound',
  'isOpening', 'title', 'characterCard'
];

// ========== 全局标准收口器 ==========
function applyGlobalPromptStandard(shots, stages = {}) {
  if (!Array.isArray(shots)) {
    console.warn('[PromptOutputStandard] shots is not an array');
    return shots;
  }

  const results = [];

  for (const shot of shots) {
    if (!shot || typeof shot !== 'object') {
      results.push(shot);
      continue;
    }

    // 1. 保底 referenceImages（关键修复）
    if (!shot.referenceImages || shot.referenceImages.length === 0) {
      const rebuilt = buildReferenceImagesForShot(shot, stages);
      if (rebuilt.length > 0) {
        shot.referenceImages = rebuilt;
        console.log(`[PromptOutputStandard] 🔄 重建定妆照: ${shot.shotId || shot.id} | ${rebuilt.length}张`);
      }
    }

    // 2. 保底 characterCard
    if (!shot.characterCard || shot.characterCard === '') {
      const card = buildCharacterCardText(shot, stages);
      if (card) {
        shot.characterCard = card;
      }
    }

    // 3. 保底 characterRef
    if (!shot.characterRef || shot.characterRef === '') {
      const chars = shot.characters || [];
      if (chars.length > 0) {
        shot.characterRef = chars.join(',');
      }
    }

    // 4. 统一 shotId / id
    if (!shot.shotId && shot.id) shot.shotId = shot.id;
    if (!shot.id && shot.shotId) shot.id = shot.shotId;

    // 5. 统一 type
    if (!shot.type && shot.shotType) shot.type = shot.shotType;

    // 6. 标准化 narration（空字符串替代 undefined）
    if (shot.narration === undefined) shot.narration = '';
    if (shot.dialogue === undefined) shot.dialogue = '';

    // 7. 统一 isOpening
    if (shot.isOpening === undefined) {
      shot.isOpening = (shot.id === 'S00' || shot.type === 'opening');
    }

    results.push(shot);
  }

  return results;
}

// ========== 字段存在性检查 ==========
function checkStandardCompliance(shot) {
  const required = ['shotId', 'prompt', 'referenceImages', 'duration'];
  const missing = required.filter(f => {
    const v = shot[f];
    return v === undefined || v === null || v === '';
  });

  return {
    passed: missing.length === 0,
    missing,
    shotId: shot.shotId || shot.id
  };
}

// ========== 批量检查 ==========
function checkAllShots(shots) {
  return shots.map(checkStandardCompliance);
}

module.exports = {
  STANDARD_PROMPT_FIELDS,
  applyGlobalPromptStandard,
  checkStandardCompliance,
  checkAllShots
};
