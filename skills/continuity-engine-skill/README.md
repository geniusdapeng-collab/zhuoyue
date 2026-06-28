# Continuity Engine Skill

## 功能描述

Continuity Engine Skill 封装了镜头连续性检查引擎，核心检查项：

1. **景别过渡检查** — 相邻镜头景别差≤1级硬切合法，=2级需叠化，≥3级非法
2. **运镜方向追踪** — 推/拉/摇/移/跟的向量一致性，防止方向突变
3. **视觉元素验证** — 光影、环境、道具跨镜头连续性
4. **转场类型建议** — 基于相邻镜头参数推荐合法转场类型

## 输入接口

```javascript
{
  shots: Array,              // 镜头列表
  cameraMovements: Array,    // 运镜数据（来自 cinematic-camera-skill）
  mode: String               // 模式（nirath|generic，默认 nirath）
}
```

## 输出接口

```javascript
{
  continuityReport: Array,    // 逐对镜头的连续性分析报告
  transitionSuggestions: Array, // 转场建议
  issues: Array,             // 问题列表
  overallScore: Number        // 整体连续性评分 (0-1)
}
```

## 依赖

- `cinematic-camera-skill` — 需要运镜数据（cameraMovements）来检查运镜一致性

## 使用示例

```javascript
const { ContinuityEngineSkill } = require('./skills/continuity-engine-skill');

const skill = new ContinuityEngineSkill();
await skill.initialize({ eventBus });

const result = await skill.execute({
  shots: [...],
  cameraMovements: [...],  // 来自 cinematic-camera-skill 的输出
  mode: 'nirath'
}, context);

console.log(result.overallScore); // 0.92
console.log(result.transitionSuggestions[0]); // { pairIndex: 0, transition: 'dissolve', reason: '景别差2级' }
```

## 配置

`config.json`:

```json
{
  "name": "continuity-engine-skill",
  "version": "1.0.0",
  "enabled": true,
  "dependencies": ["cinematic-camera-skill"]
}
```

## 源模块

- `systems/continuity-engine.js`
