/**
 * Ambient Sound Designer v1.0 — 环境音效设计Agent
 * 为每个镜头根据具体场景环境生成Diegetic环境音效描述
 * 作为独立字段【环境音效】注入Seedance Prompt
 * 
 * 设计原则：
 * 1. 纯环境音（Diegetic）——只来自画面内的声音，无音乐/旁白
 * 2. 根据场景环境自适应——不是固定音效列表，而是根据镜头描述智能匹配
 * 3. 预算控制——约60-80字符，不占用核心视觉描述空间
 */

const GENERIC_SOUND_MAP = {
  // 植被类
  vegetation: {
    '树': ['树叶沙沙声', '树枝轻摆声'],
    '林': ['森林环境音', '树叶摩擦声'],
    '草': ['草地微风声', '草叶沙沙声'],
    '花': ['花瓣飘动声', '花园宁静氛围'],
    '植物': ['植物生长细微声', '叶片呼吸声'],
    '通用植被': ['树叶沙沙声', '草叶摩擦声', '自然微风声']
  },
  // 水体类
  water: {
    '河': ['河流潺潺声', '水波轻拍声'],
    '湖': ['湖面微波声', '水鸟低鸣声'],
    '海': ['海浪轻拍声', '海鸥叫声'],
    '瀑布': ['水流轰鸣声', '水雾弥漫声'],
    '通用水': ['水流声', '水滴声', '水波声']
  },
  // 动物类
  fauna: {
    '鸟': ['鸟鸣声', '翅膀扑动声'],
    '动物': ['动物活动声', '自然环境声'],
    '通用动物': ['鸟鸣', '昆虫嗡嗡声']
  },
  // 地形类
  terrain: {
    '山': ['山间风声', '岩石回声'],
    '石': ['石块碰撞声', '矿物质感声'],
    '废墟': ['废墟寂静声', '老旧结构声'],
    '通用地形': ['风声', '地面摩擦声']
  },
  // 天气类
  weather: {
    '风': ['风声', '风穿过物体声'],
    '光': ['光线穿透声', '明亮氛围'],
    '太阳': ['阳光温暖感', '日光普照声'],
    '通用天气': ['风声', '自然背景音']
  }
};

// Nirath专属音效映射（保留给Nirath模式使用）
const NIRATH_SOUND_MAP = {
  // 植被类
  vegetation: {
    '磁丝树': ['磁丝树金属般轻响', '磁力纤维震颤嗡鸣', '磁丝树叶片碰撞声'],
    '荧光孢子': ['荧光孢子细微爆裂', '孢子飘浮轻柔嗡鸣', '孢子发光细微滋滋声'],
    '发光藤蔓': ['藤蔓柔和嗡鸣', '生物荧光脉动声', '藤蔓生长细微摩擦'],
    '水晶植物': ['晶体共振清脆音', '光能转化细微嗡鸣', '水晶叶片碰撞'],
    '巨型叶片': ['大叶扇动风声', '叶片呼吸般起伏声', '光合作用能量流动'],
    '通用植被': ['树叶沙沙声', '草叶摩擦声', '植物生长细微声响']
  },
  // 水体类
  water: {
    '液态金属河': ['液态汞波动声', '金属水流切割声', '磁性河流共鸣'],
    '弱水': ['弱水特殊共鸣', '旋涡低频嗡鸣', '水面能量波动'],
    '瀑布': ['水流切割轰鸣', '水雾撞击声', '瀑布能量释放'],
    '通用水': ['水流声', '水滴声', '水波声']
  },
  // 动物类
  fauna: {
    '磁丝鸟': ['磁丝羽毛共振', '磁力飞行嗡鸣', '生物磁场脉冲'],
    '晶兽': ['晶体甲壳碰撞', '能量共鸣声', '生物发光脉动'],
    '通用动物': ['鸟鸣', '昆虫嗡嗡声', '动物活动声']
  },
  // 地形类
  terrain: {
    '磁石平原': ['磁力场震颤', '磁石共鸣', '地表能量脉动'],
    '水晶山脉': ['晶体共振', '山脉能量共鸣', '地质结构震动'],
    '废墟': ['废墟寂静声', '老旧结构声', '崩塌回声'],
    '通用地形': ['风声', '地面摩擦声', '岩石碰撞']
  },
  // 天气类
  weather: {
    '双恒星风': ['太阳风粒子嘶嘶声', '恒星辐射细微嗡鸣', '光压波动'],
    '极光': ['极光能量嘶嘶', '磁层共振', '带电粒子碰撞细微噼啪'],
    '磁暴': ['磁暴冲击波', '磁场剧烈震颤', '能量释放轰鸣'],
    '孢子风暴': ['孢子群撞击声', '风暴中生物嗡鸣', '风力携带动植物声响'],
    '通用天气': ['风声', '自然背景音']
  }
};

const SCENE_KEYWORDS = {
  vegetation: ['树', '林', '草', '叶', '孢子', '藤蔓', '植物', '花', '森林', '丛林', '植被', '荧光'],
  water: ['水', '河', '湖', '海', '溪', '瀑布', '流', '湿', '液体', '弱水', '液态金属'],
  fauna: ['鸟', '兽', '虫', '动物', '生物', '飞', '翅膀', '鸣叫'],
  terrain: ['山', '石', '岩', '矿', '废墟', '龙骨', '平原', '浮空', '岛', '火山', '青铜'],
  weather: ['风', '光', '极光', '磁暴', '太阳', '恒星', '孢子风暴', '天气', '气象']
};

