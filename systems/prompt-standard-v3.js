'use strict';

/**
 * Prompt Standard V3 - 最终兼容版
 *
 * 目标：
 * 1. 支持结构化标记检查
 * 2. 支持自然语言兜底检查
 * 3. 兼容旧链路自然语言 Prompt
 * 4. 兼容当前系统两种 require 方式：
 *    - const StandardV3 = require(...)
 *    - const { checkStandardCompliance } = require(...)
 */

const SEPARATOR = ' | ';

const FIELD_DEFINITIONS = {
  CHARACTER: {
    label: '角色',
    blockMapping: ['【视觉】', '【角色约束】', '【人物介绍卡片】']
  },
  ACTION: {
    label: '动作',
    blockMapping: ['【动作】', '【动态】']
  },
  SCENE: {
    label: '场景',
    blockMapping: ['【环境布景】', '【空间】', '【环境质感】']
  },
  MOOD: {
    label: '情绪',
    blockMapping: ['【情绪】']
  },
  CAMERA: {
    label: '运镜',
    blockMapping: ['【运镜】', '【镜头时间轴】']
  },
  LIGHTING: {
    label: '照明',
    blockMapping: ['【照明】', '【照明方案】']
  },
  NEGATIVE: {
    label: '负面约束',
    blockMapping: ['【负面约束】', '【全局负面约束】']
  },
  AUDIO: {
    label: '音频',
    blockMapping: ['【环境音效】', '【音频】']
  },
  RENDER: {
    label: '技术规格',
    blockMapping: ['【技术规格】', '【渲染】']
  },
  DIRECTOR: {
    label: '导演',
    blockMapping: ['【导演】']
  }
};

function safeText(prompt) {
  return String(prompt || '');
}

