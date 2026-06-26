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
   */
  to25FieldFormat(shot) {
    if (!shot) return null;

    const adapted = {
      // 核心字段
      shot_id: shot.id || shot.shotId || 'unknown',
      shot_type: shot.type || 'standard',
      prompt: shot.prompt || '',
      
      // 将 prompt 内容映射到其他相关字段（用于全面检查）
      baseline: shot.prompt || '',
      director_instruction: this._extractDirectorHint(shot),
      constraint: this._extractConstraint(shot),
      
      // 默认空值（避免检查报错）
      scene: '',
      action: '',
      character: '',
      camera_movement: '',
      lighting: '',
      mood: '',
      negative: '',
      audio: '',
      transition: '',
      portraits: '',
      consistency: '',
      color_palette: '',
      depth_of_field: '',
      timeline: '',
      bright_constraint: '',
      character_constraint: '',
      costume: '',
      props: '',
      pacing: '',
      makeup: '',
      composition: '',
      
      // 标记为已适配
      _adapted: true,
      _originalSystem: 'zhuoyue'
    };

    return adapted;
  }

  /**
   * 将25字段修复结果转换回卓越系统格式 (用于回写)
   */
  from25FieldFormat(shot25, originalShot) {
    if (!shot25 || !originalShot) return originalShot;

    const repaired = { ...originalShot };

    // 只修复 prompt 字段（卓越系统的主要字段）
    if (shot25.prompt && shot25.prompt !== originalShot.prompt) {
      repaired.prompt = shot25.prompt;
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
