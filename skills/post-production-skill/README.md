# Post Production Skill

## 功能描述

Post Production Skill 封装了卓越系统的后期制作体系，双引擎驱动：

- **PostProductionPipeline** — 系统级管线，负责合并、横版转换、字幕合成、音乐添加
- **PostProductionEngine** — 引擎级后期，支持多版本输出、HyperFrames 集成、无版权音乐库

核心约束：
- 横版输出（16:9）— 竖版素材自动横屏化
- 无字幕输出 — 合成已包含字幕，后期不再单独添加
- 单版输出 — 只输出一版成片
- 画面文字限制 — Prompt 中禁止小字，只允许大背景少量大字

## 输入接口

```javascript
{
  renderOutput: Array,     // 渲染输出片段列表
  brand: Object,          // 品牌信息（来自 commercial-mode-skill）
  brandColor: String,     // 品牌色
  musicPreference: String, // 音乐偏好
  outputPath: String,     // 输出路径
  subtitleData: Array     // 字幕数据（可选）
}
```

## 输出接口

```javascript
{
  finalVideo: String,         // 最终视频路径
  postProductionLog: Array,   // 后期制作日志
  versions: Array             // 输出版本列表
}
```

## 依赖

- `commercial-mode-skill` — 需要品牌元素进行后期合成（品牌色、logo、风格等）

## 使用示例

```javascript
const { PostProductionSkill } = require('./skills/post-production-skill');

const skill = new PostProductionSkill();
await skill.initialize({ eventBus });

const result = await skill.execute({
  renderOutput: ['/tmp/clip1.mp4', '/tmp/clip2.mp4'],
  brand: { name: 'X-Tech', style: '科技感' },
  brandColor: '#00FF88',
  musicPreference: 'electronic',
  outputPath: '/output/final.mp4'
}, context);

console.log(result.finalVideo); // '/output/final.mp4'
```

## 配置

`config.json`:

```json
{
  "name": "post-production-skill",
  "version": "1.0.0",
  "enabled": true,
  "dependencies": ["commercial-mode-skill"]
}
```

## 源模块

- `systems/post-production-pipeline.js`
- `engines/post-production-engine/post-production-engine.js`