function extractBlock(prompt, blockLabel) {
  const text = safeText(prompt);
  const escaped = blockLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}([^【]*)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parsePrompt(prompt) {
  const text = safeText(prompt);
  const fields = {};

  // 1. 优先按结构化块提取
  for (const [fieldName, def] of Object.entries(FIELD_DEFINITIONS)) {
    for (const blockPattern of def.blockMapping) {
      const content = extractBlock(text, blockPattern);
      if (content) {
        fields[fieldName] = {
          content,
          original: `${blockPattern}${content}`
        };
        break;
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    return fields;
  }

  // 2. 兜底：按分隔符切分
  if (text.includes(SEPARATOR)) {
    const parts = text.split(SEPARATOR).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return {
        RAW: {
          content: parts.join(SEPARATOR),
          original: text
        }
      };
    }
  }

  // 3. 再兜底：整段文本
  if (text.trim()) {
    return {
      RAW: {
        content: text.trim(),
        original: text.trim()
      }
    };
  }

  return null;
}

function naturalLanguageChecks(prompt) {
  const text = safeText(prompt);

  return {
    CHARACTER:
      /(?:角色|人物|男孩|女孩|男人|女人|少年|少女|女性|男性|人类|human|character|boy|girl|man|woman|\d+岁)/i.test(text),

    ACTION:
      /(?:伸手|奔跑|走近|凝视|抬头|低头|转身|说话|微笑|对视|触碰|冲刺|移动|动作|tracing|gripping|leaning|running|walking|speaking|gazing)/i.test(text),

    SCENE:
      /(?:场景|环境|山顶|森林|海边|室内|医院|教室|街道|客厅|荒原|雨林|诊室|病房|studio|room|hospital|forest|beach)/i.test(text),

    MOOD:
      /(?:温暖|治愈|紧张|压迫|震撼|平静|神秘|希望|悲伤|喜悦|愤怒|坚定|mysterious|epic|awe|warm|healing|tense|sad|joy|anger|calm)/i.test(text),

    CAMERA:
      /(?:推镜|拉镜|摇镜|移镜|跟拍|俯拍|仰拍|特写|中景|远景|dolly|pan|tilt|tracking|close-up|wide shot|medium shot)/i.test(text),

    LIGHTING:
      /(?:自然光|侧光|逆光|柔光|体积光|光影|色温|5800K|6500K|\b\d{4}K\b|golden hour|backlight|rim light|soft light)/i.test(text),

    NEGATIVE:
      /(?:no text|no watermark|no subtitle|no extra fingers|禁止|负面约束|全局负面约束)/i.test(text),

    AUDIO:
      /(?:伴随|动作产生|氛围弥漫|音乐线索|声画精准同步|环境音|音频|海浪|风声|脚步声|呼吸声)/i.test(text),

    RENDER:
      /(?:hyperrealistic|cinematic|35mm|HDR|超写实|电影级|photorealistic|film grain)/i.test(text),

    DIRECTOR:
      /(?:导演风格|Director style|导演|Villeneuve|Cameron|通用导演)/i.test(text)
  };
}

function structuredChecks(prompt) {
  const text = safeText(prompt);
  const result = {};

  for (const [fieldName, def] of Object.entries(FIELD_DEFINITIONS)) {
    result[fieldName] = def.blockMapping.some(label => !!extractBlock(text, label));
  }

  return result;
}

function checkStandardCompliance(prompt, shotId = 'unknown') {
  const structured = structuredChecks(prompt);
  const natural = naturalLanguageChecks(prompt);

  const checks = {
    CHARACTER: {
      found: structured.CHARACTER || natural.CHARACTER,
      structured: structured.CHARACTER,
      natural: natural.CHARACTER,
      weight: 1.0
    },
    ACTION: {
      found: structured.ACTION || natural.ACTION,
      structured: structured.ACTION,
      natural: natural.ACTION,
      weight: 1.0
    },
    SCENE: {
      found: structured.SCENE || natural.SCENE,
      structured: structured.SCENE,
      natural: natural.SCENE,
      weight: 1.0
    },
    MOOD: {
      found: structured.MOOD || natural.MOOD,
      structured: structured.MOOD,
      natural: natural.MOOD,
      weight: 0.8
    },
    CAMERA: {
      found: structured.CAMERA || natural.CAMERA,
      structured: structured.CAMERA,
      natural: natural.CAMERA,
      weight: 1.0
    },
    LIGHTING: {
      found: structured.LIGHTING || natural.LIGHTING,
      structured: structured.LIGHTING,
      natural: natural.LIGHTING,
      weight: 0.8
    },
    NEGATIVE: {
      found: structured.NEGATIVE || natural.NEGATIVE,
      structured: structured.NEGATIVE,
      natural: natural.NEGATIVE,
      weight: 0.8
    },
    AUDIO: {
      found: structured.AUDIO || natural.AUDIO,
      structured: structured.AUDIO,
      natural: natural.AUDIO,
      weight: 0.8
    },
    RENDER: {
      found: structured.RENDER || natural.RENDER,
      structured: structured.RENDER,
      natural: natural.RENDER,
      weight: 0.8
    },
    DIRECTOR: {
      found: structured.DIRECTOR || natural.DIRECTOR,
      structured: structured.DIRECTOR,
      natural: natural.DIRECTOR,
      weight: 0.6
    }
  };

  let totalWeight = 0;
  let foundWeight = 0;
  const missing = [];

  for (const [name, cfg] of Object.entries(checks)) {
    totalWeight += cfg.weight;
    if (cfg.found) {
      foundWeight += cfg.weight;
    } else {
      missing.push(name);
    }
  }

  const coverage = Math.round((foundWeight / totalWeight) * 100);

  return {
    shotId,
    coverage,
    passed: coverage >= 60,
    missing,
    checks,
    mode: {
      structuredHitCount: Object.values(structured).filter(Boolean).length,
      naturalHitCount: Object.values(natural).filter(Boolean).length
    }
  };
}

class StandardV3 {
  constructor() {}

  parsePrompt(prompt) {
    return parsePrompt(prompt);
  }

  checkStandardCompliance(prompt, shotId) {
    return checkStandardCompliance(prompt, shotId);
  }

  getFieldDefinitions() {
    return FIELD_DEFINITIONS;
  }
}

/**
 * 兼容当前系统：
 * 1. require(...) 返回可用对象
 * 2. 解构导出函数也可用
 */
function createCompatibleExport() {
  const instance = new StandardV3();

  // 让默认导出既像实例，也保留类能力
  instance.StandardV3 = StandardV3;
  instance.parsePrompt = parsePrompt;
  instance.checkStandardCompliance = checkStandardCompliance;
  instance.FIELD_DEFINITIONS = FIELD_DEFINITIONS;

  return instance;
}

const compatibleExport = createCompatibleExport();

module.exports = compatibleExport;
module.exports.StandardV3 = StandardV3;
module.exports.parsePrompt = parsePrompt;
module.exports.checkStandardCompliance = checkStandardCompliance;
module.exports.FIELD_DEFINITIONS = FIELD_DEFINITIONS;
