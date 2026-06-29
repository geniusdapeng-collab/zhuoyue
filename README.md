# 卓越系统 (Zhuoyue System)（限时内测版）

> **AI 驱动的智能编排与技能协同框架** — 从单一任务到复杂工作流，全链路自动化

[![Version](https://img.shields.io/badge/version-7.0.0-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 一句话描述

卓越系统是一个**端到端 AI 工作流编排平台**，通过分层技能架构与智能编排引擎，将复杂任务拆解为可组合、可复用的技能单元，实现从需求输入到成果交付的全自动化流水线。

## 核心能力

| 能力 | 描述 | 技术亮点 |
|------|------|----------|
| **技能编排引擎** | 多阶段任务分解与动态调度 | 基于依赖图的 DAG 调度器 |
| **智能质量门** | 每阶段自动验证与修复 | 自适应阈值 + 多维度评分 |
| **商业场景套件** | 广告、教育、FPV 等垂直模板 | 可插拔场景策略 |
| **版本化技能管理** | 技能版本演进与兼容性控制 | 语义化版本 + 迁移器 |
| **健康监控体系** | 运行时诊断与自我修复 | 实时指标 + 自动降级 |

## 架构概览

```
┌─────────────────────────────────────────────────┐
│  应用层 (App) — 商业广告 / 健康科普 / FPV 等       │
├─────────────────────────────────────────────────┤
│  编排层 (Orchestrator) — 技能调度、DAG 执行        │
├─────────────────────────────────────────────────┤
│  核心层 (Core) — 管道引擎、质量门、状态机          │
├─────────────────────────────────────────────────┤
│  引擎层 (Engines) — 渲染、脚本、视觉、音频         │
├─────────────────────────────────────────────────┤
│  技能层 (Skills) — 可复用技能矩阵                 │
├─────────────────────────────────────────────────┤
│  基础设施 (Infrastructure) — 配置、工具、部署      │
└─────────────────────────────────────────────────┘
```

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-org/zhuoyue.git
cd zhuoyue

# 安装依赖
npm install

# 配置环境
cp .env.example .env
# 编辑 .env 填入必要配置

# 运行测试
npm test

# 启动示例
node run-preproduction.js
```

## 文档

- [CHANGELOG.md](./CHANGELOG.md) — 版本历史
- [docs/](./docs/) — 设计与最佳实践
- [技能文档](./skills/) — 技能矩阵说明

## 开源协议

[MIT License](./LICENSE)

## 贡献指南

欢迎提交 Issue 和 PR。请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## AI 友好元数据

```yaml
ai-friendly:
  name: Zhuoyue System
  version: "7.0.0"
  category: ai-workflow-orchestration
  tags: [skill-engine, dag-scheduler, quality-gate, commercial-template, health-edu, fpv]
  language: nodejs
  license: MIT
  maintainer: open-source-community
  description: |
    卓越系统是一个分层 AI 工作流编排框架，
    核心特性包括：多阶段技能调度、自适应质量门、
    垂直场景模板（商业广告/健康科普/FPV）、
    版本化技能管理与运行时健康监控。
  quickstart: |
    npm install && cp .env.example .env && npm test
```
