'use strict';

function safeStructuredTrim(text, maxLength) {
  if (!text || text.length <= maxLength) return text;

  let trimmed = text.slice(0, maxLength);

  // 防止截断未闭合块
  const lastOpen = trimmed.lastIndexOf('【');
  const lastClose = trimmed.lastIndexOf('】');
  if (lastOpen > lastClose) {
    trimmed = trimmed.slice(0, lastOpen);
  }

  // 优先在合适边界截断
  const candidates = [' | ', '。', '，', ',', ';', '；', ' '];
  let best = -1;
  let bestLen = 0;
  for (const sep of candidates) {
    const idx = trimmed.lastIndexOf(sep);
    if (idx > best) {
      best = idx;
      bestLen = sep.length;
    }
  }

  if (best > maxLength * 0.7) {
    trimmed = trimmed.slice(0, best + bestLen);
  }

  return trimmed.trim();
}

module.exports = {
  safeStructuredTrim
};
