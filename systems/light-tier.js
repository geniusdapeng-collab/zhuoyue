// systems/light-tier.js
// Light Tier / 光线档位系统
// v4.1规范编码

const LightTier = {
  A: {
    name: '明亮探索',
    nameEn: 'Bright Exploration',
    colorTemp: '5600K',
    contrastRatio: '2:1',
    description: '明亮探索 - 均匀照明，低反差，适合展示环境细节',
    usage: '探索、发现、儿童向友好镜头',
    examples: ['S00星渊初临', 'S01荧光平原']
  },
  B: {
    name: '神秘低照',
    nameEn: 'Mystery Low-Key',
    colorTemp: '3200-4000K',
    contrastRatio: '4:1',
    description: '神秘低照 - 局部照明，中等反差，营造悬疑氛围',
    usage: '未知、悬疑、逼近前夜',
    examples: ['S02深渊初遇']
  },
  C: {
    name: '对抗高反差',
    nameEn: 'Contrast Drama',
    colorTemp: '混合色温',
    contrastRatio: '8:1+',
    description: '对抗高反差 - 强烈明暗对比，高反差，突出冲突',
    usage: '冲突、觉醒、威压',
    examples: ['S03古战对决']
  },
  D: {
    name: '神圣显现',
    nameEn: 'Divine Manifestation',
    colorTemp: '非现实色温(金/青)',
    contrastRatio: '16:1+',
    description: '神圣显现 - 极端照明，史诗感，超现实色温',
    usage: '显灵、启示、史诗瞬间',
    examples: ['S04星陨终章']
  }
};

// 光线档位验证
function validateLightTier(tier) {
  return LightTier[tier] || null;
}

// 生成光线Prompt片段
function getLightTierPrompt(tier) {
  const t = LightTier[tier];
  if (!t) return '';
  return `${t.nameEn} lighting, ${t.colorTemp}, ${t.contrastRatio} contrast ratio, ${t.description}`;
}

// 根据场景类型推荐光线档位
function recommendLightTier(sceneType, mood) {
  const mapping = {
    'opening': 'A',
    'exploration': 'A',
    'discovery': 'A',
    'suspense': 'B',
    'mystery': 'B',
    'confrontation': 'C',
    'combat': 'C',
    'climax': 'D',
    'revelation': 'D',
    'resolution': 'A'
  };
  
  return mapping[sceneType] || mapping[mood] || 'A';
}

module.exports = { LightTier, validateLightTier, getLightTierPrompt, recommendLightTier };
