const fs = require('fs');
const path = require('path');

// ===== 通用片头系统 v3.2 — 彻底去Nirath化 =====
// v6.6.9.4-patch9: 移除所有Nirath/山海经依赖，成为唯一片头系统

// ===== Generic 片头生成器 =====
function generateGenericOpening(config) {
  const {
    episodeTitle = '未命名视频',
    seriesTitle = '',
    duration = 9,
    mood = 'professional',
    characters = {},
    portraits = {}
  } = config;

  // 提取主讲人/角色
  const charIds = Object.keys(characters);
  const presenterId = charIds.length > 0 ? charIds[0] : 'presenter';
  const presenter = characters[presenterId] || { name: '主讲人' };
  const presenterName = presenter.name || presenterId;

  // 生成标题文案
  const mainTitle = episodeTitle;
  const subTitle = seriesTitle || '';

  // 构建定妆照引用
  let portraitPaths = [];
  let portraitRef = '';
  
  // 从portraits中提取主讲人的定妆照路径
  const presenterPortraits = portraits[presenterId] || portraits[presenterName] || [];
  if (presenterPortraits && presenterPortraits.length > 0) {
    portraitPaths = presenterPortraits.slice(0, 4); // 最多4张
    portraitRef = ' @image1'; // Seedance 2.0 角色引用格式
  }

  // 三幕结构：钩子→展开→定格
  const act1End = duration * 0.25;
  const act2End = duration * 0.75;
  const act3End = duration;

  const act1 = {
    phase: '钩子',
    timeRange: `0-${act1End.toFixed(1)}s`,
    content: `画面从柔和渐变中亮起，展现明亮整洁的健康科普演播室或医疗教育环境，柔和自然光从侧方洒入，画面干净真实，专业医疗质感。`,
    cameraPlan: [{ time: `0-${act1End.toFixed(1)}s`, movement: 'fade_in from soft gradient to bright studio' }]
  };

  const act2 = {
    phase: '展开',
    timeRange: `${act1End.toFixed(1)}-${act2End.toFixed(1)}s`,
    content: `主讲人${presenterName}身穿专业医护工作服，位于画面中央偏左位置，姿态端正自然，面向镜头。画面采用中近景构图，背景为干净明亮的医疗科普环境，可见健康宣传海报或人体示意图，柔和专业布光，肤色真实细腻。`,
    cameraPlan: [{ time: `${act1End.toFixed(1)}-${act2End.toFixed(1)}s`, movement: 'slow_push_in to medium close-up' }]
  };

  const act3 = {
    phase: '定格',
    timeRange: `${act2End.toFixed(1)}-${act3End.toFixed(1)}s`,
    content: `画面定格，主讲人微笑自然，双手自然交叠或轻做手势。画面右侧或底部浮现标题：主标题【${mainTitle}】${subTitle ? '，副标题：' + subTitle : ''}，整体呈现权威、可信、温暖的医学科普开场质感。`,
    cameraPlan: [{ time: `${act2End.toFixed(1)}-${act3End.toFixed(1)}s`, movement: 'hold on title card' }]
  };

  // v6.6.9.4-patch14: 片头18个标准字段(内容15个 + 【氛围】【出品人】【标题动效】)
  const fullPrompt = `16:9宽屏电影级镜头。 【视觉】超写实纪录片风格，${presenterName}${portraitRef}，身穿专业医护工作服，亲切温和，专业可信，面向镜头，自然微笑，位于画面中央偏左位置，中近景构图。 | 【动态】${act1.content} ${act2.content} ${act3.content} | 【空间】明亮整洁的健康科普演播室/医疗教育环境，柔和自然光从侧方洒入，干净真实，可见健康宣传海报或人体示意图。 | 【情绪】宁静,建立感,权威,可信,温暖。 | 【纵深】景深自然，主讲人清晰，背景适度虚化，层次清晰。 | 【方位】平视角度，构图平衡，主讲人位于画面中央偏左。 | 【风格】color palette: natural earth tones + daylight highlights + medical white accents, professional documentary aesthetic。 | 【氛围】专业医疗环境氛围，明亮整洁，亲切可信。 | 【镜头时间轴】0-${act1End.toFixed(1)}s: fade_in from soft gradient to bright studio; ${act1End.toFixed(1)}-${act2End.toFixed(1)}s: slow_push_in to medium close-up; ${act2End.toFixed(1)}-${act3End.toFixed(1)}s: hold on title card。 | 【照明】柔和专业布光，自然光或柔和室内照明，色温4500K，肤色真实细腻，明暗层次清晰，禁止暗黑/灰暗。 | 【负面约束】blurry, low resolution, cartoon, anime, 3D render, CGI, plastic look, overexposed, crushed blacks, distorted face, extra fingers, waxy skin, no text, no subtitle, no caption, no watermark。 | 【环境音效】环境音自然，专业医疗环境氛围声。 | 【渲染】hyperrealistic cinematic quality, 35mm film grain, HDR, photorealistic with filmic treatment, 16:9 cinematic, 24fps cinematic。 | 【导演】权威、可信、温暖的医学科普开场质感。 | 【出品人】Genius。 | 【标题动效】主标题【${mainTitle}】${subTitle ? '，副标题：' + subTitle : ''}，标题浮现于画面右侧或底部，字体优雅专业。 | 【台词】系列片头。 | 【人物介绍卡片】${presenterName}：专业医护工作者，健康科普讲解员，形象亲切温和。`;

  return {
    duration,
    acts: { act1, act2, act3 },
    prompt: fullPrompt,
    promptLength: fullPrompt.length,
    characters: { protagonist: presenter, beast: null },
    portraits,
    portraitPaths,
    cameraPlan: [act1.cameraPlan, act2.cameraPlan, act3.cameraPlan],
    complianceCheck: { allChecksPass: true },
    truncationApplied: false
  };
}

// ===== 主入口：生成片头 =====
function generateOpeningV3(config) {
  // v6.6.9.4-patch9: 只支持Generic模式，Nirath模式已移走
  console.log('🎬 [opening-system-v3] Generic模式：生成专业片头');
  return generateGenericOpening(config);
}

// ===== 预生产检查 =====
function preProductionCheck(config) {
  return {
    canProceed: true,
    issues: [],
    portraits: {}
  };
}

// ===== 角色卡片加载（通用 stub） =====
function loadCharacterCard(characterId) {
  return null;
}

// ===== 定妆照路径加载（通用 stub） =====
function loadPortraitPath(characterId, angle) {
  return null;
}

// ===== 角色描述生成（通用 stub） =====
function generateCharacterDescription(characterId, options = {}) {
  return '';
}

module.exports = {
  generateOpeningV3,
  preProductionCheck,
  generateGenericOpening,
  loadCharacterCard,
  loadPortraitPath,
  generateCharacterDescription
};
