'use strict';

const fs = require('fs');
const path = require('path');

const PROMPT_LENGTH = require('../config/prompt-length');

const CHARACTER_ID_ALIASES = {
  'chenzhuo': 'chen-zhuo',
  'chen-zhuo': 'chen-zhuo',
  'chen-nurse': 'chen-nurse',
  'chennurse': 'chen-nurse',
  'xiangxiang': 'xiangXiang',
  'xiaog': 'xiaoG',
  'taotie': 'tao-tie',
  'tao-tie': 'tao-tie',
  'taotie-beast': 'tao-tie',
  'presenter': 'chen-zhuo',
  'host': 'chen-zhuo'
};

function normalizeCharacterId(input) {
  if (!input) return '';
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  return CHARACTER_ID_ALIASES[lower] || raw;
}

function safeTrimStructuredPrompt(prompt, maxLength = PROMPT_LENGTH.HARD_MAX) {
  if (!prompt || prompt.length <= maxLength) return prompt || '';

  let trimmed = String(prompt).slice(0, maxLength);

  const lastOpen = trimmed.lastIndexOf('【');
  const lastClose = trimmed.lastIndexOf('】');

  if (lastOpen > lastClose) {
    trimmed = trimmed.slice(0, lastOpen);
  }

  trimmed = trimmed.replace(/\s*\|\s*$/, '').trim();
  return trimmed;
}

function extractPortraitMapFromCharacterStage(characterEntry, characterId = '') {
  if (!characterEntry) return {};

  const portraitMap = {};

  const tryAdd = (angle, value) => {
    if (!angle || !value) return;
    if (typeof value !== 'string') return;
    portraitMap[angle] = value;
  };

  if (characterEntry.portraits && typeof characterEntry.portraits === 'object' && !Array.isArray(characterEntry.portraits)) {
    for (const [angle, p] of Object.entries(characterEntry.portraits)) {
      tryAdd(angle, p);
    }
  }

  const profile = characterEntry.profile || characterEntry;
  const generated = profile?.generatedAssets?.portraits || [];
  if (Array.isArray(generated)) {
    for (const item of generated) {
      if (typeof item === 'string') {
        const m = item.match(/([a-zA-Z0-9_-]+)-(front|threeQuarter|closeup|side|back|action|detail)\.(png|jpg|jpeg|webp)$/i);
        if (m) tryAdd(m[2], item);
      } else if (item && typeof item === 'object') {
        tryAdd(item.angle, item.localPath || item.path || item.filepath || item.url);
      }
    }
  }

  const portraitPaths = profile?.v2Metadata?.portraitPaths || [];
  if (Array.isArray(portraitPaths)) {
    for (const item of portraitPaths) {
      if (typeof item !== 'string') continue;
      const m = item.match(/([a-zA-Z0-9_-]+)-(front|threeQuarter|closeup|side|back|action|detail)\.(png|jpg|jpeg|webp)$/i);
      if (m) tryAdd(m[2], item);
    }
  }

  if (Object.keys(portraitMap).length === 0 && characterId) {
    const normalizedId = normalizeCharacterId(characterId);
    const portraitDir = path.join(process.cwd(), 'characters', normalizedId, 'portraits');
    const candidates = {
      front: [
        `${normalizedId}-cg-v3-front.png`,
        `${normalizedId}-front.png`,
        `${normalizedId}-portrait-front.png`
      ],
      threeQuarter: [
        `${normalizedId}-cg-v3-threeQuarter.png`,
        `${normalizedId}-threeQuarter.png`,
        `${normalizedId}-portrait-threeQuarter.png`
      ],
      closeup: [
        `${normalizedId}-cg-v3-closeup.png`,
        `${normalizedId}-closeup.png`,
        `${normalizedId}-portrait-closeup.png`
      ],
      side: [
        `${normalizedId}-cg-v3-side.png`,
        `${normalizedId}-side.png`,
        `${normalizedId}-portrait-side.png`
      ]
    };

    for (const [angle, files] of Object.entries(candidates)) {
      for (const file of files) {
        const full = path.join(portraitDir, file);
        if (fs.existsSync(full)) {
          portraitMap[angle] = full;
          break;
        }
      }
    }
  }

  return portraitMap;
}

function buildReferenceImagesForShot(shot, stages = {}) {
  const refs = [];
  const charStageMap = stages.characters || {};
  const rawIds = [
    ...(Array.isArray(shot?.characters) ? shot.characters : []),
    ...(Array.isArray(shot?.characterIds) ? shot.characterIds : []),
    shot?.characterId
  ].filter(Boolean);

  const ids = [...new Set(rawIds.map(normalizeCharacterId))];

  const preferredAngles = shot?.type === 'opening'
    ? ['front', 'threeQuarter']
    : shot?.shotType === 'closeup'
      ? ['closeup', 'threeQuarter']
      : ['threeQuarter', 'front'];

  for (const charId of ids) {
    const entry =
      charStageMap[charId] ||
      charStageMap[normalizeCharacterId(charId)] ||
      null;

    const portraits = extractPortraitMapFromCharacterStage(entry, charId);
    for (const angle of preferredAngles) {
      const p = portraits[angle];
      if (p) {
        refs.push({
          type: 'image_url',
          image_url: { url: p },
          role: 'reference_image',
          character: charId,
          angle
        });
        break;
      }
    }
  }

  return refs;
}

function buildCharacterCardText(shot, stages = {}) {
  const charStageMap = stages.characters || {};
  const ids = [...new Set((shot?.characters || []).map(normalizeCharacterId))];
  const rows = [];

  for (const charId of ids) {
    const entry = charStageMap[charId] || null;
    const portraits = extractPortraitMapFromCharacterStage(entry, charId);
    const name =
      entry?.profile?.baseIdentity?.name ||
      entry?.profile?.name ||
      entry?.name ||
      charId;

    const list = Object.values(portraits).slice(0, 4);
    rows.push(`${name}: ${list.length ? list.join(', ') : '无定妆照'}`);
  }

  return rows.join(' | ');
}

module.exports = {
  normalizeCharacterId,
  safeTrimStructuredPrompt,
  extractPortraitMapFromCharacterStage,
  buildReferenceImagesForShot,
  buildCharacterCardText
};