/**
 * 主入口：为镜头设计环境音效
 * @param {Object} shot - 镜头对象
 * @param {Object} options - 配置选项
 * @returns {string} - 【环境音效】字段内容（不含标记）
 */
function generateAmbientSoundField(shot, options = {}) {
  const mode = options.mode || 'generic';
  const maxChars = options.maxChars || 80;
  
  // 根据模式选择音效映射
  const soundMap = mode === 'nirath' ? NIRATH_SOUND_MAP : GENERIC_SOUND_MAP;
  
  // 提取场景描述
  const sceneDescription = shot.visualPrompt || shot.scene || '';
  
  // 分析场景
  const analysis = analyzeScene(sceneDescription);
  
  // 生成音效描述
  const soundDescription = generateSoundDescription(analysis, sceneDescription, maxChars, soundMap);
  
  return soundDescription;
}

/**
 * 分析场景描述，识别环境类型
 * @param {string} sceneDescription - 场景描述文本
 * @returns {Object} - 识别到的环境类型及其置信度
 */
function analyzeScene(sceneDescription) {
  if (!sceneDescription) return { primary: 'general', confidence: 0 };
  
  const scores = {};
  for (const [type, keywords] of Object.entries(SCENE_KEYWORDS)) {
    scores[type] = 0;
    for (const kw of keywords) {
      if (sceneDescription.includes(kw)) {
        scores[type] += 1;
      }
    }
  }
  
  // 找出最高分
  let maxScore = 0;
  let primary = 'general';
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primary = type;
    }
  }
  
  // 如果所有分数都是0，返回通用
  if (maxScore === 0) {
    return { primary: 'general', confidence: 0, secondary: null };
  }
  
  // 找出第二高分（辅助类型）
  let secondMax = 0;
  let secondary = null;
  for (const [type, score] of Object.entries(scores)) {
    if (type !== primary && score > secondMax) {
      secondMax = score;
      secondary = score > 0 ? type : null;
    }
  }
  
  return { primary, confidence: maxScore, secondary, secondaryConfidence: secondMax };
}

/**
 * 根据识别到的环境类型生成音效描述
 * @param {Object} sceneAnalysis - analyzeScene的返回结果
 * @param {string} sceneDescription - 原始场景描述（用于更精确匹配）
 * @param {number} maxChars - 最大字符数
 * @param {Object} soundMap - 音效映射表
 * @returns {string} - 环境音效描述
 */
function generateSoundDescription(sceneAnalysis, sceneDescription = '', maxChars = 80, soundMap = GENERIC_SOUND_MAP) {
  const { primary, secondary } = sceneAnalysis;
  const sounds = [];
  
  // 从主类型中选取2-3个音效
  const primarySounds = selectSoundsFromType(primary, sceneDescription, 2, soundMap);
  sounds.push(...primarySounds);
  
  // 如果有辅助类型，选取1个音效
  if (secondary) {
    const secondarySounds = selectSoundsFromType(secondary, sceneDescription, 1, soundMap);
    sounds.push(...secondarySounds);
  }
  
  // 去重并合并
  const uniqueSounds = [...new Set(sounds)];
  
  // 构建描述字符串
  let description = uniqueSounds.join('、');
  
  // 如果超出预算，智能压缩
  if (description.length > maxChars - 8) { // 预留8字符给标记
    // 保留最重要的2个
    description = uniqueSounds.slice(0, 2).join('、');
  }
  
  if (description.length > maxChars - 8) {
    description = uniqueSounds[0] || '环境氛围音';
  }
  
  return description;
}

/**
 * 从指定类型中选择音效
 * @param {string} type - 环境类型
 * @param {string} sceneDescription - 场景描述
 * @param {number} count - 选择数量
 * @param {Object} soundMap - 音效映射表
 * @returns {Array} - 音效数组
 */
function selectSoundsFromType(type, sceneDescription, count, soundMap = GENERIC_SOUND_MAP) {
  const typeMap = soundMap[type] || soundMap['terrain'];
  
  // 尝试精确匹配子类型
  let matchedSubType = null;
  for (const [subType, sounds] of Object.entries(typeMap)) {
    if (sceneDescription.includes(subType)) {
      matchedSubType = subType;
      break;
    }
  }
  
  // 如果找到精确匹配，使用该子类型
  if (matchedSubType && typeMap[matchedSubType]) {
    const sounds = typeMap[matchedSubType];
    return shuffleArray(sounds).slice(0, count);
  }
  
  // 否则，从该类型的所有音效中随机选取
  const allSounds = Object.values(typeMap).flat();
  return shuffleArray(allSounds).slice(0, count);
}

/**
 * 打乱数组（Fisher-Yates）
 * @param {Array} array - 需要打乱的数组
 * @returns {Array} - 打乱后的数组
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 批量生成环境音效
 * @param {Array} shots - 镜头数组
 * @param {Object} options - 配置选项
 * @returns {Array} - 音效描述数组
 */
function batchGenerateAmbientSounds(shots, options = {}) {
  return shots.map(shot => generateAmbientSoundField(shot, options));
}

// 导出
module.exports = {
  generateAmbientSoundField,
  batchGenerateAmbientSounds,
  analyzeScene,
  GENERIC_SOUND_MAP,
  NIRATH_SOUND_MAP
};
