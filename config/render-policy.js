'use strict';

module.exports = {
  defaultRatio: '16:9',
  defaultResolution: '720p',
  minDuration: 3,
  maxDuration: 15,
  maxConcurrent: 3,
  requirePortraitsInProduction: true,
  requireReferenceImages: true,
  
  // 【v6.6.3-fix】新增：PromptGuardian 自动修复配置
  promptGuardian: {
    enabled: true,           // 启用自动修复
    strictMode: false,       // 非严格模式（自动修复而非报错）
    logPath: './output/prompt-guardian-log.json'
  },
  
  // 【v6.6.3-fix】新增：PipelineGuard 强制检查配置
  pipelineGuard: {
    enabled: true,           // 启用强制检查
    strictMode: true         // 严格模式（不通过则阻止提交）
  },
  
  // 【v6.6.3-fix】新增：成本优化策略
  costOptimization: {
    previewResolution: '720p',      // 预览阶段使用720p
    finalResolution: '1080p',       // 定稿阶段使用1080p
    previewUseMini: true,           // 预览使用Seedance 2.0 mini
    shortClipDuration: 5,           // 短片段时长（单帧质量更高）
    longClipDuration: 12            // 长片段时长
  },
  
  // 【v6.6.3-fix】新增：多模态限制
  multimodalLimits: {
    maxImages: 9,    // 最多9张图片
    maxVideos: 3,     // 最多3段视频
    maxAudios: 3,     // 最多3段音频
    maxTotal: 12      // 总计最多12个参考素材
  }
};
