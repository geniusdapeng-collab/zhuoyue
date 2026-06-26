/**
 * timeout-config.js - 全局超时配置
 * v6.8.8-fix: 集中管理所有超时值，消除硬编码分散问题
 * 
 * 使用方式:
 *   const { TIMEOUTS } = require('../config/timeout-config');
 *   const timeout = TIMEOUTS.LLM.SCRIPT_GENERATOR;
 */

const TIMEOUTS = {
  // LLM 调用超时（毫秒）
  LLM: {
    // 快速调用（简单查询、检查）
    FAST: 120000,      // 2分钟
    
    // 标准调用（一般生成任务）
    STANDARD: 180000,  // 3分钟
    
    // 慢速调用（复杂生成、结构化输出）
    SLOW: 300000,      // 5分钟
    
    // 具体Agent超时映射
    SCRIPT_GENERATOR: 180000,
    BASE_AGENT: 300000,
    CONTINUITY_REVIEW: 120000,
    PROMPT_FUSION: 300000,
    CROSS_EPISODE_VALIDATOR: 120000,
    FIELD_CHECKER: 120000,
    FIELD_REPAIRER: 180000,
    OPENING_DESIGN: 120000,
    VISUAL_LANGUAGE: 300000,
  },

  // 全局预算控制
  BUDGET: {
    // 总链路预算（毫秒）
    TOTAL: 1800000,     // 30分钟
    
    // 安全余量
    SAFETY_MARGIN: 60000, // 1分钟
    
    // 各Phase预算
    PHASE1: 300000,     // 5分钟
    PHASE2: 600000,     // 10分钟
    PHASE3_PER_SHOT: 180000, // 每镜头3分钟
    PHASE3_5: 300000,   // 5分钟
  },

  // 并行阶段超时
  PARALLEL: {
    DEFAULT: 300000,    // 5分钟
    VISUAL_LANGUAGE: 300000,
    FIELD_QUALITY: 300000,
  },

  // 外部确认等待
  CONFIRMATION: {
    MAX_WAIT: 30 * 60 * 1000, // 30分钟
    CHECK_INTERVAL: 3000,      // 3秒
  },

  // 降级阈值（预算低于此值时触发降级）
  DEGRADE: {
    CRITICAL: 60000,   // 1分钟：强制降级
    WARNING: 300000,   // 5分钟：预警
  }
};

// 环境变量覆盖（允许通过环境变量动态调整）
function getTimeout(key, subKey, defaultValue) {
  const envKey = `ZHUOYUE_TIMEOUT_${key}_${subKey}`;
  const envValue = process.env[envKey];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue !== undefined ? defaultValue : TIMEOUTS[key]?.[subKey];
}

module.exports = { TIMEOUTS, getTimeout };
