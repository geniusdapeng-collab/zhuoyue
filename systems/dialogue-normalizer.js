'use strict';

function normalizeDialogueScene(scene = {}) {
  const dialogue = (
    scene.dialogue ||
    scene.line ||
    scene.speech ||
    scene.narration ||
    ''
  );

  return {
    ...scene,
    dialogue: typeof dialogue === 'string' ? dialogue.trim() : '',
    _legacyNarration: typeof scene.narration === 'string' ? scene.narration : '',
    narration: ''
  };
}

function normalizeDialogueShots(shots = []) {
  if (!Array.isArray(shots)) return [];
  return shots.map(normalizeDialogueScene);
}

module.exports = {
  normalizeDialogueScene,
  normalizeDialogueShots
};
