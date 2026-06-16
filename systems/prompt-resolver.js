'use strict';

function resolvePromptText(shot) {
  if (!shot || typeof shot !== 'object') return '';

  const candidates = [
    shot.render_prompt,
    shot.renderPrompt,
    shot.prompt,
    shot.visualPrompt,
    shot.finalPrompt
  ];

  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim();
    }
  }

  return '';
}

function resolveNarrationText(shot) {
  if (!shot || typeof shot !== 'object') return '';
  const candidates = [
    shot.narration,
    shot.dialogue,
    shot.line
  ];

  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim();
    }
  }

  return '';
}

module.exports = {
  resolvePromptText,
  resolveNarrationText
};
