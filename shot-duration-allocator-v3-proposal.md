# 镜头时长分配系统升级方案 v6.8.4
## ShotDurationAllocatorV2 → ShotDurationAllocatorV3

---

## 一、当前系统问题分析

### 1.1 已有能力（v6.8.3）
| 维度 | 状态 | 说明 |
|------|------|------|
| 内容字数 | ✅ | 语音基线计算 |
| 重要性 | ✅ | importance系数 |
| 卖点权重 | ✅ | sellingPointType × Priority |
| 视觉复杂度 | ✅ | visualComplexity加成 |
| 角色类型 | ✅ | 五段式广告角色 |
| 节奏曲线 | ✅ | 4种商业节奏模板 |
| 相邻差异 | ✅ | 疲劳度检查 |

### 1.2 缺失维度
| 维度 | 重要性 | 当前问题 |
|------|--------|---------|
| **台词/对话密度** | P0 | 有对话的镜头需要更多时间让演员说完 |
| **动作复杂度** | P0 | 动作越多，需要更多时间展示 |
| **情绪转折幅度** | P1 | 情绪变化大需要过渡时间 |
| **视觉信息量** | P1 | 画面元素多需要观众消化时间 |
| **叙事节奏点** | P1 | 高潮/转折/铺垫需要不同节奏 |
| **产品展示深度** | P1 | 360度展示 vs 静态展示 |
| **场景切换复杂度** | P2 | 转场类型影响时长 |
| **观众注意力曲线** | P2 | 开头吸引注意，中间保持，结尾强化 |
| **音乐节拍匹配** | P2 | 是否需要在音乐节拍上切换 |

---

## 二、升级目标

### 2.1 核心目标
> **从"5维分配"升级为"12维智能分配"，让每个镜头的时长都能精准反映其内容复杂度、叙事功能、情绪价值和观众体验。**

### 2.2 量化目标
- 平均时长误差：从 ±2秒 降低到 ±0.5秒
- 内容超载率：从 15% 降低到 <5%
- 节奏满意度：从 "可接受" 提升到 "精准匹配"

---

## 三、新维度设计（7个新增维度）

### 3.1 维度6：台词/对话密度 (DialogueDensity)
```
计算方式：
- 纯画面（无台词）：density = 0
- 短台词（<10字）：density = 0.3
- 中台词（10-30字）：density = 0.6
- 长台词（30-60字）：density = 1.0
- 超长台词（>60字）：density = 1.3

时长加成：baseDuration × (1 + density × 0.4)
```

### 3.2 维度7：动作复杂度 (ActionComplexity)
```
计算方式：
- 静态展示：complexity = 1
- 简单动作（行走、拿起）：complexity = 2
- 复合动作（转身+展示+放下）：complexity = 4
- 复杂动作（舞蹈、打斗）：complexity = 6
- 极速动作（跳跃、冲刺）：complexity = 8

时长加成：baseDuration + complexity × 0.5秒
```

### 3.3 维度8：情绪转折幅度 (EmotionShift)
```
计算方式：
- 无转折（平铺直叙）：shift = 0
- 小转折（开心→平静）：shift = 1
- 中转折（紧张→放松）：shift = 2
- 大转折（悲伤→狂喜）：shift = 3
- 剧烈转折（绝望→希望）：shift = 4

时长加成：baseDuration + shift × 1.5秒
```

### 3.4 维度9：视觉信息量 (VisualDensity)
```
计算方式：
- 极简（单一主体）：density = 1
- 简单（主体+背景）：density = 2
- 中等（多元素场景）：density = 4
- 复杂（拥挤场景）：density = 6
- 极复杂（全景+细节+文字）：density = 8

时长加成：baseDuration × (1 + density × 0.08)
```

### 3.5 维度10：叙事节奏点 (NarrativeBeat)
```
计算方式：
- 铺垫/ exposition：beat = 0.9（可压缩）
- 上升/ rising：beat = 1.0（标准）
- 高潮/ climax：beat = 1.4（需要延长）
- 下降/ falling：beat = 0.8（可压缩）
- 转折/ twist：beat = 1.2（需要停顿）
- 余韵/ resolution：beat = 1.1（可延长）

时长加成：baseDuration × beat
```

### 3.6 维度11：产品展示深度 (ProductShowcase)
```
计算方式：
- 静态展示（单角度）：showcase = 1
- 多角度展示（3-5个角度）：showcase = 2
- 360度旋转展示：showcase = 3
- 功能演示（实际操作）：showcase = 4
- 拆解展示（内部结构）：showcase = 5

时长加成：baseDuration + showcase × 1.0秒
```

### 3.7 维度12：场景切换复杂度 (TransitionType)
```
计算方式：
- 硬切（直接切换）：transition = 0
- 淡入淡出：transition = 0.5
- 滑动切换：transition = 1.0
- 旋转/翻页：transition = 1.5
- 复杂转场（粒子/光效）：transition = 2.0

时长加成：baseDuration + transition秒
```

