'use strict';

function asString(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function getSceneName(scene, fallback = 'default') {
  if (!scene) return fallback;
  if (typeof scene === 'string') return scene;
  if (typeof scene === 'object') {
    return scene.name || scene.scene || scene.label || scene.title || fallback;
  }
  return fallback;
}

function getSceneDisplayText(scene, fallback = 'default') {
  if (!scene) return fallback;
  if (typeof scene === 'string') return scene;
  if (typeof scene === 'object') {
    return [
      scene.name || scene.scene || scene.label || '',
      scene.description || '',
      scene.atmosphere || ''
    ].filter(Boolean).join(' | ') || fallback;
  }
  return fallback;
}

function normalizeCharacterEntry(char) {
  if (!char) return null;

  if (char.profile || char.prompt || char.portraits) {
    const profile = char.profile || {};
    return {
      id: char.id || profile.id || profile.characterId || '',
      name:
        profile?.baseIdentity?.name ||
        profile?.name ||
        char.name ||
        '',
      profile,
      prompt: char.prompt || '',
      portraits: char.portraits || profile.generatedAssets?.portraits || [],
      raw: char
    };
  }

  return {
    id: char.id || char.characterId || '',
    name: char?.baseIdentity?.name || char?.name || '',
    profile: char,
    prompt: char.prompt || '',
    portraits: char.portraits || char.generatedAssets?.portraits || [],
    raw: char
  };
}

function getCharacterName(char, fallback = '') {
  const normalized = normalizeCharacterEntry(char);
  return normalized?.name || fallback;
}

function getCharacterProfile(char) {
  return normalizeCharacterEntry(char)?.profile || null;
}

function getCharacterPortraits(char) {
  return normalizeCharacterEntry(char)?.portraits || [];
}

function getPromptText(obj) {
  if (!obj || typeof obj !== 'object') return asString(obj, '');
  return (
    asString(obj.prompt) ||
    asString(obj.render_prompt) ||
    asString(obj.renderPrompt) ||
    asString(obj.visualPrompt) ||
    asString(obj.text) ||
    asString(obj.content) ||
    ''
  );
}

function normalizeReferenceImages(shot = {}) {
  const directRefs = Array.isArray(shot.referenceImages) ? shot.referenceImages : [];
  const contentRefs = Array.isArray(shot.content)
    ? shot.content.filter(item => item && (item.role === 'reference_image' || item.type === 'image_url'))
    : [];

  const merged = [...directRefs, ...contentRefs];
  const seen = new Set();

  return merged.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  asString,
  getSceneName,
  getSceneDisplayText,
  normalizeCharacterEntry,
  getCharacterName,
  getCharacterProfile,
  getCharacterPortraits,
  getPromptText,
  normalizeReferenceImages
};
