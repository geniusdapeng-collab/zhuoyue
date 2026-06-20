'use strict';

const fs = require('fs');
const path = require('path');
const { resolvePromptText } = require('./prompt-resolver');
const renderPolicy = require('../config/render-policy');
const { ValidationError } = require('./errors');
const { PromptGuardian } = require('../scripts/prompt-guardian');

/**
 * 【v6.6.3-fix】MIME类型检测：通过文件头而非扩展名
 * 解决伪装扩展名导致API无法解析的问题
 */
function detectMimeType(filePath) {
  const header = fs.readFileSync(filePath).slice(0, 12);
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E) return 'image/png';
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
    if (header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) return 'image/webp';
  }
  // Fallback to extension
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  return ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
}

function imageFileToDataUrl(filePath) {
  const mime = detectMimeType(filePath);
  const buffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function buildRenderContent({ promptText, referenceImages = [], characters = [] }) {
  // 🛡️ 【v6.6.3-fix】PromptGuardian 自动修复
  const guardian = new PromptGuardian();
  const charInfos = characters.map(char => ({
    id: char.id || char,
    name: char.name || char.id || char,
    role: char.role || '',
    description: char.description || ''
  }));
  
  const fixResult = guardian.autoFix(promptText, charInfos);
  if (fixResult.changed) {
    console.log(`  🛡️ PromptGuardian: 自动修复 ${fixResult.fixes.length} 处`);
    for (const fix of fixResult.fixes) {
      console.log(`     ${fix.type}: ${fix.action}`);
    }
  }
  
  const fixedPrompt = fixResult.prompt;

  const content = [];

  content.push({
    type: 'text',
    text: fixedPrompt
  });

  for (const image of referenceImages) {
    content.push({
      type: 'image_url',
      role: 'reference_image',
      image_url: {
        url: image.dataUrl
      },
      metadata: {
        angle: image.angle,
        roleId: image.roleId
      }
    });
  }

  return { content, fixedPrompt };
}

function buildRenderPayload({
  model,
  shot,
  referenceImages = [],
  characters = [],
  ratio = renderPolicy.defaultRatio,
  resolution = renderPolicy.defaultResolution,
  isPreview = false
}) {
  const promptText = resolvePromptText(shot);

  if (!promptText) {
    throw new ValidationError('镜头缺少可用Prompt', {
      details: { shotId: shot.id || shot.shotId }
    });
  }

  const duration = Number(shot.duration || renderPolicy.minDuration);
  if (duration < renderPolicy.minDuration || duration > renderPolicy.maxDuration) {
    throw new ValidationError(`镜头时长不合法: ${duration}`, {
      details: {
        min: renderPolicy.minDuration,
        max: renderPolicy.maxDuration,
        shotId: shot.id || shot.shotId
      }
    });
  }

  const { content, fixedPrompt } = buildRenderContent({
    promptText,
    referenceImages,
    characters
  });

  // 🎙️ 【v6.6.3-fix】检测台词，自动设置 generate_audio
  const hasDialogue = /【台词】/.test(fixedPrompt);
  const generate_audio = hasDialogue ? true : undefined;
  
  if (hasDialogue) {
    console.log(`  🎙️ 检测到台词，自动设置 generate_audio: true`);
  }

  const payload = {
    model,
    content,
    ratio,
    duration,
    resolution
  };
  
  if (generate_audio) {
    payload.generate_audio = generate_audio;
  }
  
  if (isPreview) {
    payload._isPreview = true;
  }

  return payload;
}

module.exports = {
  buildRenderPayload,
  buildRenderContent,
  imageFileToDataUrl,
  detectMimeType
};
