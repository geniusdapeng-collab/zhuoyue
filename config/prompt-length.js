// 统一 Prompt 长度配置（唯一真源）
// 目标：总长度稳定落在 889-988 字符区间

module.exports = {
  TARGET_MIN: 889,
  TARGET_MAX: 988,
  HARD_MAX: 988,

  // 保留兼容字段，但不再依赖固定模板长度
  SYSTEM_TEMPLATE_LEN: 0,

  getCreativeTarget(systemTemplateLen = 0) {
    return {
      min: Math.max(0, this.TARGET_MIN - systemTemplateLen),
      max: Math.max(0, this.TARGET_MAX - systemTemplateLen)
    };
  },

  validate(length) {
    return length >= this.TARGET_MIN && length <= this.TARGET_MAX;
  },

  getStatus(length) {
    if (length > this.HARD_MAX) return 'overflow';
    if (length < this.TARGET_MIN) return 'underflow';
    if (length <= this.TARGET_MAX) return 'ideal';
    return 'unknown';
  }
};
