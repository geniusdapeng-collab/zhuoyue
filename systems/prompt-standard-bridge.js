'use strict';

function pickFirst(...values) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function extractByRegex(text, regex) {
  const m = String(text || '').match(regex);
  return m ? m[1].trim() : '';
}

function buildStandardPromptFromShot(shot = {}) {
  const rawPrompt = pickFirst(
    shot.prompt,
    shot.render_prompt,
    shot.renderPrompt,
    shot.visualPrompt
  );

  const visual = pickFirst(
    extractByRegex(rawPrompt, /【视觉】([^【]*)/),
    shot.visualPrompt,
    shot.character,
    '主体画面清晰，角色与动作明确'
  );

  const action = pickFirst(
    extractByRegex(rawPrompt, /【动作】([^【]*)/),
    extractByRegex(rawPrompt, /【动态】([^【]*)/),
    shot.action,
    shot.mouthAction,
    '自然动作'
  );

  const scene = pickFirst(
    extractByRegex(rawPrompt, /【环境布景】([^【]*)/),
    extractByRegex(rawPrompt, /【空间】([^【]*)/),
    typeof shot.scene === 'string' ? shot.scene : (shot.scene?.name || ''),
    '场景环境明确'
  );

  const mood = pickFirst(
    extractByRegex(rawPrompt, /【情绪】([^【]*)/),
    shot.mood,
    shot.emotionPhase,
    '自然情绪'
  );

  const camera = pickFirst(
    extractByRegex(rawPrompt, /【运镜】([^【]*)/),
    extractByRegex(rawPrompt, /【镜头时间轴】([^【]*)/),
    shot.cameraString,
    shot.camera?.description,
    shot.cameraMovement?.description,
    '中景稳定运镜'
  );

  const timeline = pickFirst(
    extractByRegex(rawPrompt, /【镜头时间轴】([^【]*)/),
    shot.timelineString,
    typeof shot.timeline === 'string' ? shot.timeline : '',
    '0-100% 平稳推进'
  );

  const lighting = pickFirst(
    extractByRegex(rawPrompt, /【照明】([^【]*)/),
    extractByRegex(rawPrompt, /【照明方案】([^【]*)/),
    shot.lightingString,
    typeof shot.lighting === 'string' ? shot.lighting : '',
    '自然光照，明暗层次清晰'
  );

  const negative = pickFirst(
    extractByRegex(rawPrompt, /【负面约束】([^【]*)/),
    extractByRegex(rawPrompt, /【全局负面约束】([^【]*)/),
    shot.negativePrompt,
    'no text, no watermark, no subtitle, no extra fingers'
  );

  const audio = pickFirst(
    extractByRegex(rawPrompt, /【环境音效】([^【]*)/),
    extractByRegex(rawPrompt, /【音频】([^【]*)/),
    shot.backgroundSoundString,
    shot.audioLayerString,
    '环境音自然，声画同步'
  );

  const render = pickFirst(
    extractByRegex(rawPrompt, /【技术规格】([^【]*)/),
    extractByRegex(rawPrompt, /【渲染】([^【]*)/),
    shot.renderStyle,
    'hyperrealistic cinematic quality, 35mm film grain, HDR'
  );

  const director = pickFirst(
    extractByRegex(rawPrompt, /【导演】([^【]*)/),
    shot.directorStyle,
    '通用导演风格'
  );

  const portrait = pickFirst(
    extractByRegex(rawPrompt, /【定妆照】([^【]*)/),
    shot.characterRef,
    ''
  );

  const parts = [
    portrait ? `【定妆照】${portrait}` : '',
    `【视觉】${visual}`,
    `【动作】${action}`,
    `【环境布景】${scene}`,
    `【情绪】${mood}`,
    `【运镜】${camera}`,
    `【镜头时间轴】${timeline}`,
    `【照明】${lighting}`,
    `【负面约束】${negative}`,
    `【环境音效】${audio}`,
    `【技术规格】${render}`,
    `【导演】${director}`
  ].filter(Boolean);

  if (shot.dialogue && String(shot.dialogue).trim()) {
    parts.push(`【台词】${String(shot.dialogue).trim()}`);
  }

  return parts.join('; ');
}

module.exports = {
  buildStandardPromptFromShot
};
