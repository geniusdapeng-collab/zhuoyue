# Prompt Guardian Skill

## 功能
自动修复与防护Prompt内容 — 服装锁定、外观锚定、敏感词过滤、引用格式修正。

## 输入
```js
{
  prompt: string,          // 原始Prompt
  options: {               // 可选
    guardian: {},          // PromptGuardian配置
    standardV3: {},        // StandardV3配置
    standardizer: {}       // Standardizer配置
  }
}
```

## 输出
```js
{
  prompt: string,          // 修复后的Prompt
  fixLog: Array,           // 修复步骤日志
  fixed: boolean           // 是否发生了修复
}
```

## 依赖
无

## 使用示例
```js
const { PromptGuardianSkill } = require('./index');
const skill = new PromptGuardianSkill();
await skill.initialize();
const result = await skill.execute({
  prompt: '穿警服的人站在街道上'
});
```
