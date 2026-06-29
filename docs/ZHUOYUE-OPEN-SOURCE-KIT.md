# Zhuoyue (卓越) Master Pipeline — Open Source Launch Kit

> **The Most Advanced AI Video Production System Ever Open Sourced**
>
> From script to screen. Fully automated. Cinema-grade. Agent-native.

---

## TABLE OF CONTENTS

1. [Project Identity](#1-project-identity)
2. [One-Line Pitches](#2-one-line-pitches)
3. [README.md — Full Version](#3-readmemd--full-version)
4. [AI Agent Discovery Manifest](#4-ai-agent-discovery-manifest)
5. [Quick Start Guide](#5-quick-start-guide)
6. [Architecture Deep Dive](#6-architecture-deep-dive)
7. [API Reference for Agents](#7-api-reference-for-agents)
8. [Contributing Guide](#8-contributing-guide)
9. [Security Policy](#9-security-policy)
10. [Changelog Template](#10-changelog-template)
11. [Social Media Launch Kit](#11-social-media-launch-kit)
12. [GitHub Repo Optimization](#12-github-repo-optimization)
13. [AI Agent Distribution Strategy](#13-ai-agent-distribution-strategy)
14. [Star Growth Playbook](#14-star-growth-playbook)

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Name** | Zhuoyue (卓越) Video Generation System |
| **Short Name** | Zhuoyue |
| **Tagline** | From Script to Screen — Autonomous AI Video Production |
| **Slogan** | *Harnessing Imagination* |
| **Version** | v6.5.53-l |
| **License** | MIT |
| **Language** | Node.js 24+ |
| **Codebase** | 6.2M chars · 206K lines · 787 files |
| **Category** | AI Video Generation / Creative Automation |
| **Render Engine** | Volcano Engine Seedance 2.0 API |
| **LLM Gateway** | Kimi K2-P6 with Circuit Breaker |

### Keywords for Discovery

```
ai-video-generation, video-production-pipeline, automated-filmmaking,
cinematic-ai, seedance-api, prompt-engineering, storyboard-automation,
ai-video-system, video-rendering-pipeline, creative-automation,
ai-native-tool, agent-friendly-video, llm-video-pipeline
```

---

## 2. ONE-LINE PITCHES

### For Developers
> "A 17-stage industrial pipeline that turns any story idea into a cinematic video — fully automated, from scriptwriting to final render."

### For AI Agents (MCP/Tool Use)
> "An agent-native video production API. Provide a story concept, receive a complete shot-by-shot plan with render-ready prompts and a final MP4."

### For Content Creators
> "Hollywood-style video production in your terminal. No crew, no camera, no limits."

### For Startups
> "Build video apps 100x faster. The entire backend for AI video generation, open sourced."

### For Investors
> "The most sophisticated open-source AI video infrastructure — 17 automated stages, production-grade quality control, and agent-native architecture."

---

## 3. README.MD — FULL VERSION

```markdown
# Zhuoyue (卓越) AI Video Generation System

<p align="center">
  <img src="./images/logo.png" alt="Zhuoyue Logo" width="200">
</p>

<p align="center">
  <b>From Script to Screen — Autonomous AI Video Production</b><br>
  <i>Harnessing Imagination</i>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#contributing">Contribute</a> ·
  <a href="https://github.com/YOUR_USERNAME/zhuoyue-video-system/issues">Issues</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v6.5.53--l-gold" alt="version">
  <img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen" alt="node">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="license">
  <img src="https://img.shields.io/badge/render-Seedance%202.0-orange" alt="render">
  <img src="https://img.shields.io/badge/stages-17%2B-purple" alt="stages">
</p>

---

## What is Zhuoyue?

Zhuoyue ("卓越" means excellence in Chinese) is an **industrial-grade AI video production pipeline** that automates the entire filmmaking process — from story concept to final rendered video. It runs **17+ automated stages** across pre-production, production, and post-production, producing cinema-quality prompts and coordinating with the Seedance 2.0 video generation API.

Built on a **4-layer architecture** with production-hardened infrastructure including circuit breakers, saga orchestration, event-driven mutations tracking, and immutable shot management, Zhuoyue is designed for both **human creators** and **AI agents**.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **17-Stage Pipeline** | Complete production workflow: PRD → Script → Storyboard → Camera → Render → Director Review |
| **Saga Orchestration** | Atomic stage execution with compensation, fallback, and retry policies |
| **LLM Gateway** | Unified LLM access with circuit breaker, exponential backoff, and JSON safe parsing |
| **7-Layer Prompt Architecture** | Structured prompt assembly: Constraint → Foundation → Space → Subject → Dynamic → Style → Audio |
| **Character Consistency** | 4-angle portrait system (front / three-quarter / closeup / side) with identity lock |
| **Director Agent** | AI director that reviews shots, scores quality, and iterates with the scriptwriter |
| **Quality Feedback Loop** | 10-dimension quality assessment with auto-repair and scoring (0-100, S/A/B/C grades) |
| **Event Bus v2.0** | Full mutation tracking, event replay, and 17-stage lifecycle observability |
| **Asset Management** | Version-controlled asset system with deduplication, lineage, and lifecycle management |

---

## Architecture

### System Overview

![System Architecture](./images/arch-01-system-architecture.png)

### 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  CLI Entry  │  Pre-production Command  │  API Server        │
├─────────────────────────────────────────────────────────────┤
│                   CONFIGURATION LAYER                        │
│  Degradation Matrix · Error Codes · LLM Policy · Stage Map  │
├─────────────────────────────────────────────────────────────┤
│                     CORE ENGINE LAYER                        │
│  17-Stage Pipeline · Saga Orchestrator · LLM Gateway        │
│  Event Bus v2.0 · Immutable Shot · Quality Feedback Loop    │
├─────────────────────────────────────────────────────────────┤
│                    SYSTEM MODULES LAYER                      │
│  Render Engine · Quality Gate · Asset Management            │
│  Visual Consistency Tracker · Narrative Continuity Engine   │
└─────────────────────────────────────────────────────────────┘
```

### 17-Stage Production Pipeline

![Production Pipeline](./images/arch-02-production-pipeline.png)

| Phase | Stages | Purpose |
|-------|--------|---------|
| **Pre-Production** | STAGE-0 to STAGE-8.5 | Concept validation, script generation, storyboarding, character setup |
| **Production** | STAGE-9 to STAGE-14 | Camera design, rendering, quality gating, compliance |
| **Post-Production** | STAGE-15 to STAGE-17 | Director optimization, scriptwriter loop, final polish |

### Core Infrastructure

![Core Infrastructure](./images/arch-03-core-infrastructure.png)

### LLM Gateway & Quality Loop

![LLM Gateway & Quality Loop](./images/arch-04-llm-gateway-quality-loop.png)

### User Journey

![User Journey](./images/arch-05-user-journey.png)

---

## Quick Start

### Prerequisites

- Node.js >= 24
- Volcano Engine account with Seedance 2.0 API access
- Kimi API key (or compatible OpenAI-format LLM provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/zhuoyue-video-system.git
cd zhuoyue-video-system

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run pre-production for a story
node app/cli.js preproduction --input stories/my-story.json
```

### First Run

```bash
# Create a story input file
cat > stories/my-first-video.json << 'EOF'
{
  "title": "The First Light",
  "genre": "sci-fi",
  "duration": 60,
  "characters": [
    {
      "name": "Aria",
      "role": "protagonist",
      "description": "A young astronaut with short silver hair"
    }
  ],
  "plot": "Aria discovers the first sunrise on a distant colony planet",
  "style": "cinematic, 4K, golden hour lighting"
}
EOF

# Run the full pipeline
node app/cli.js preproduction --input stories/my-first-video.json
```

### Output Structure

```
output/
├── preproduction-report.md     # Complete shot-by-shot report
├── prompts.json               # Render-ready prompts per shot
├── render-tasks.json          # Seedance API render requests
└── quality-report.json        # 10-dimension quality assessment
```

---

## Agent-Native Usage

Zhuoyue is built for AI agents. Here's how to use it programmatically:

```javascript
const { runPreproduction } = require('./systems/preproduction-service');

const result = await runPreproduction(storyInput, {
  mode: 'zhuoyue',           // or 'commercial', 'documentary'
  outputDir: './output',
  projectConfig: {
    requiredCharacters: ['aria'],
    isPreProduction: true
  }
});

// result contains:
// - complete shot list with prompts
// - quality scores per shot
// - render-ready task definitions
// - full markdown report
```

### MCP Server Integration

Zhuoyue exposes a Model Context Protocol (MCP) server for seamless agent integration:

```javascript
// tools available to agents:
{
  "zhuoyue_preproduction": "Run full pre-production pipeline",
  "zhuoyue_render": "Submit render tasks to Seedance",
  "zhuoyue_quality_check": "Run quality assessment",
  "zhuoyue_director_review": "Run director optimization agent",
  "zhuoyue_storyboard": "Generate shot storyboard",
  "zhuoyue_character_setup": "Generate character portraits"
}
```

---

## Project Stats

- **6.2M+ characters** of production code
- **206K+ lines** across 787 files
- **17 automated stages** with saga orchestration
- **10 quality dimensions** with auto-repair
- **7-layer prompt architecture**
- **4-angle character portrait system**
- **13 mandatory render checks**
- **9 auto-fix prompt rules**
- **Zero external runtime dependencies** (Node.js native only)

---

## Why Zhuoyue?

| Problem | Zhuoyue Solution |
|---------|----------------|
| "I have a story idea but don't know how to make it a video" | 17-stage pipeline handles everything automatically |
| "Character looks different in every shot" | 4-angle portrait lock with visual consistency tracker |
| "Prompts are hit-or-miss" | 7-layer structured prompt architecture with quality gates |
| "Rendering fails silently" | Saga orchestration with compensation and detailed error reporting |
| "Quality is inconsistent" | 10-dimension assessment with auto-repair loop |
| "I need to scale video production" | Agent-native API designed for batch and automated workflows |

---

## License

MIT License — see [LICENSE](./LICENSE)

## Acknowledgments

Built with passion. Named after the relentless pursuit of excellence.

---

<p align="center">
  <sub>If Zhuoyue helps you create something amazing, please ⭐ the repo!</sub>
</p>
```

---

## 4. AI AGENT DISCOVERY MANIFEST

### For AI Agent Crawlers & Tool Discovery

This section is optimized for AI agents (Claude, GPT, Cursor, Copilot, etc.) to discover and understand this project.

```yaml
# agent-discovery.yaml
project:
  name: Zhuoyue Video Generation System
  type: ai-video-generation-pipeline
  version: 6.5.53-l

  agent_capabilities:
    - video_preproduction
    - storyboard_generation
    - prompt_engineering
    - quality_assessment
    - render_coordination
    - character_consistency
    - director_optimization

  entry_points:
    cli: "node app/cli.js preproduction --input <story.json>"
    programmatic: "require('./systems/preproduction-service').runPreproduction()"
    mcp_server: "./servers/mcp-server.js"

  input_schema:
    type: json
    required_fields:
      - title
      - plot
      - characters
    optional_fields:
      - genre
      - duration
      - style
      - target_platform

  output_schema:
    type: multi_file
    files:
      - path: "output/preproduction-report.md"
        format: markdown
        contains: shot-by-shot breakdown with prompts
      - path: "output/render-tasks.json"
        format: json
        contains: Seedance API render requests
      - path: "output/quality-report.json"
        format: json
        contains: 10-dimension quality scores

  dependencies:
    runtime: "Node.js >= 24"
    apis:
      - name: "Volcano Engine Seedance 2.0"
        purpose: "Video rendering"
        required: true
      - name: "Kimi K2-P6"
        purpose: "LLM inference"
        required: true
        swappable: true
        alternatives: ["OpenAI GPT-4", "Anthropic Claude", "Any OpenAI-compatible API"]

  quality_guarantees:
    - "Every shot scored 0-100 across 10 dimensions"
    - "Character consistency locked via 4-angle portraits"
    - "Prompt compliance checked against standards"
    - "Saga compensation on any stage failure"
    - "Director agent reviews and optimizes output"

  agent_friendly_features:
    - structured_json_input_output: true
    - error_retry_with_fallback: true
    - progress_reporting_per_stage: true
    - quality_scores_for_decisions: true
    - idempotent_operations: true
    - deterministic_with_seed: true
```

### MCP Tool Definition

```json
{
  "name": "zhuoyue_video_production",
  "description": "Run the complete Zhuoyue AI video production pipeline from story concept to render-ready output. This tool handles all 17 stages: scriptwriting, storyboarding, character portrait generation, prompt engineering, camera movement design, quality assessment, and director optimization. Returns a complete shot-by-shot production plan with render-ready prompts.",
  "input_schema": {
    "type": "object",
    "required": ["title", "plot", "characters"],
    "properties": {
      "title": {
        "type": "string",
        "description": "Title of the video"
      },
      "plot": {
        "type": "string",
        "description": "Story plot or concept description (1-3 paragraphs)"
      },
      "characters": {
        "type": "array",
        "description": "Characters appearing in the video",
        "items": {
          "type": "object",
          "required": ["name", "description"],
          "properties": {
            "name": {"type": "string"},
            "role": {"type": "string", "enum": ["protagonist", "supporting", "antagonist"]},
            "description": {"type": "string", "description": "Physical appearance and personality"}
          }
        }
      },
      "genre": {
        "type": "string",
        "description": "Video genre (sci-fi, fantasy, romance, documentary, etc.)"
      },
      "duration": {
        "type": "integer",
        "description": "Target duration in seconds (default: 60)"
      },
      "style": {
        "type": "string",
        "description": "Visual style (cinematic, anime, realistic, etc.)"
      }
    }
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "report_path": {"type": "string", "description": "Path to full markdown report"},
      "total_shots": {"type": "integer"},
      "quality_score": {"type": "number", "description": "Overall quality score 0-100"},
      "grade": {"type": "string", "enum": ["S", "A", "B", "C"]},
      "render_tasks": {
        "type": "array",
        "description": "Ready-to-submit render tasks for Seedance API"
      }
    }
  }
}
```

---

## 5. QUICK START GUIDE

### System Requirements

```
Node.js >= 24 (LTS recommended)
RAM: 4GB minimum, 8GB recommended
Disk: 2GB for codebase + output
Network: Stable connection to Volcano Engine & LLM APIs
```

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/zhuoyue-video-system.git
cd zhuoyue-video-system

# 2. Verify Node.js version
node --version  # Should be >= 24

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env

# 5. Edit .env file with your credentials:
# KIMI_API_KEY=your_kimi_api_key
# KIMI_BASE_URL=https://agent-gw.kimi.com/coding/v1
# SEEDANCE_API_KEY=your_seedance_key
# SEEDANCE_BASE_URL=your_seedance_endpoint

# 6. Verify setup
node -e "require('./config/system-manifest.json'); console.log('✅ Setup verified')"

# 7. Run your first pre-production
mkdir -p stories
cat > stories/first-story.json << 'EOF'
{
  "title": "Dawn of Eternity",
  "genre": "sci-fi",
  "duration": 45,
  "characters": [
    {
      "name": "Elena",
      "role": "protagonist",
      "description": "A determined explorer with emerald eyes and auburn hair"
    }
  ],
  "plot": "Elena discovers an ancient portal that reveals humanity's true origin among the stars",
  "style": "cinematic 4K, dramatic lighting, film grain"
}
EOF

node app/cli.js preproduction --input stories/first-story.json
```

### Understanding Output

After running, check the `output/` directory:

| File | Description |
|------|-------------|
| `preproduction-report.md` | Complete human-readable report with every shot |
| `prompts.json` | All prompts organized by shot with metadata |
| `render-tasks.json` | Seedance API-ready render requests |
| `quality-report.json` | Per-shot quality scores and assessments |

### Common Commands

```bash
# Run pre-production (default)
node app/cli.js preproduction --input stories/story.json

# Run with specific mode
node app/cli.js preproduction --input stories/story.json --mode commercial

# Run specific stage only
node app/cli.js preproduction --input stories/story.json --stage STAGE-5

# Dry run (no actual LLM calls)
node app/cli.js preproduction --input stories/story.json --dry-run

# Verbose logging
node app/cli.js preproduction --input stories/story.json --verbose
```

---

## 6. ARCHITECTURE DEEP DIVE

### The 17 Stages

#### Pre-Production Phase

| Stage | Name | Blocking | Purpose | Timeout |
|-------|------|----------|---------|---------|
| STAGE-0 | Mock Data Cleanup | Yes | Clean test artifacts | 10s |
| STAGE-1 | PRD Central Calibration | Yes | Generate production requirements doc | 60s |
| STAGE-2 | Requirements Alignment Gate | Yes | Validate story against schema | 30s |
| STAGE-3 | Schema Validation | Yes | Validate input structure | 10s |
| STAGE-4 | Character System Loading | Yes | Load character registry & portraits | 30s |
| STAGE-5 | Script Generation & Analysis | Yes | Generate full script with story arc | 120s |
| STAGE-5.5 | FPV Shot Decision | Yes | Decide first-person view shots | 30s |
| STAGE-6 | Duration Allocation | Yes | Allocate seconds per shot | 10s |
| STAGE-7 | Storyboard Generation | Yes | Generate shot-by-shot storyboard | 120s |
| STAGE-7.2 | Protagonist Initiative Injection | No | Enhance protagonist presence | 30s |
| STAGE-7.3 | Narration Auto-Trim | No | Optimize narration length | 20s |
| STAGE-7.4 | Duration-Word Consistency | No | Ensure timing matches dialogue | 20s |
| STAGE-7.5 | Opening Title Generation | Yes | Auto-generate title sequence | 30s |
| STAGE-8 | Storyboard Validation | Yes | Validate storyboard structure | 30s |
| STAGE-8.5 | Five-Element Check | Yes | Verify core storytelling elements | 20s |

#### Production Phase

| Stage | Name | Blocking | Purpose | Timeout |
|-------|------|----------|---------|---------|
| STAGE-9 | Camera Movement System | Yes | Design cinematic camera work | 30s |
| STAGE-10 | Continuity Check | Yes | Cross-shot consistency validation | 30s |
| STAGE-10.5 | Render Pre-input Check | Yes | Validate render request safety | 10s |
| STAGE-11 | Core Rendering | Yes | Submit to Seedance API | 300s |
| STAGE-11.5 | Prompt Quality Gate | Yes | Final prompt quality check | 10s |
| STAGE-12 | Compliance Check | Yes | Standard compliance validation | 20s |
| STAGE-13 | Pre-validation | Yes | Input validation before render | 15s |
| STAGE-14 | Style Injection | Yes | Apply visual style directives | 20s |

#### Post-Production Phase

| Stage | Name | Blocking | Purpose | Timeout |
|-------|------|----------|---------|---------|
| STAGE-15 | Post-Processing Rules | Yes | Apply post-production rules | 20s |
| STAGE-16 | Director Final Optimization | No | AI director reviews and optimizes | 180s |
| STAGE-17 | Director-Scriptwriter Loop | No | Iterative refinement loop | 300s |

### Saga Pattern Implementation

Every stage is wrapped in a Saga with:

```
Stage Execution
    ├── Retry Policy (exponential backoff)
    ├── Timeout Control
    ├── Fallback Strategy
    │   ├── skip          — skip non-critical stages
    │   ├── default_value — return safe defaults
    │   └── degrade      — run simplified version
    └── Compensation
        └── Rollback changes on downstream failure
```

### 7-Layer Prompt Architecture

```
【Constraint】   → aspect ratio, no-text rules, frame rate
【Foundation】   → hyperrealistic, film grain, HDR, detail level
【Space】        → environment, scene description, atmosphere
【Subject】      → characters, clothing, expressions, poses
【Dynamic】      → camera movement, action, timing
【Style】        → color palette, director style, mood
【Audio】        → ambient sound, dialogue cues, music direction
【Quality】      → render specs, consistency markers
```

### Quality Dimensions (10)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Character Consistency | 1.0 | Character appearance match across shots |
| Scene Coherence | 0.9 | Logical scene progression |
| Camera Quality | 0.9 | Professional cinematography |
| Prompt Richness | 0.8 | Content density and detail |
| Audio Sync | 0.8 | Sound-visual alignment |
| Emotional Impact | 0.9 | Viewer emotional response |
| Style Adherence | 0.8 | Match to specified style |
| Technical Compliance | 1.0 | Passes all automated checks |
| Narrative Flow | 0.9 | Storytelling smoothness |
| Render Readiness | 1.0 | Ready for API submission |

---

## 7. API REFERENCE FOR AGENTS

### Core Module Exports

```javascript
// Main pipeline
const { runPreproduction } = require('./systems/preproduction-service');

// Individual stages
const { SagaStage, SagaOrchestrator } = require('./core/core/saga-orchestrator');
const { LLMGateway } = require('./core/core/llm-gateway');
const { EventBus } = require('./core/core/event-bus');
const { AssetManagementSystem } = require('./core/core/asset-management-system');

// Quality systems
const { RenderQualityLoop } = require('./core/core/render-quality-loop');
const { VisualConsistencyTracker } = require('./core/core/visual-consistency-tracker');

// Prompt systems
const { PromptAssemblyEngine } = require('./core/core/prompt-assembly-engine');

// Render systems
const { RenderRequestBuilder } = require('./systems/render-request-builder');
const { RenderSubmitter } = require('./systems/render-submitter');
```

### Event Types (for Agent Monitoring)

```javascript
// Pipeline lifecycle
eventBus.subscribe('pipeline.started', handler);
eventBus.subscribe('pipeline.milestone', handler);
eventBus.subscribe('pipeline.completed', handler);
eventBus.subscribe('pipeline.failed', handler);

// Stage lifecycle
eventBus.subscribe('stage.started', handler);
eventBus.subscribe('stage.completed', handler);
eventBus.subscribe('stage.failed', handler);
eventBus.subscribe('stage.compensated', handler);

// LLM events
eventBus.subscribe('llm.call.success', handler);
eventBus.subscribe('llm.call.failed', handler);

// Data mutations
eventBus.subscribe('data.mutated', handler);
eventBus.subscribe('data.validated', handler);
```

### Quality Report Format

```json
{
  "overall_score": 87,
  "grade": "A",
  "dimensions": {
    "character_consistency": { "score": 92, "weight": 1.0 },
    "scene_coherence": { "score": 85, "weight": 0.9 },
    "camera_quality": { "score": 88, "weight": 0.9 },
    "prompt_richness": { "score": 90, "weight": 0.8 },
    "audio_sync": { "score": 82, "weight": 0.8 },
    "emotional_impact": { "score": 86, "weight": 0.9 },
    "style_adherence": { "score": 91, "weight": 0.8 },
    "technical_compliance": { "score": 95, "weight": 1.0 },
    "narrative_flow": { "score": 84, "weight": 0.9 },
    "render_readiness": { "score": 93, "weight": 1.0 }
  },
  "per_shot_scores": [...],
  "auto_repair_applied": true,
  "repair_actions": [...]
}
```

---

## 8. CONTRIBUTING GUIDE

### Welcome

Thank you for your interest in Zhuoyue! This project welcomes all forms of contribution.

### How to Contribute

1. **Fork** the repository and create your branch
2. **Submit code** following our code standards
3. **Open a PR** using the PR template

### Code Standards

- Use ESLint configuration
- Function documentation uses JSDoc
- New features require tests
- All new modules default to `enabled: false`, explicitly enabled via config

### Commit Message Format

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Directory Structure

```
app/              — Application layer (CLI, commands)
config/           — Configuration (policies, stages, modes)
core/             — Core engines (pipeline, gateway, bus)
data/             — Data (characters, scenes, templates)
docs/             — Documentation
engines/          — Render/script engines
infrastructure/   — Infrastructure utilities
scripts/          — Utility scripts
skills/           — Skill matrices
systems/          — System modules (stages, quality, render)
tests/            — Test suites
utils/            — Utilities
```

### Development Setup

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/zhuoyue-video-system.git

# Create feature branch
git checkout -b feat/my-awesome-feature

# Make changes, add tests
npm test

# Submit PR with detailed description
```

---

## 9. SECURITY POLICY

### Reporting Vulnerabilities

Please report security vulnerabilities by opening a private security advisory on GitHub or emailing the maintainers.

### Security Features

- API keys stored in environment variables only
- No credentials in code or logs
- Prompt injection defenses in LLM Gateway
- JSON parsing security (prototype pollution prevention)
- Circuit breaker prevents API abuse
- Input validation at every stage boundary

---

## 10. CHANGELOG TEMPLATE

```markdown
# Changelog

## v6.6.0 — 2026-07-01

### Added
- Commercial advertising mode with 5-segment ad structure
- 4K resolution specification system
- Product-centric shot composition

### Changed
- Improved prompt assembly engine for richer output
- Enhanced director agent scoring accuracy

### Fixed
- Stage timeout handling for long-running renders
- Character consistency edge cases

## v6.5.53-l — 2026-06-29 (Current)

### Core Features
- 17-stage complete production pipeline
- Saga orchestration with compensation
- LLM Gateway with circuit breaker
- 7-layer prompt architecture
- Character 4-angle portrait system
- Director-scriptwriter optimization loop
- 10-dimension quality assessment
- Event Bus v2.0 with mutation tracking
- Asset Management System
```

---

## 11. SOCIAL MEDIA LAUNCH KIT

### Twitter/X Launch Thread

**Tweet 1 (Hook):**
```
We just open-sourced the most advanced AI video production system ever built.

17 automated stages. Cinema-grade output. Agent-native architecture.

From script to screen — fully autonomous.

Here's what Zhuoyue can do 🧵
```

**Tweet 2 (The Problem):**
```
Making AI videos today means:
• Writing prompts by trial and error
• Characters look different every shot
• No quality control
• Manual everything

Zhuoyue solves this with an industrial pipeline that automates the entire filmmaking process.
```

**Tweet 3 (The Architecture):**
```
Zhuoyue runs 17 stages across 3 phases:

Pre-Production (8 stages)
→ Script, storyboard, characters, timing

Production (6 stages)
→ Camera design, rendering, quality gates

Post-Production (3 stages)
→ Director AI review, optimization

Every stage has retry, fallback, and compensation built in.
```

**Tweet 4 (Agent-Native):**
```
Zhuoyue was built for AI agents.

• Structured JSON input/output
• MCP server included
• Quality scores for every decision
• Event bus for real-time monitoring
• Idempotent operations

Your agent can now produce professional videos programmatically.
```

**Tweet 5 (The Numbers):**
```
📊 Zhuoyue by the numbers:
• 6.2M+ characters of production code
• 206K lines across 787 files
• 17 automated stages
• 10 quality dimensions
• 7-layer prompt architecture
• 0 external runtime dependencies

Star the repo → github.com/YOUR_USERNAME/zhuoyue-video-system
```

### LinkedIn Post

```
🎬 Excited to announce that we've open-sourced Zhuoyue — an industrial-grade AI video production pipeline.

After months of development, we're releasing the complete system that powers our AI video generation workflow:

✅ 17-stage automated pipeline (pre-production → production → post-production)
✅ Saga orchestration with compensation and fallback
✅ LLM Gateway with circuit breaker pattern
✅ 10-dimension quality assessment with auto-repair
✅ Character consistency via 4-angle portrait system
✅ Agent-native API with MCP server support

The entire codebase: 6.2M characters, 206K lines, 787 files — now available under MIT license.

What makes Zhuoyue different is that it's not just a prompt wrapper. It's a complete film production system that understands storytelling, cinematography, and quality control.

Whether you're a developer building video apps, a creator scaling content production, or an AI agent looking to generate videos — Zhuoyue gives you the infrastructure.

Check it out and ⭐ if you find it useful:
🔗 github.com/YOUR_USERNAME/zhuoyue-video-system

#AIVideo #OpenSource #VideoGeneration #MachineLearning #CreativeAI
```

### Hacker News Post

```
Show HN: Zhuoyue – 17-Stage AI Video Production Pipeline (Open Source)

Zhuoyue is a complete AI video production system with 17 automated stages
spanning pre-production, production, and post-production.

Key features:
- Saga pattern orchestration with compensation
- LLM Gateway with circuit breaker
- 7-layer structured prompt architecture
- 10-dimension quality feedback loop
- Character consistency lock (4-angle portraits)
- Director AI agent for shot optimization
- Agent-native with MCP server
- 6.2M chars, 206K lines, zero external runtime deps

Built for Node.js 24+ with Seedance 2.0 video API.

Would love feedback from the community!
```

### Reddit Posts

**r/MachineLearning:**
```
[P] Zhuoyue: Open-Source 17-Stage AI Video Production Pipeline — 6.2M chars, Saga orchestration, quality feedback loops

We've open-sourced our complete AI video production system. It goes far beyond prompt engineering — it's a full film production pipeline with automated storyboarding, camera design, quality assessment, and director AI optimization.

GitHub: [link]
```

**r/LocalLLaMA:**
```
Zhuoyue: Agent-Native Video Production System — 17 stages, MCP server included, works with any OpenAI-compatible API

Zhuoyue exposes a complete video production pipeline as structured tools for AI agents. Your LLM can now produce professional videos through a 17-stage workflow with quality scoring and auto-repair.

GitHub: [link]
```

---

## 12. GITHUB REPO OPTIMIZATION

### Repository Settings Checklist

- [ ] **Repository name**: `zhuoyue-video-system`
- [ ] **Description**: "Industrial-grade AI video production pipeline — 17 automated stages from script to screen. Agent-native architecture."
- [ ] **Topics**: `ai-video`, `video-generation`, `prompt-engineering`, `seedance`, `automation`, `video-production`, `llm-pipeline`, `agent-tools`, `mcp-server`
- [ ] **Website**: Your project website or demo page
- [ ] **Social Preview**: Use `images/arch-01-system-architecture.png`
- [ ] **Default branch**: `main`
- [ ] **Releases**: Create v6.5.53-l release with release notes
- [ ] **Discussions**: Enable for community Q&A
- [ ] **Issues templates**: Bug report, Feature request, Question
- [ ] **PR template**: Include checklist
- [ ] **Actions**: CI for lint + test

### GitHub Topics (Maximum 20)

```
ai-video-generation, video-production, automated-filmmaking,
ai-video, video-pipeline, prompt-engineering, storyboard-generator,
cinematic-ai, seedance-api, video-automation, creative-ai,
llm-pipeline, agent-tools, mcp, model-context-protocol,
node-js, open-source-video, video-rendering, ai-content-creation,
filmmaking-tools
```

### Issue Templates

**Bug Report:**
```markdown
## Bug Description
<!-- Clear description of the bug -->

## Stage Affected
<!-- Which STAGE failed? -->

## Reproduction Steps
1. Input file content
2. Command run
3. Error output

## Expected vs Actual

## Environment
- Node.js version:
- Zhuoyue version:
- OS:

## Logs
<!-- Include relevant log output -->
```

**Feature Request:**
```markdown
## Feature Description
<!-- What should Zhuoyue do? -->

## Use Case
<!-- Why is this needed? -->

## Proposed Implementation
<!-- Optional: How could this work? -->

## Priority
<!-- Low / Medium / High -->
```

---

## 13. AI AGENT DISTRIBUTION STRATEGY

### Why Agent Distribution Matters

In the coming years, most software won't be used by humans directly — it will be used by AI agents. Zhuoyue is architected from the ground up for this future.

### MCP Server Deployment

**1. Official MCP Registry**

Submit Zhuoyue to:
- Anthropic MCP Directory
- Cursor MCP Marketplace
- Continue.dev Registry

**2. MCP Server Configuration**

```json
{
  "mcpServers": {
    "zhuoyue": {
      "command": "node",
      "args": ["/path/to/zhuoyue/servers/mcp-server.js"],
      "env": {
        "KIMI_API_KEY": "your-key",
        "SEEDANCE_API_KEY": "your-key"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**3. Agent Tool Descriptions**

Optimized descriptions that help AI agents understand when to use Zhuoyue:

```yaml
tools:
  zhuoyue_video_production:
    name: "Create Professional AI Video"
    description: >
      Use this tool when the user wants to create a video from a story,
      script, or concept. This runs a complete 17-stage film production
      pipeline including scriptwriting, storyboarding, character portrait
      generation, camera design, prompt engineering, and quality assessment.

      Best for: short films, advertisements, social media videos,
      concept visualization, animated stories.

      Output: Complete shot-by-shot production plan with render-ready
      prompts and quality scores.

  zhuoyue_quality_check:
    name: "Check Video Production Quality"
    description: >
      Use this tool to evaluate the quality of video prompts or
      production plans. Scores across 10 dimensions and suggests
      improvements.

      Best for: validating prompts before rendering, comparing
      production plans, identifying quality issues.
```

### AutoGPT / BabyAGI Integration

```python
# AutoGPT skill definition
SKILL_NAME = "zhuoyue_video_production"
SKILL_DESCRIPTION = """
Create professional AI videos using the Zhuoyue 17-stage pipeline.
Input: Story concept with characters, plot, and style preferences.
Output: Complete video production plan with render-ready prompts.
"""

TRIGGERS = [
    "create video",
    "make a video",
    "generate video",
    "produce video",
    "film production",
    "video from story"
]
```

### Documentation for AI Scraping

Ensure these files exist for AI crawlers:

```
ROBOTS.txt — Allow all AI crawlers
sitemap.xml — Include all documentation pages
llms.txt — Project overview for LLM context windows
llms-full.txt — Complete documentation in single file
```

**llms.txt:**
```
# Zhuoyue AI Video Generation System

> Industrial-grade AI video production — 17 automated stages, agent-native

## Docs

- [Quick Start](https://docs.zhuoyue.dev/quickstart): Get running in 5 minutes
- [Architecture](https://docs.zhuoyue.dev/architecture): Deep dive into 17 stages
- [API Reference](https://docs.zhuoyue.dev/api): Complete API for programmatic use
- [Agent Integration](https://docs.zhuoyue.dev/agents): MCP server and tool definitions

## Metas

- [GitHub](https://github.com/YOUR_USERNAME/zhuoyue-video-system)
- [License: MIT](https://github.com/YOUR_USERNAME/zhuoyue-video-system/blob/main/LICENSE)
```

---

## 14. STAR GROWTH PLAYBOOK

### Week 1: Launch Burst

**Day 1 (Launch Day):**
- [ ] Post on Hacker News ("Show HN")
- [ ] Publish Twitter/X thread (5 tweets)
- [ ] Share on LinkedIn
- [ ] Post in 5 relevant subreddits
- [ ] Email personal network

**Day 2-3:**
- [ ] Respond to ALL comments and issues within 2 hours
- [ ] Create "Getting Started" video (2 minutes)
- [ ] Pin best issue/PR to repo

**Day 4-7:**
- [ ] Write first blog post: "How Zhuoyue Works Under the Hood"
- [ ] Reach out to 10 AI YouTubers/bloggers
- [ ] Submit to newsletter directories

### Week 2-4: Sustained Growth

- [ ] Publish 2 more blog posts
- [ ] Create video tutorials (3 x 5-minute videos)
- [ ] Host community AMA
- [ ] Fix all "good first issue" bugs quickly
- [ ] Thank every contributor publicly

### Ongoing: Community Building

- [ ] Monthly release notes blog post
- [ ] Feature spotlights on Twitter
- [ ] Community showcase (best videos made with Zhuoyue)
- [ ] Contributor recognition program
- [ ] Discord/Slack community

### Growth Hacks

1. **README Badge**: "Used by X developers" — social proof
2. **Live Demo**: One-click deploy to Replit/CodeSandbox
3. **Comparison Table**: Zhuoyue vs alternatives
4. **Star History Badge**: Show growth trajectory
5. **Awesome List**: Get added to "Awesome AI Video" lists
6. **Conference Talks**: Submit to AI/dev conferences
7. **Podcast Appearances**: Tell the story behind Zhuoyue

### Metrics to Track

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-----------------|-----------------|
| GitHub Stars | 500 | 2,000 |
| Forks | 50 | 200 |
| Issues Opened | 30 | 100 |
| PRs Merged | 10 | 50 |
| Discord Members | 100 | 500 |
| Hacker News Points | 200 | - |
| Blog Post Views | 5,000 | 20,000 |

---

## APPENDIX A: FILE MANIFEST

| File | Purpose |
|------|---------|
| `images/logo.png` | Project logo (transparent, 1:1) |
| `images/arch-01-system-architecture.png` | 4-layer system architecture |
| `images/arch-02-production-pipeline.png` | 17-stage pipeline diagram |
| `images/arch-03-core-infrastructure.png` | Core infrastructure hex map |
| `images/arch-04-llm-gateway-quality-loop.png` | LLM gateway & quality loop |
| `images/arch-05-user-journey.png` | User workflow diagram |
| `docs/ZHUOYUE-OPEN-SOURCE-KIT.md` | This complete guide |

---

## APPENDIX B: PROJECT ORIGIN

> *Zhuoyue was born from a simple belief: everyone deserves to tell their stories through moving images. Not just writers with budgets, not just studios with crews — everyone.*
>
> *"卓越" means the relentless pursuit of excellence. What started as a personal project to automate video production grew into a 6-million-character industrial system over months of iteration.*
>
> *The 17-stage pipeline, the saga orchestrator, the director AI — every component was forged through real production demands, not theoretical design. Every fallback, every retry policy, every quality check exists because something broke once and we swore it would never break the same way twice.*
>
> *Today, Zhuoyue is open sourced because the future of creativity is not proprietary tools behind paywalls. It's open infrastructure that empowers agents and humans alike to harness their imagination.*
>
> *— The Zhuoyue Team*

---

*This open source kit was prepared for the Zhuoyue Master Pipeline v6.5.53-l release.*
*For questions or updates, open an issue on the GitHub repository.*

**Now go make something amazing. ⭐**
