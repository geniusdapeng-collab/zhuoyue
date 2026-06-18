'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKER_TIMEOUT_MS = 15 * 60 * 1000; // 15分钟
const DEFAULT_CALL_TIMEOUT_MS = 120 * 1000; // 单次LLM调用 2分钟
const DEFAULT_MAX_RETRIES = 2;

function log(...args) {
  console.log(`[PromptForgeWorker]`, ...args);
}

function logError(...args) {
  console.error(`[PromptForgeWorker][ERROR]`, ...args);
}

function safeWriteJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logError(`safeWriteJson failed: ${err.message}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCameraMovement(cm) {
  if (!cm || typeof cm !== 'object') return cm;
  if (cm.timeline && typeof cm.timeline === 'object' && cm.timeline.timeline) {
    return {
      ...cm,
      timeline: {
        ...cm.timeline.timeline,
        strategy: cm.timeline.strategy || cm.timeline.timeline.strategy,
        reasoning: cm.timeline.reasoning || cm.timeline.timeline.reasoning
      }
    };
  }
  return cm;
}

/**
 * 每次LLM调用使用独立子进程，超时可强杀
 */
async function callLLM(prompt, options = {}) {
  const {
    timeoutMs = DEFAULT_CALL_TIMEOUT_MS,
    maxTokens = 2048,
    temperature = 1,
    model = 'kimi-k2p6',
    mode = 'production',
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = 3000,
    stageLabel = 'unknown'
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const inputFile = path.join('/tmp', `llm-isolated-input-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    const outputFile = path.join('/tmp', `llm-isolated-output-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    const workerPath = path.join(__dirname, 'llm-call-isolated-worker.js');

    try {
      fs.writeFileSync(inputFile, JSON.stringify({
        prompt,
        options: {
          timeoutMs,
          maxTokens,
          temperature,
          model,
          mode
        }
      }, null, 2), 'utf8');

      const child = spawn('node', [
        '--max-old-space-size=512',
        workerPath,
        inputFile,
        outputFile
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });

      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch (_) {}
          reject(new Error(`LLM isolated call timeout after ${timeoutMs}ms | stage=${stageLabel} | attempt=${attempt}`));
        }, timeoutMs);

        timer.unref?.();

        child.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });

        child.on('close', (code, signal) => {
          clearTimeout(timer);

          if (signal === 'SIGKILL') {
            return reject(new Error(`LLM isolated worker killed by SIGKILL | stage=${stageLabel} | attempt=${attempt}`));
          }

          if (!fs.existsSync(outputFile)) {
            return reject(new Error(`LLM isolated worker missing output file | code=${code} | stderr=${stderr.slice(0, 500)}`));
          }

          try {
            const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            if (!data.success) {
              return reject(new Error(data.error || `LLM isolated worker failed | code=${code}`));
            }
            resolve(data.result);
          } catch (e) {
            reject(new Error(`LLM isolated worker output parse failed: ${e.message}`));
          }
        });
      });

      return result;
    } catch (err) {
      lastError = err;
      logError(`callLLM attempt ${attempt} failed | ${stageLabel} | ${err.message}`);
      if (attempt <= maxRetries) {
        await sleep(retryDelayMs);
      }
    } finally {
      try { if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile); } catch (_) {}
      try { if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile); } catch (_) {}
    }
  }

  throw lastError || new Error(`callLLM failed | stage=${stageLabel}`);
}

function extractContentFromLLMResult(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result.content === 'string') return result.content;
  if (typeof result.text === 'string') return result.text;
  if (result.choices?.[0]?.message?.content) return result.choices[0].message.content;
  return JSON.stringify(result);
}

function buildDirectorPrompt(rawReport, projectConfig = {}, mode = 'generic') {
  const shots = rawReport.shots || [];
  const shotSummary = shots.map(s => {
    return `- ${s.id} | scene=${s.scene || ''} | duration=${s.duration || 0}s | emotion=${s.emotionPhase || ''} | dialogue=${(s.dialogue || '').slice(0, 60)}`;
  }).join('\n');

  return `
你是短视频总导演。请对以下镜头集合做导演级整体编排建议。
目标：
1. 统一风格
2. 明确情绪推进
3. 指出需要强化的镜头重点
4. 不要输出废话

模式: ${mode}
项目主题: ${projectConfig.theme || ''}
标题: ${projectConfig.title || projectConfig.projectName || ''}

镜头列表:
${shotSummary}

请输出 JSON：
{
  "overallDirection": "一句话总方向",
  "styleGuide": "整体风格",
  "emotionArc": "整体情绪弧线",
  "shotNotes": [
    {
      "id": "S01",
      "note": "该镜头导演建议"
    }
  ]
}
`.trim();
}

function buildScreenwriterPrompt(shot, directorResult, mode = 'generic') {
  const note = (directorResult.shotNotes || []).find(x => x.id === shot.id)?.note || '';
  return `
你是编剧优化器。请只优化当前镜头的台词/叙事表达，不要改镜头编号。

模式: ${mode}
镜头ID: ${shot.id}
场景: ${shot.scene || ''}
时长: ${shot.duration || 0}s
情绪: ${shot.emotionPhase || ''}
原台词: ${shot.dialogue || ''}
导演建议: ${note}

要求：
1. 台词更自然、更有画面感
2. 不要空话
3. 不要输出解释
4. 只输出 JSON

格式：
{
  "id": "${shot.id}",
  "dialogue": "优化后的台词",
  "dialogueDepth": "L0/L1/L2/L3",
  "emotionArc": ["情绪1", "情绪2"]
}
`.trim();
}

function buildCinematographerPrompt(shot, directorResult, mode = 'generic') {
  const note = (directorResult.shotNotes || []).find(x => x.id === shot.id)?.note || '';
  return `
你是摄影指导。请只为当前镜头输出运镜与光影建议。

模式: ${mode}
镜头ID: ${shot.id}
场景: ${shot.scene || ''}
时长: ${shot.duration || 0}s
情绪: ${shot.emotionPhase || ''}
原Prompt: ${(shot.prompt || '').slice(0, 1000)}
导演建议: ${note}
运镜输入: ${JSON.stringify(cleanCameraMovement(shot.cameraMovement) || {})}

要求：
1. 强化镜头语言
2. 强化光影层次
3. 不要空话
4. 只输出 JSON

格式：
{
  "id": "${shot.id}",
  "cameraDesign": "运镜设计",
  "lightingDesign": "光影设计",
  "visualElements": "关键视觉元素",
  "performance": "表演/状态建议"
}
`.trim();
}

function buildComposerPrompt(shot, directorResult, screenwriterResult, cinematographerResult, mode = 'generic') {
  return `
你是最终提示词合成师。请把以下信息合成为最终 Prompt。

模式: ${mode}
镜头ID: ${shot.id}
场景: ${shot.scene || ''}
时长: ${shot.duration || 0}s
原始Prompt: ${(shot.prompt || '').slice(0, 1200)}
优化台词: ${screenwriterResult?.dialogue || shot.dialogue || ''}
运镜设计: ${cinematographerResult?.cameraDesign || ''}
光影设计: ${cinematographerResult?.lightingDesign || ''}
视觉元素: ${cinematographerResult?.visualElements || ''}
表演建议: ${cinematographerResult?.performance || ''}

要求：
1. 输出单条最终 Prompt
2. 保留结构化块格式，优先使用：
   【视觉】【动态】【空间】【情绪】【镜头时间轴】【照明】【环境音效】【渲染】【导演】
3. 长度控制在 1500 字符内
4. 只输出 JSON

格式：
{
  "id": "${shot.id}",
  "finalPrompt": "最终Prompt"
}
`.trim();
}

function safeParseJSON(text, fallback = null) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (_) {}

  const match = String(text).match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }
  return fallback;
}

async function runDirectorStage(rawReport, projectConfig, mode) {
  log(`Stage 1 Director start`);
  const prompt = buildDirectorPrompt(rawReport, projectConfig, mode);
  const result = await callLLM(prompt, {
    timeoutMs: DEFAULT_CALL_TIMEOUT_MS,
    maxTokens: 2500,
    stageLabel: 'Stage-1-Director',
    mode
  });
  const parsed = safeParseJSON(extractContentFromLLMResult(result), {
    overallDirection: '',
    styleGuide: '',
    emotionArc: '',
    shotNotes: []
  });
  log(`Stage 1 Director done | prompt=${prompt.length} chars`);
  return parsed;
}

async function runScreenwriterStage(shots, directorResult, mode) {
  log(`Stage 2a Screenwriter start | shots=${shots.length}`);
  const results = [];

  for (const shot of shots) {
    const label = `Stage-2a-${shot.id}`;
    log(`${label} start`);
    const prompt = buildScreenwriterPrompt(shot, directorResult, mode);
    const llmResult = await callLLM(prompt, {
      timeoutMs: DEFAULT_CALL_TIMEOUT_MS,
      maxTokens: 1800,
      stageLabel: label,
      mode
    });
    const parsed = safeParseJSON(extractContentFromLLMResult(llmResult), {
      id: shot.id,
      dialogue: shot.dialogue || '',
      dialogueDepth: 'L0',
      emotionArc: []
    });
    results.push(parsed);
    log(`${label} done`);
  }

  return results;
}

async function runCinematographerStage(shots, directorResult, mode) {
  log(`Stage 2b Cinematographer start | shots=${shots.length}`);
  const results = [];

  for (const shot of shots) {
    const label = `Stage-2b-${shot.id}`;
    log(`${label} start`);
    const prompt = buildCinematographerPrompt(shot, directorResult, mode);
    const llmResult = await callLLM(prompt, {
      timeoutMs: DEFAULT_CALL_TIMEOUT_MS,
      maxTokens: 1800,
      stageLabel: label,
      mode
    });
    const parsed = safeParseJSON(extractContentFromLLMResult(llmResult), {
      id: shot.id,
      cameraDesign: '',
      lightingDesign: '',
      visualElements: '',
      performance: ''
    });
    results.push(parsed);
    log(`${label} done`);
  }

  return results;
}

async function runComposerStage(shots, directorResult, screenwriterResults, cinematographerResults, mode) {
  log(`Stage 3 Composer start | shots=${shots.length}`);
  const results = [];

  for (const shot of shots) {
    const label = `Stage-3-${shot.id}`;
    log(`${label} start`);

    const sw = screenwriterResults.find(x => x.id === shot.id) || null;
    const cam = cinematographerResults.find(x => x.id === shot.id) || null;

    const prompt = buildComposerPrompt(shot, directorResult, sw, cam, mode);
    const llmResult = await callLLM(prompt, {
      timeoutMs: DEFAULT_CALL_TIMEOUT_MS,
      maxTokens: 2500,
      stageLabel: label,
      mode
    });

    const parsed = safeParseJSON(extractContentFromLLMResult(llmResult), {
      id: shot.id,
      finalPrompt: shot.prompt || ''
    });

    results.push(parsed);
    log(`${label} done`);
  }

  return results;
}

function buildQualityReport(finalShots) {
  const details = finalShots.map(shot => {
    const prompt = cleanText(shot.finalPrompt || '');
    const structureScore =
      (prompt.includes('【视觉】') ? 1 : 0) +
      (prompt.includes('【镜头时间轴】') ? 1 : 0) +
      (prompt.includes('【照明】') ? 1 : 0);

    const lengthScore =
      prompt.length >= 900 && prompt.length <= 1500 ? 5 :
      prompt.length >= 700 ? 3 : 1;

    const cameraPassed = /【镜头时间轴】|dolly|pan|tilt|orbit|tracking/i.test(prompt);

    const totalScore = structureScore * 10 + lengthScore * 5 + (cameraPassed ? 20 : 0) + 40;

    return {
      shotId: shot.id,
      structureScore,
      lengthScore,
      cameraPassed,
      totalScore
    };
  });

  const overallScore = details.length
    ? Math.round(details.reduce((sum, d) => sum + d.totalScore, 0) / details.length)
    : 0;

  return {
    overallScore,
    overallPassed: overallScore >= 50,
    shotDetails: details
  };
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    throw new Error('Usage: node promptforge-director-worker.js <inputFile> <outputFile>');
  }

  const workerTimer = setTimeout(() => {
    logError(`⏱️ Worker全局超时(${WORKER_TIMEOUT_MS}ms)，强制退出`);
    safeWriteJson(outputFile, {
      success: false,
      error: `Worker global timeout after ${WORKER_TIMEOUT_MS}ms`
    });
    process.exit(1);
  }, WORKER_TIMEOUT_MS);
  workerTimer.unref?.();

  // v6.6.9.4-patch21: 心跳机制 - 定期输出进度，防止父进程误判卡死
  const heartbeatInterval = setInterval(() => {
    log(`PROMPTFORGE_HEARTBEAT | alive | memory=${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  }, 30000); // 每30秒心跳一次

  const input = readJson(inputFile);
  const rawReport = input.rawReport || { shots: [] };
  const projectConfig = input.projectConfig || {};
  const mode = input.mode || 'generic';

  log(`Worker start | mode=${mode} | input=${inputFile}`);

  // 关键修复：跳过 S00 / opening
  const allShots = Array.isArray(rawReport.shots) ? rawReport.shots : [];
  const shots = allShots.filter(s => {
    const id = s.id || s.shotId;
    return id !== 'S00' && s.type !== 'opening' && !s.isOpening;
  });

  log(`Input shots: total=${allShots.length}, processable=${shots.length}, skipped=${allShots.length - shots.length}`);

  // v6.6.9.4-patch21: 进度落盘函数
  const progressFile = outputFile.replace('.json', '-progress.json');
  const saveProgress = (stage, data) => {
    safeWriteJson(progressFile, {
      stage,
      timestamp: Date.now(),
      shotsProcessed: data?.length || 0,
      ...data
    });
    log(`PROMPTFORGE_PROGRESS | stage=${stage} | shots=${data?.length || 0}`);
  };

  try {
    const directorResult = await runDirectorStage({ shots }, projectConfig, mode);
    saveProgress('director', { shots: directorResult?.length || 0 });
    
    const screenwriterResults = await runScreenwriterStage(shots, directorResult, mode);
    saveProgress('screenwriter', { shots: screenwriterResults?.length || 0 });
    
    const cinematographerResults = await runCinematographerStage(shots, directorResult, mode);
    saveProgress('cinematographer', { shots: cinematographerResults?.length || 0 });
    
    const composedResults = await runComposerStage(shots, directorResult, screenwriterResults, cinematographerResults, mode);
    saveProgress('composer', { shots: composedResults?.length || 0 });

    const finalShots = shots.map(shot => {
      const composed = composedResults.find(x => x.id === shot.id);
      return {
        id: shot.id,
        finalPrompt: cleanText(composed?.finalPrompt || shot.prompt || ''),
        dialogue: (screenwriterResults.find(x => x.id === shot.id)?.dialogue) || shot.dialogue || '',
        cameraDesign: (cinematographerResults.find(x => x.id === shot.id)?.cameraDesign) || '',
        lightingDesign: (cinematographerResults.find(x => x.id === shot.id)?.lightingDesign) || ''
      };
    });

    const qualityReport = buildQualityReport(finalShots);

    safeWriteJson(outputFile, {
      success: true,
      shots: finalShots,
      qualityReport,
      meta: {
        totalShots: finalShots.length,
        skippedOpening: allShots.length - finalShots.length,
        mode
      }
    });

    clearTimeout(workerTimer);
    clearInterval(heartbeatInterval); // v6.6.9.4-patch21: 清理心跳
    log(`Worker completed | shots=${finalShots.length} | quality=${qualityReport.overallScore}`);
    process.exit(0);
  } catch (err) {
    clearTimeout(workerTimer);
    clearInterval(heartbeatInterval); // v6.6.9.4-patch21: 清理心跳
    logError(`Worker failed: ${err.message}`);
    safeWriteJson(outputFile, {
      success: false,
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
}

main().catch((err) => {
  logError(`Fatal: ${err.message}`);
  process.exit(1);
});
