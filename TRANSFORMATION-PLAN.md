# 卓越系统 v6.37 全链路改造计划

## 当前状态分析

### 卓越系统链路（16个Stage）

| Stage | 名称 | 输出 | 包含字段 |
|-------|------|------|----------|
| STAGE-1 | PRD生成 | prd | title, world, core, style, requirements |
| STAGE-2 | 需求对齐 | alignment | passed, issues |
| STAGE-3 | Schema验证 | schema | passed, errors |
| STAGE-4 | 角色系统 | characters | {charId: {profile, portraits, prompts}} |
| STAGE-5 | 剧本生成 | script | scenes[], narrative, world, requirements |
| STAGE-5.5 | FPV决策 | fpvDecision | enabled, cameraStyle, narration |
| STAGE-6 | 时长分配 | duration | shotDurations[], totalDuration, rationale |
| STAGE-7 | 故事板 | storyboard | shots[] (包含 scene, narration, characters, type等) |
| STAGE-7.2 | 主角主动性 | protagonistInitiative | totalInjections, passiveDetections |
| STAGE-7.3 | 台词修剪 | narrationTrim | trimmedCount, totalTrimmedChars |
| STAGE-7.4 | 时长-台词对齐 | durationAlignment | aligned, report |
| STAGE-7.5 | 片头生成 | opening | shot (S00) |
| STAGE-8 | 故事板验证 | storyboardValidation | passed, errors |
| STAGE-8.5 | 五元素检查 | fiveElement | enabled, passed, elements |
| STAGE-9 | 运镜设计 | camera | cameraMovements[] (每个镜头有movement, description, timeline) |
| STAGE-10 | 连续性检查 | continuity | passed, transitions, issues |
| STAGE-10.5 | 安全门 | safetyGate | passed, errors |
| STAGE-11 | 渲染/Prompt生成 | render | prompts[] (当前已扩展v6.37字段) |
| STAGE-11.5 | Prompt质量门 | promptQualityGate | passed, report, scores |
| STAGE-12 | 合规检查 | compliance | passed, errors |
| STAGE-13 | 预渲染验证 | preRender | passed, errors |
| STAGE-14 | 风格注入 | style | 修改后的prompts[] |
| STAGE-15 | 后期制作 | postProduction | titleBurned, outputPath |
| STAGE-16 | 最终输出 | output | {prd, characters, script, storyboard, cameraMovements, prompts, postProduction, validation} |

### 字段生成环节分析

| v6.37字段 | 当前生成环节 | 状态 | 说明 |
|-----------|-------------|------|------|
| shotId | STAGE-7 (storyboard) | ✅ | shot.id |
| duration | STAGE-6 (duration) | ✅ | shot.duration |
| scene | STAGE-7 (storyboard) | ✅ | shot.scene |
| mood | STAGE-7 (storyboard) | ✅ | shot.emotionPhase |
| camera | STAGE-9 (camera) | ⚠️ | 有数据但需结构化 |
| cameraString | STAGE-9/11 | ⚠️ | 需生成字符串版本 |
| lighting | STAGE-11 | ⚠️ | 需从prompt提取 |
| lightingString | STAGE-11 | ⚠️ | 需生成 |
| characterRef | STAGE-4 (characters) | ✅ | 已构建路径字符串 |
| character | STAGE-4 (characters) | ✅ | 已构建极简锚点 |
| action | STAGE-7 (storyboard) | ✅ | 从visualPrompt/narration提取 |
| dialogue | STAGE-5 (script) | ✅ | 已格式化 |
| timeline | STAGE-6 (duration) | ⚠️ | 有数据但需结构化 |
| timelineString | STAGE-11 | ⚠️ | 需生成 |
| backgroundSound | STAGE-11 | ✅ | 已构建对象 |
| backgroundSoundString | STAGE-11 | ✅ | 已生成字符串 |
| audioLayer | STAGE-7.5 (opening) | ✅ | 片头已构建 |
| audioLayerString | STAGE-11 | ✅ | 已生成字符串 |
| titleOverlay | STAGE-7.5 (opening) | ✅ | 片头已构建 |
| titleOverlayString | STAGE-11 | ✅ | 已生成字符串 |
| prompt | STAGE-11/14 | ✅ | 已生成 |
| promptCharCount | STAGE-11 | ✅ | 已计算 |
| physicsLayer | STAGE-11 | ✅ | 已预留接口 |
| colorScience | STAGE-11 | ✅ | 已预留接口 |
| negativePrompt | STAGE-11 | ✅ | 已提取 |
| renderStyle | STAGE-11 | ✅ | 已预留接口 |
| directorStyle | STAGE-11 | ✅ | 已预留接口 |
| priorities | STAGE-11 | ✅ | 已生成元数据 |
| mouthAction | STAGE-5/7 | ✅ | 已生成 |

### 当前输出格式 vs v6.37标准

**当前输出**（stageFinalOutput）:
```javascript
{
  prd,
  characters,
  script,
  storyboard,
  cameraMovements,
  prompts: stages.style,
  postProduction,
  validation
}
```

**v6.37标准输出**:
```json
{
  "meta": {
    "title": "...",
    "worldview": "...",
    "totalDuration": 60,
    "openingDuration": 10,
    "fps": 24,
    "resolution": "1920x1080",
    "styleNotes": "..."
  },
  "shots": [
    { ... }, // 18/17字段
    { ... }
  ]
}
```

## 改造计划

### 阶段1：修改 stageFinalOutput（最紧急）

**目标**：将输出格式从 `{prd, characters, ...}` 改为 `{meta, shots}`

