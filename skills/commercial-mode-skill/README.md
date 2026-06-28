# Commercial Mode Skill

## 功能描述

Commercial Mode Skill 封装了商业广告片的专业模式，核心原则：

> **"产品才是主角，整个剧情为产品服务。"**

功能覆盖广告片全生命周期：
- 生成 5 段式广告结构（Hook → Problem → Solution → Proof → CTA）
- 增强每个镜头的产品提示词
- 标记每个镜头所属阶段（hook/problem/solution/proof/cta）
- 输出产品专属运镜（环绕、特写、产品展示等）

## 输入接口

```javascript
{
  product: Object,      // 产品信息 { name, type, features }
  brand: Object,        // 品牌信息 { name, style, tone }
  sellingPoints: Array, // 核心卖点
  targetAudience: String, // 目标受众
  brandColor: String,   // 品牌色（可选）
  adDuration: Number,   // 广告时长（秒，默认30）
  shots: Array          // 镜头列表（可选，用于增强）
}
```

## 输出接口

```javascript
{
  adStructure: Object,      // 广告结构 { hook, problem, solution, proof, cta }
  enhancedShots: Array,      // 增强后的镜头提示词
  productCameraMoves: Array, // 产品专属运镜
  markedPhases: Array        // 镜头阶段标记
}
```

## 依赖

无依赖。

## 使用示例

```javascript
const { CommercialModeSkill } = require('./skills/commercial-mode-skill');

const skill = new CommercialModeSkill();
await skill.initialize({ eventBus });

const result = await skill.execute({
  product: { name: '智能手环', type: 'wearable' },
  brand: { name: 'X-Tech', style: '科技感' },
  sellingPoints: ['24h续航', '心率监测', '防水'],
  targetAudience: '运动爱好者',
  adDuration: 30
}, context);

console.log(result.adStructure.hook); // "你疲惫的时候，它在默默守护..."
```

## 配置

`config.json`:

```json
{
  "name": "commercial-mode-skill",
  "version": "1.0.0",
  "enabled": true,
  "dependencies": []
}
```

## 源模块

- `systems/commercial-mode.js`
