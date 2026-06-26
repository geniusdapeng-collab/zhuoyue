/**
 * ZhuoyueFieldAdapter - 卓越系统字段适配器
 * 作用: 将卓越系统的 shots 字段 ↔ 超现实系统25字段 双向映射
 * 位置: Field Quality Pipeline 注入前后
 * 
 * 核心映射策略:
 * 1. 卓越系统字段 → 25字段 (适配检查)
 *    - shot.prompt 是主要字段，包含完整渲染prompt
 *    - 将 prompt 同时映射到 prompt, baseline, director_instruction 等
 * 2. 25字段修复 → 卓越系统字段 (修复回写)
 *    - 将修复后的25字段合并回 shot.prompt
 * 3. 保持卓越系统原有字段结构不变
 */

const { safeSlice } = require('../field-standardizer');

// ============================================================
// 字段映射表
// ============================================================

// 卓越系统 → 25字段 (正向映射)
const ZHUOYUE_TO_25FIELD_MAP = {
  'prompt': 'prompt',
  'type': 'shot_type',
  'id': 'shot_id',
  'shotId': 'shot_id',
};

// 25字段 → 卓越系统 (反向映射)
const FIELD_25_TO_ZHUOYUE_MAP = {
  'prompt': 'prompt',
  'shot_type': 'type',
  'shot_id': 'id',
};

// ============================================================
// 适配器类
// ============================================================

class ZhuoyueFieldAdapter {
  constructor() {
    this.needsAdaptation = true;
  }

  /**
   * 将卓越系统 shot 转换为25字段格式 (用于检查)
   * v6.6.15-fix: 补全所有25字段映射，避免检查遗漏
   */
  to25FieldFormat(shot) {
    if (!shot) return null;

    const adapted = {
      // 核心字段
      shot_id: shot.id || shot.shotId || 'unknown',
      shot_type: shot.type || 'standard',
      prompt: shot.prompt || '',
      
      // 视觉字段
      scene: shot.scene || '',
      action: shot.action || shot.primary_action || '',
      character: shot.character || shot.characterRef || '',
      camera_movement: shot.cameraMovement?.description || shot.cameraString || '',
      lighting: shot.lighting?.description || shot.lightingString || '',
      mood: shot.mood || shot.emotionPhase || '',
      
      // 音频字段
      audio: shot.audioLayerString || shot.audio_description || '',
      transition: shot.timelineString || '',
      
      // 风格字段
      negative: shot.negativePrompt || '',
      color_palette: shot.colorScience || '',
      depth_of_field: shot.physicsLayer?.depthOfField || '',
      
      // 角色字段
      portraits: Array.isArray(shot.referenceImages) ? shot.referenceImages.join(',') : '',
      consistency: shot.characterCard || '',
      costume: shot.costume || '',
      makeup: shot.makeup || '',
      
      // 构图字段
      composition: shot.spatial_composition || '',
      props: Array.isArray(shot.props) ? shot.props.join(',') : '',
      
      // 时间字段
      timeline: shot.timelineString || '',
      pacing: shot.duration ? `${shot.duration}s` : '',
      
      // 约束字段
      bright_constraint: '', // 从prompt中提取
      character_constraint: '', // 从prompt中提取
      
      // 导演指令
      director_instruction: this._extractDirectorHint(shot),
      constraint: this._extractConstraint(shot),
      
      // 基线（用于对比）
      baseline: shot.prompt || '',
      
      // 标记为已适配
      _adapted: true,
      _originalSystem: 'zhuoyue'
    };

    return adapted;
  }

  /**
   * 将25字段修复结果转换回卓越系统格式 (用于回写)
   * v6.6.15-fix: 回写所有修复后的字段，不只是prompt
   */
  from25FieldFormat(shot25, originalShot) {
    if (!shot25 || !originalShot) return originalShot;

    const repaired = { ...originalShot };

    // 修复所有25个字段
    const fieldMappings = {
      'prompt': 'prompt',
      'scene': 'scene',
      'action': 'action',
      'character': 'character',
      'camera_movement': 'cameraString',
      'lighting': 'lightingString',
      'mood': 'mood',
      'negative': 'negativePrompt',
      'audio': 'audioLayerString',
      'transition': 'timelineString',
      'portraits': 'referenceImages',
      'consistency': 'characterCard',
      'color_palette': 'colorScience',
      'depth_of_field': 'physicsLayer',
      'timeline': 'timelineString',
      'bright_constraint': 'brightConstraint',
      'character_constraint': 'characterConstraint',
      'costume': 'costume',
      'props': 'props',
      'pacing': 'pacing',
      'makeup': 'makeup',
      'composition': 'spatialComposition',
      'director_instruction': 'directorStyle',
      'constraint': 'constraints',
      'baseline': 'baselinePrompt'
    };

    let hasRepair = false;
    for (const [field25, fieldZy] of Object.entries(fieldMappings)) {
      if (shot25[field25] && shot25[field25] !== originalShot[fieldZy]) {
        repaired[fieldZy] = shot25[field25];
        hasRepair = true;
      }
    }

    if (hasRepair) {
      repaired._fieldQualityRepaired = true;
    }

    // 保留适配标记
    repaired._fieldQualityAdapted = true;
    repaired._fieldQualityChecked = true;

    return repaired;
  }

  /**
   * 批量适配 shots
   */
  adaptShots(shots) {
    if (!Array.isArray(shots)) return [];
    return shots.map(shot => this.to25FieldFormat(shot));
  }

  /**
   * 批量回写修复结果
   */
  writeBack(adaptedShots, originalShots) {
    if (!Array.isArray(adaptedShots) || !Array.isArray(originalShots)) {
      return originalShots;
    }

    return adaptedShots.map((adapted, index) => {
      const original = originalShots[index];
      if (!adapted || !original) return original;
      return this.from25FieldFormat(adapted, original);
    });
  }

  /**
   * 提取导演指令提示
   */
  _extractDirectorHint(shot) {
    const hints = [];
    if (shot.type) hints.push(`镜头类型: ${shot.type}`);
    if (shot.duration) hints.push(`时长: ${shot.duration}s`);
    if (shot.scene) hints.push(`场景: ${shot.scene}`);
    return hints.join(' | ');
  }

  /**
   * 提取约束信息
   */
  _extractConstraint(shot) {
    const constraints = [];
    if (shot.noText) constraints.push('禁止文字');
    if (shot.realistic) constraints.push('写实风格');
    return constraints.join(', ');
  }
}

// ============================================================
// 工具函数
// ============================================================

function asString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

module.exports = {
  ZhuoyueFieldAdapter,
  ZHUOYUE_TO_25FIELD_MAP,
  FIELD_25_TO_ZHUOYUE_MAP
};
