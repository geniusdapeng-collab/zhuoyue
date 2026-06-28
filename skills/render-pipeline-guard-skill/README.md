# Render Pipeline Guard Skill

## 功能描述

Render Pipeline Guard Skill 封装了渲染流水线的双层防护体系：

- **RenderPipelineGuard** — 强制检查提交条件，不满足就阻塞（参考图角色确认、文件存在性、模型状态等）
- **PipelineIntegrityValidator** — 反向验证输出完整性，检查上游输出是否被下游正确消费

这是比 Prompt Guardian 更底层的约束：Prompt Guardian = 自动修复内容；Pipeline Guard = 强制检查条件，不满足就阻断链路。

## 输入接口

```javascript
{
  shots: Array,        // 镜头列表
  characters: Array,    // 角色列表（用于检查参考图）
  pipelineState: Object, // 流水线状态
  outputPath: String   // 输出路径
}
```

## 输出接口

```javascript
{
  guardResult: {       // 强制检查结果
    passed: Boolean,  // 是否通过
    failures: Array   // 失败项详情
  },
  integrityResult: {   // 完整性验证结果
    valid: Boolean,   // 是否有效
    errors: Array,    // 错误列表
    warnings: Array   // 警告列表
  },
  canProceed: Boolean,  // 是否可以继续渲染
  blockReasons: Array  // 阻塞原因（如有）
}
```

## 依赖

- `prompt-guardian-skill` — 依赖其修复后的 Prompt 作为输入

## 使用示例

```javascript
const { RenderPipelineGuardSkill } = require('./skills/render-pipeline-guard-skill');

const skill = new RenderPipelineGuardSkill();
await skill.initialize({ eventBus });

const result = await skill.execute({
  shots: [...],
  characters: [...],
  outputPath: '/output/video.mp4'
}, context);

if (!result.canProceed) {
  console.error('渲染被阻塞:', result.blockReasons);
}
```

## 配置

`config.json`:

```json
{
  "name": "render-pipeline-guard-skill",
  "version": "1.0.0",
  "enabled": true,
  "dependencies": ["prompt-guardian-skill"]
}
```

## 源模块

- `scripts/render-pipeline-guard.js`
- `systems/pipeline-integrity-validator.js`
