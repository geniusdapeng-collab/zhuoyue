# Cinematic Camera Skill

## 功能描述

Cinematic Camera Skill 封装了卓越系统的两套运镜系统，根据配置自动选择：

- **v2（规则驱动）** — 环境DNA绑定 + Nirath物理驱动 + 秒级时间轴调度。适用于有明确场景类型的项目。
- **v4（LLM驱动）** — 镜头内时间轴系统，由LLM实时生成运镜策略。适用于复杂叙事场景。

| 版本 | 驱动方式 | 是否需要LLM | 适用场景 |
|------|----------|------------|----------|
| v2   | 规则模板 | 否         | 标准场景、批量生成 |
| v4   | LLM推理  | 是         | 复杂叙事、定制化运镜 |

## 输入接口

```javascript
{
  shots: Array,              // 镜头列表
  sceneDescription: String,  // 场景描述
  cameraVersion: String,      // 版本覆盖（v2|v4，可选）
  llmGateway: Object          // LLMGateway 实例（v4必需）
}
```

## 输出接口

```javascript
{
  cameraMovements: Array,   // 每个镜头的运镜参数
  timelineData: Array,      // 镜头内时间轴数据
  cameraLog: Array,         // 执行日志
  versionUsed: String        // 实际使用的版本
}
```

## 依赖

无依赖。

## 使用示例

```javascript
const { CinematicCameraSkill } = require('./skills/cinematic-camera-skill');

// v4 LLM驱动
const skill = new CinematicCameraSkill({ cameraVersion: 'v4' });
await skill.initialize({ eventBus });

const result = await skill.execute({
  shots: [...],
  sceneDescription: '室内医院走廊，医生奔跑',
  llmGateway: llmGatewayInstance
}, context);

console.log(result.versionUsed); // 'v4'
console.log(result.cameraMovements[0]); // { movement: 'push', speed: 1.2, ... }
```

## 配置

`config.json`:

```json
{
  "name": "cinematic-camera-skill",
  "version": "1.0.0",
  "enabled": true,
  "dependencies": []
}
```

Skill 构造器选项：

```javascript
new CinematicCameraSkill({
  cameraVersion: 'v4',  // 或 'v2'
  moduleOptions: {
    v2: { ... },  // v2 专属配置
    v4: { ... }   // v4 专属配置
  }
})
```

## 源模块

- `systems/camera-movement-system-v2.js`
- `systems/camera-movement-system-v4.js`
