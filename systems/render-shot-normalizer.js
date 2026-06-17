'use strict';

const {
  getSceneName,
  getSceneDisplayText,
  getPromptText
} = require('./pipeline-safe-accessors');

function normalizeRenderShot(shot = {}) {
  return {
    ...shot,
    id: shot.id || shot.shotId || 'unknown',
    shotId: shot.shotId || shot.id || 'unknown',
    scene: shot.scene,
    sceneName: getSceneName(shot.scene, 'default'),
    sceneText: getSceneDisplayText(shot.scene, 'default'),
    prompt: getPromptText(shot),
    visualPrompt: shot.visualPrompt || getPromptText(shot),
    dialogue: typeof shot.dialogue === 'string' ? shot.dialogue : '',
    duration: Number(shot.duration || 5),
    characters: Array.isArray(shot.characters) ? shot.characters : [],
    type: shot.type || 'generic',
    emotionPhase: shot.emotionPhase || 'neutral'
  };
}

function normalizeRenderShots(shots = []) {
  if (!Array.isArray(shots)) return [];
  return shots.map(normalizeRenderShot);
}

module.exports = {
  normalizeRenderShot,
  normalizeRenderShots
};