**步骤**：
1. 在 stageFinalOutput 中组装 meta 对象
2. 从 stages.style（prompts数组）中提取并组装 shots 数组
3. 确保 shots 数组包含所有 v6.37 字段
4. 保留原始输出作为 backward compatibility

**代码修改**：
```javascript
// stageFinalOutput 新增
const meta = {
  title: stages.prd?.title || stages.script?.title || '未命名',
  worldview: this.mode || 'default',
  totalDuration: stages.storyboard?.totalDuration || stages.duration?.totalDuration || 60,
  openingDuration: stages.opening?.duration || 10,
  fps: 24,
  resolution: '1920x1080',
  styleNotes: stages.prd?.style?.description || ''
};

const shots = stages.style?.map(prompt => ({
  shotId: prompt.shotId,
  duration: prompt.duration,
  scene: prompt.scene,
  mood: prompt.mood,
  camera: prompt.camera,
  cameraString: prompt.cameraString,
  lighting: prompt.lighting,
  lightingString: prompt.lightingString,
  characterRef: prompt.characterRef,
  character: prompt.character,
  action: prompt.action,
  dialogue: prompt.dialogue,
  timeline: prompt.timeline,
  timelineString: prompt.timelineString,
  backgroundSound: prompt.backgroundSound,
  backgroundSoundString: prompt.backgroundSoundString,
  audioLayer: prompt.audioLayer,
  audioLayerString: prompt.audioLayerString,
  titleOverlay: prompt.titleOverlay,
  titleOverlayString: prompt.titleOverlayString,
  prompt: prompt.prompt,
  promptCharCount: prompt.promptCharCount || prompt.length,
  mouthAction: prompt.mouthAction,
  physicsLayer: prompt.physicsLayer,
  colorScience: prompt.colorScience,
  negativePrompt: prompt.negativePrompt,
  renderStyle: prompt.renderStyle,
  directorStyle: prompt.directorStyle,
  priorities: prompt.priorities,
  qualityScore: prompt.qualityScore,
  referenceImages: prompt.referenceImages
})) || [];

const output = {
  meta,
  shots,
  // 保留原始字段用于backward compatibility
  _legacy: {
    prd: stages.prd,
    characters: stages.characters,
    script: stages.script,
    storyboard: stages.storyboard,
    cameraMovements: stages.camera,
    postProduction: stages.postProduction,
    validation: {
      alignment: stages.alignment,
      schema: stages.schema,
      storyboard: stages.storyboardValidation,
      compliance: stages.compliance,
      preRender: stages.preRender,
      integrity: integrityResult
    }
  }
};
```

### 阶段2：全链路字段流转优化

**目标**：确保每个字段在全链路中正确流转

**关键检查点**：
1. **STAGE-5 (剧本生成)**：确保 script.scenes 包含 emotionPhase, characters, narration, dialogue, mouthAction
2. **STAGE-6 (时长分配)**：确保 shotDurations 正确流转到 storyboard
3. **STAGE-7 (故事板)**：确保 shots 包含 scene, narration, characters, type, emotionPhase, visualPrompt
4. **STAGE-9 (运镜设计)**：确保 cameraMovements 包含 shotId, movement, description, timeline
5. **STAGE-11 (渲染)**：确保 prompts 包含所有 v6.37 字段
6. **STAGE-14 (风格注入)**：确保风格注入不破坏 v6.37 字段结构

**检查方法**：在每个 stage 的输入输出中添加字段存在性验证

### 阶段3：审核环节适配

**目标**：确保 QualityGate、Compliance 等审核环节适配 v6.37 字段

**检查点**：
1. STAGE-11.5 (PromptQualityGate)：检查 prompts 数组中的字段完整性
2. STAGE-12 (Compliance)：检查 characterRef 格式、dialogue 格式
3. STAGE-13 (PreRenderValidation)：检查 referenceImages 存在性
4. STAGE-16 (IntegrityValidation)：检查 meta + shots 结构完整性

### 阶段4：测试验证

**目标**：全链路测试验证

**测试步骤**：
1. 运行单镜头测试，检查输出格式
2. 运行全链路测试（如饕餮EP01），检查所有字段
3. 验证字段流转：从前一个 stage 到下一个 stage
4. 验证合成：stageFinalOutput 的 meta + shots 结构

## 优化建议（站在巨人肩膀上）

### 1. 字段增强
- **scene**：当前是简单字符串，可优化为结构化对象（五维空间）
- **mood**：当前是字符串，可优化为结构化对象（包含情绪强度、情绪转折等）
- **action**：当前是字符串，可优化为三层模型（主动作+微动作+伴随动作）

### 2. 新增字段
- **shotType**：明确标记 shot 类型（opening/transition/climax/closing）
- **emotionIntensity**：情绪强度等级（L1-L5）
- **visualComplexity**：视觉复杂度等级（简单/中等/复杂）
- **importance**：镜头重要性（critical/high/normal）

### 3. 全链路优化
- 在 STAGE-7 故事板阶段就注入 v6.37 字段结构，而不是在 STAGE-11 渲染阶段才构建
- 这样可以让后续 stage（如 STAGE-9 运镜、STAGE-11 渲染）直接使用结构化字段
- 减少 STAGE-11 的字段提取和构建工作

## 执行顺序

1. **阶段1**：修改 stageFinalOutput（30分钟）
2. **阶段2**：检查并优化全链路字段流转（60分钟）
3. **阶段3**：适配审核环节（30分钟）
4. **阶段4**：测试验证（30分钟）

总计约2.5小时。
