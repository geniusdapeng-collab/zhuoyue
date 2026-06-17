'use strict';

function toReferenceImage(url, character = '', angle = '') {
  return {
    type: 'image_url',
    image_url: { url },
    role: 'reference_image',
    character,
    angle
  };
}

function normalizePortraitMapToReferenceImages(charId, portraits) {
  const result = [];
  if (!portraits) return result;

  if (Array.isArray(portraits)) {
    for (const p of portraits) {
      if (!p) continue;
      if (typeof p === 'string') {
        result.push(toReferenceImage(p, charId, 'unknown'));
      } else if (p.localPath || p.path || p.url) {
        result.push(toReferenceImage(p.localPath || p.path || p.url, charId, p.angle || 'unknown'));
      }
    }
    return result;
  }

  if (typeof portraits === 'object') {
    for (const [angle, value] of Object.entries(portraits)) {
      if (!value) continue;
      result.push(toReferenceImage(value, charId, angle));
    }
  }

  return result;
}

function mergeReferenceImages(...groups) {
  const all = groups.flat().filter(Boolean);
  const seen = new Set();
  return all.filter(item => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  toReferenceImage,
  normalizePortraitMapToReferenceImages,
  mergeReferenceImages
};
