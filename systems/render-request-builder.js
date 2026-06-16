'use strict';

const fs = require('fs');
const path = require('path');
const { resolvePromptText } = require('./prompt-resolver');
const renderPolicy = require('../config/render-policy');
const { ValidationError } = require('./errors');

function imageFileToDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const buffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function buildRenderContent({ promptText, referenceImages = [] }) {
  const content = [];

  content.push({
    type: 'text',
    text: promptText
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

  return content;
}

function buildRenderPayload({
  model,
  shot,
  referenceImages = [],
  ratio = renderPolicy.defaultRatio,
  resolution = renderPolicy.defaultResolution
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

  const content = buildRenderContent({
    promptText,
    referenceImages
  });

  return {
    model,
    content,
    ratio,
    duration,
    resolution
  };
}

module.exports = {
  buildRenderPayload,
  imageFileToDataUrl
};
