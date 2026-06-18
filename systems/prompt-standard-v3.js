'use strict';

/**
 * Prompt Standard V3
 * 兼容：
 * 1. 标准块格式
 * 2. 历史块格式
 * 3. 自然语言兜底识别
 */

const SEPARATOR = ' | ';

const FIELD_DEFINITIONS = {
  CHARACTER: {
    blockMapping: ['【视觉】', '【角色】', '【角色约束】', '【人物介绍卡片】'],
    keywords: [
      'boy', 'girl', 'man', 'woman', 'child', 'doctor', 'nurse',
      '角色', '人物', '主角', '主持人', '老师', '医生', '护士'
    ],
    weight: 1.0
  },
  ACTION: {
    blockMapping: ['【动态】', '【动作】'],
    keywords: [
      '动作', '执行', '奔跑', '转身', '伸手', '靠近', '触碰', '观察',
      'running', 'turning', 'reaching', 'approaching', 'touching'
    ],
    weight: 1.0
  },
  SCENE: {
    blockMapping: ['【空间】', '【环境布景】', '【环境质感】', '【场景】'],
    keywords: [
      '场景', '环境', '空间', '背景', '山', '海', '医院', '教室',
      'forest', 'mountain', 'ocean', 'hospital', 'room', 'studio'
    ],
    weight: 1.0
  },
  MOOD: {
    blockMapping: ['【情绪】', '【风格】'],
    keywords: [
      '情绪', '氛围', '紧张', '温暖', '治愈', '高潮', '宁静', '神秘',
      'mood', 'emotional', 'warm', 'tense', 'peaceful', 'mysterious'
    ],
    weight: 0.8
  },
  CAMERA: {
    blockMapping: ['【镜头时间轴】', '【运镜】', '【方位】'],
    keywords: [
      '镜头', '运镜', '推近', '拉远', '摇镜', '环绕', '跟拍',
      'camera', 'dolly', 'pan', 'tilt', 'orbit', 'tracking', 'wide shot', 'close-up', 'medium shot'
    ],
    weight: 1.0
  },
  LIGHTING: {
    blockMapping: ['【照明】', '【照明方案】'],
    keywords: [
      '光照', '照明', '色温', '主光', '补光', '背光', '轮廓光',
      'lighting', 'key light', 'fill light', 'rim light', 'backlight', '5600K', '3200K', '6500K'
    ],
    weight: 0.9
  },
  NEGATIVE: {
    blockMapping: ['【负面约束】', '【全局负面约束】'],
    keywords: [
      '禁止', 'no text', 'no watermark', 'no anime', 'no cartoon', '负面约束'
    ],
    weight: 0.7
  },
  AUDIO: {
    blockMapping: ['【环境音效】', '【音频】', '【旁白/台词】', '【台词】'],
    keywords: [
      '伴随', '动作产生', '氛围弥漫', '音乐线索', '声画精准同步',
      '音频', '声音', '环境音', '台词',
      'ambient', 'sound', 'audio', 'dialogue', 'music'
    ],
    weight: 0.8
  },
  RENDER: {
    blockMapping: ['【渲染】', '【技术规格】'],
    keywords: [
      '超写实', '电影级', '渲染', 'HDR', '35mm',
      'render', 'hyperrealistic', 'cinematic', 'film grain'
    ],
    weight: 0.8
  },
  DIRECTOR: {
    blockMapping: ['【导演】'],
    keywords: [
      '导演', '风格', 'aesthetic', 'director', 'style'
    ],
    weight: 0.7
  }
};

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractBlock(prompt, blockLabel) {
  const escaped = escapeRegExp(blockLabel);
  const regex = new RegExp(`${escaped}([\\s\\S]*?)(?=【[^】]+】|$)`, 'i');
  const match = String(prompt || '').match(regex);
  return match ? match[1].trim() : '';
}

function parsePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;

  const fields = {};

  for (const [fieldName, def] of Object.entries(FIELD_DEFINITIONS)) {
    for (const block of def.blockMapping) {
      const content = extractBlock(prompt, block);
      if (content) {
        fields[fieldName] = {
          content,
          original: `${block}${content}`,
          source: block
        };
        break;
      }
    }
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

function containsKeyword(prompt, keywords = []) {
  const lower = String(prompt || '').toLowerCase();
  return keywords.some(kw => lower.includes(String(kw).toLowerCase()));
}

function checkStandardCompliance(prompt, shotId = 'unknown') {
  const parsed = parsePrompt(prompt);
  const checks = {};

  for (const [fieldName, def] of Object.entries(FIELD_DEFINITIONS)) {
    let found = false;
    let reason = '';

    // 1. 优先检查块格式
    if (parsed && parsed[fieldName] && parsed[fieldName].content) {
      found = true;
      reason = `block:${parsed[fieldName].source}`;
    } else {
      // 2. 自然语言兜底
      if (containsKeyword(prompt, def.keywords)) {
        found = true;
        reason = 'keyword_fallback';
      }
    }

    checks[fieldName] = {
      found,
      weight: def.weight,
      reason
    };
  }

  let totalWeight = 0;
  let hitWeight = 0;
  const missing = [];

  for (const [fieldName, result] of Object.entries(checks)) {
    totalWeight += result.weight;
    if (result.found) {
      hitWeight += result.weight;
    } else {
      missing.push(fieldName);
    }
  }

  const score = totalWeight > 0
    ? Math.round((hitWeight / totalWeight) * 100)
    : 0;

  return {
    shotId,
    score,
    checks,
    missing,
    parsed
  };
}

module.exports = {
  FIELD_DEFINITIONS,
  parsePrompt,
  checkStandardCompliance
};
