# 贡献指南

## 欢迎

感谢你对卓越系统的关注！本项目欢迎各种形式的贡献。

## 如何贡献

1. **Fork 仓库** 并创建你的分支
2. **提交代码** 遵循代码规范
3. **提交 PR** 并填写 PR 模板

## 代码规范

- 使用 ESLint 配置
- 函数注释使用 JSDoc
- 新功能需附带测试

## 提交信息规范

```
type(scope): subject

body

footer
```

type 类型：feat, fix, docs, style, refactor, test, chore

## 目录结构

```
app/          — 应用层
config/       — 配置
core/         — 核心引擎
data/         — 数据
docs/         — 文档
domain/       — 领域模型
engines/      — 渲染/脚本引擎
infrastructure/ — 基础设施
scripts/      — 脚本
skills/       — 技能矩阵
systems/      — 系统模块
tests/        — 测试
utils/        — 工具
```

## 新模块默认关闭

所有新增模块默认 `enabled: false`，通过配置显式启用。

## 联系

提交 Issue 或发送邮件至维护者。
