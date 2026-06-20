# CHANGELOG — 卓越系统

## v6.6.9.5 — 2026-06-20（最新）

### 核心升级：定妆照系统 + Seedance 2.0 行业专家报告整合

#### 新增：PromptGuardian 自动修复系统（来自超现实系统 v2.1.2）
- **文件**: `scripts/prompt-guardian.js`
- **功能**: 自动修复 Prompt 内容，不是报错而是自动修复
- **自动修复项**:
  1. ✅ 服装锁定：自动添加"穿警服的/穿护士服的/穿白大褂的"前缀
  2. ✅ 外观锚定：自动添加"佩戴警帽、警徽、肩章"等配饰描述
  3. ✅ 引用格式修正：@imageN → 图片N（符合官方规范）
  4. ✅ 台词净化：移除竖杠 | 替换为逗号
  5. ✅ 敏感词过滤：痛苦→不适、受伤→受影响、血汗→体液
  6. ✅ 声音描述检测：【音效】【环境音】【配乐】标记
  7. ✅ 多镜头时间戳检测：[00:00-00:04] 分镜格式
  8. ✅ 负向提示词检测：【负向】标记
  9. ✅ 种子值检查：批量生成时建议锁定 seed
- **集成位置**: `systems/render-request-builder.js` 的 `buildRenderContent()`

#### 新增：RenderPipelineGuard 强制检查系统（来自超现实系统 v2.1.2）
- **文件**: `scripts/render-pipeline-guard.js`
- **功能**: 13 项强制检查，不通过则阻止提交
- **强制检查清单**:
  1. ✅ REF_IMAGE_ROLE — image_url 必须指定 role: "reference_image"
  2. ✅ GENERATE_AUDIO — 有台词时必须 generate_audio: true
  3. ✅ REF_IMAGE_COUNT — 建议至少 3-5 张定妆照
  4. ✅ COSTUME_LOCK — Prompt 必须明确锁定服装
  5. ✅ APPEARANCE_ANCHOR — 建议描述标志性配饰
  6. ✅ DIALOGUE_FORMAT — 台词不能含竖杠 |
  7. ✅ SENSITIVE_WORDS — 不能含痛苦/受伤/死亡等词
  8. ✅ REFERENCE_FORMAT — 不能用 @imageN，必须用 图片N
  9. ✅ PROMPT_LENGTH — Prompt 不能超过 1500 字符
  10. ✅ IMAGE_FILE_VALID — 图片 base64 数据必须有效
  11. ✅ MULTIMODAL_LIMIT — 参考素材总计 ≤12 个（图片≤9，视频≤3，音频≤3）
  12. ✅ RESOLUTION_OPT — 预览阶段提示使用 720p/mini 降低成本
  13. ✅ NEGATIVE_PROMPT — 提示使用【负向】标记排除不想要的元素
- **集成位置**: `systems/render-submitter.js` 的 `submitShot()`

#### 修改：render-request-builder.js
- 【v6.6.3-fix】MIME 类型检测：通过文件头（0xFFD8=JPEG, 0x8950=PNG）而非扩展名
- 集成 PromptGuardian 自动修复到 buildRenderContent()
- 自动检测台词并设置 generate_audio: true
- 添加 isPreview 标记支持成本优化检查

#### 修改：render-submitter.js
- 集成 PipelineGuard 强制检查
- 检查不通过 → throw ValidationError 阻止提交
- 检查通过但警告 → 继续提交并输出警告日志

#### 修改：render-policy.js
- 新增 promptGuardian 配置（enabled, strictMode, logPath）
- 新增 pipelineGuard 配置（enabled, strictMode）
- 新增 costOptimization 配置（previewResolution, finalResolution, previewUseMini）
- 新增 multimodalLimits 配置（maxImages, maxVideos, maxAudios, maxTotal）

#### 经验来源
- 横纹肌溶解科普 EP02 调试经验（超现实系统 v2.1.2）
- 行业专业人士经验包
- 外部专家深度报告（Seedance 2.0 API 视频渲染最佳实践）

---

## v6.6.9.4-patch21 — 2026-06-18

### 修复
- 呼吸性碱中毒 v6.6.1 运行脚本
- 健康科普 EP01 预生产脚本（v6.6.7, v6.6.8）
- LLM 响应问题修复（空内容、JSON 提取失败）

### 系统
- 定妆照强制绑定闸机（v6.0-patch22）
- 一镜到底强制检查（v5.0-patch5）
- 故事板审核（角色/时长/字数）

---