---

## 四、新算法设计：多维度加权融合

### 4.1 算法核心公式
```javascript
finalDuration = (
  // 基础层：内容驱动
  voiceBaseline × importanceCoeff +
  
  // 复杂度层：视觉+动作+信息
  visualBonus +
  actionBonus +
  visualDensityBonus +
  
  // 叙事层：情绪+节奏+展示
  emotionShiftBonus +
  narrativeBeatBonus +
  productShowcaseBonus +
  
  // 技术层：转场+台词
  transitionBonus +
  dialogueDensityBonus +
  
  // 商业层：卖点权重
  sellingPointBonus
) × rhythmCurveMultiplier
```

### 4.2 权重配置（可配置化）
```javascript
const WEIGHT_CONFIG = {
  // 基础层权重
  voiceBaseline: 1.0,        // 语音基线（必保）
  importance: 0.8,           // 重要性
  
  // 复杂度层权重
  visualComplexity: 0.6,     // 视觉复杂度
  actionComplexity: 0.7,     // 动作复杂度
  visualDensity: 0.5,        // 视觉信息量
  
  // 叙事层权重
  emotionShift: 0.6,         // 情绪转折
  narrativeBeat: 0.7,        // 叙事节奏点
  productShowcase: 0.8,      // 产品展示深度
  
  // 技术层权重
  transitionType: 0.3,       // 转场复杂度
  dialogueDensity: 0.9,      // 台词密度（高权重！）
  
  // 商业层权重
  sellingPoint: 0.8          // 卖点权重
};
```

### 4.3 动态权重调整
根据视频类型自动调整权重：
- **商业广告**：sellingPoint↑, productShowcase↑, visualDensity↑
- **教育科普**：dialogueDensity↑, visualComplexity↑, emotionShift↓
- **剧情短片**：narrativeBeat↑, emotionShift↑, actionComplexity↑
- **Vlog**：transitionType↑, actionComplexity↑, productShowcase↓

---

## 五、实现计划

### 5.1 文件修改
| 文件 | 修改内容 | 工作量 |
|------|---------|--------|
| `systems/shot-duration-allocator.js` | 新增7个维度+多维度融合算法 | 高 |
| `core/stages/stage-6-duration-allocation.js` | 传递新维度参数 | 中 |
| `core/nirath-master-pipeline.js` | 提取场景维度信息 | 中 |

### 5.2 新增接口
```javascript
// 场景维度信息提取
scene._dialogueDensity = calculateDialogueDensity(scene.dialogue);
scene._actionComplexity = calculateActionComplexity(scene.actionDescription);
scene._emotionShift = calculateEmotionShift(scene.emotionStart, scene.emotionEnd);
scene._visualDensity = calculateVisualDensity(scene.visualElements);
scene._narrativeBeat = calculateNarrativeBeat(scene.beatType);
scene._productShowcase = calculateProductShowcase(scene.showcaseType);
scene._transitionType = calculateTransitionType(scene.transition);
```

### 5.3 测试方案
1. **单元测试**：每个维度的独立计算逻辑
2. **集成测试**：多维度融合后的时长分配
3. **对比测试**：v2 vs v3 的分配差异
4. **边界测试**：极端情况（超长台词/复杂动作/多转折）

---

## 六、预期效果

### 6.1 场景示例
**场景：扫地机器人功能展示**
```
台词："CleanMaster X5，5200Pa飓风吸力，地毯深层灰尘无处遁形"
（25字，高密度产品信息）

动作：产品旋转展示 + 吸力演示 + 灰尘被吸入
（复合动作 + 360度展示）

情绪：自豪 → 震撼
（中等转折）

v2分配：4秒（基于字数+重要性）
v3分配：7秒（台词密度+动作复杂度+产品展示+情绪转折）

效果：观众有足够时间理解产品核心卖点
```

### 6.2 对比数据
| 指标 | v2 | v3（预期） |
|------|-----|-----------|
| 平均误差 | ±2秒 | ±0.5秒 |
| 内容超载率 | 15% | <5% |
| 节奏匹配度 | 可接受 | 精准 |
| 观众理解度 | 70% | 90%+ |

---

## 七、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 维度过多导致计算复杂 | 性能下降 | 引入缓存机制，预计算常用组合 |
| 权重配置主观性强 | 分配不公 | 提供A/B测试框架，数据驱动调优 |
| 与现有系统不兼容 | 集成困难 | 保持向后兼容，新增维度可选 |
| 测试数据不足 | 效果难验证 | 建立标准化测试集，覆盖各类场景 |

---

## 八、下一步行动

1. **队长确认方案** ← 当前步骤
2. 实现 `systems/shot-duration-allocator.js` 升级
3. 修改 Pipeline 传递新维度
4. 编写全面测试
5. 验证效果并调优
6. 发布 v6.8.4
