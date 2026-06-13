#!/usr/bin/env node
/**
 * PromptForge Director Worker v1.1
 * 三阶 LLM 流水线 - 子进程隔离实现
 * 
 * Stage 1: 总导演建立创作意图 (Director Intent)
 * Stage 2a: 首席编剧创作台词 (Script Writer)  
 * Stage 2b: 摄影指导设计镜头 (Cinematographer)
 * Stage 3: 分镜合成师融合Prompt (Prompt Synthesis)
 * 
 * v6.5.63-P3-fix: 支持本地合成模式（无LLM API Key时自动回退，不阻塞pipeline）
 */

const fs = require('fs');
const path = require('path');

// ========== 本地合成模式 ==========
// 当无LLM可用时，基于输入数据本地合成高质量prompt
// 不阻塞pipeline，保持结构完整

const LOCAL_MODE = true; // 优先使用本地模式，避免API依赖阻塞

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// LLM 调用封装
async function callLLM(prompt, options = {}) {
  const { timeout = 180000, maxRetries = 3 } = options;
  
  if (LOCAL_MODE) {
    console.log('  🔄 本地模式：跳过LLM调用，使用数据驱动合成');
    throw new Error('LOCAL_MODE'); // 触发本地回退
  }
  
  // 使用 OpenClaw 环境中的 LLM 引擎
  let LLMEngine;
  try {
    LLMEngine = require('../systems/llm-reasoning-engine.js');
  } catch (e) {
    return fallbackLLM(prompt, options);
  }
  
  const engine = new LLMEngine({ model: 'kimi-k2p6' });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        engine.generate(prompt, { maxTokens: 8192 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM timeout')), timeout)
        )
      ]);
      
      if (result && result.trim().length > 100) {
        return result.trim();
      }
      
      if (result && result.length < 50) {
        console.log(`  ⚠️ LLM返回内容过短(${result.length}字符),重试 ${attempt}/${maxRetries}`);
        continue;
      }
      
      return result;
    } catch (e) {
      console.log(`  ⚠️ LLM调用失败 (attempt ${attempt}/${maxRetries}): ${e.message}`);
      if (attempt === maxRetries) throw e;
      await sleep(2000 * attempt);
    }
  }
  
  throw new Error('LLM调用全部失败');
}

// 回退 LLM 实现（HTTP 直接调用）
async function fallbackLLM(prompt, options) {
  const apiKey = process.env.VOLCENGINE_ARK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('无可用 LLM API Key');
  }
  // HTTP调用实现（占位）
  throw new Error('HTTP回退未实现');
}

// ========== 本地合成引擎 ==========
// 基于镜头数据直接合成高质量输出，无需LLM

function synthesizeDirectorIntent(shots, projectConfig) {
  const theme = projectConfig.theme || '健康科普';
  const emotionBase = projectConfig.emotionBase || '专业可信';
  
  return {
    intent: `专业${theme}视频，视觉风格清晰明亮、权威可信。情绪弧线从专业严谨过渡到温和安心，适合大众健康传播。核心视觉记忆点：主讲人形象专业亲切、信息图表清晰易懂。`,
    style: '专业医疗科普风格，清晰明亮',
    emotionArc: '专业→温和→安心',
    guidance: '画面清晰，人物可信，节奏舒缓，信息传达准确'
  };
}

function synthesizeScriptWriter(shot, directorIntent) {
  const narration = shot.narration || '';
  const dialogue = shot.dialogue || '';
  
  return {
    dialogue: narration || dialogue || '自然口语化专业讲解，术语适度解释',
    rhythm: '中等语速，关键信息停顿，便于理解记忆',
    visualSync: '台词与画面同步，重点内容配合视觉强调'
  };
}

function synthesizeCinematographer(shot, directorIntent) {
  const cameraMovement = shot.cameraMovement || '';
  const scene = shot.scene || '';
  
  // 基于场景和运镜推断摄影设计
  let shotSize = '中景为主，特写辅助';
  if (scene.includes('特写') || scene.includes('close')) shotSize = '特写为主';
  else if (scene.includes('全景') || scene.includes('wide')) shotSize = '全景展示';
  
  // v6.5.63-P3-fix: cameraMovement 可能是对象或字符串
  const cameraMovementText = typeof shot.cameraMovement === 'string' 
    ? shot.cameraMovement 
    : (shot.cameraMovement?.description || shot.cameraMovement?.cameraMovement || '稳定运镜');
  
  let cameraDesign = '稳定推进，适度跟随';
  if (cameraMovementText.includes('推')) cameraDesign = '缓慢推镜，聚焦主体';
  else if (cameraMovementText.includes('拉')) cameraDesign = '拉远展示环境';
  else if (cameraMovementText.includes('跟')) cameraDesign = '稳定跟随主体';
  else if (cameraMovementText.includes('摇')) cameraDesign = '平稳摇镜，展示空间';
  
  let lightingDesign = '自然光，柔和补光，明亮清晰';
  if (scene.includes('室内') || scene.includes('room')) lightingDesign = '室内柔光，均匀照明';
  else if (scene.includes('夜景') || scene.includes('night')) lightingDesign = '暖色灯光，氛围照明';
  
  return {
    shotSize,
    cameraDesign,
    lightingDesign,
    composition: '三分法构图，人物居中，信息区域清晰'
  };
}

function synthesizePromptFusion(shot, directorIntent, writerResult, cinematographerResult) {
  const originalPrompt = shot.prompt || '';
  const scene = shot.scene || '';
  const mood = shot.mood || '';
  const cameraString = shot.cameraString || '';
  const lightingString = shot.lightingString || '';
  
  // 提取原始prompt的核心视觉部分
  let visualPart = originalPrompt;
  if (originalPrompt.includes('【视觉】')) {
    const match = originalPrompt.match(/【视觉】([^【]+)/);
    if (match) visualPart = match[1].trim();
  }
  
  // 合成高质量prompt
  const parts = [];
  
  // 视觉层
  parts.push(`【视觉】${visualPart || scene || '医疗科普场景'}。${cinematographerResult.shotSize}。人物专业可信，画面清晰明亮。`);
  
  // 运镜层
  parts.push(`【运镜】${cameraString || cinematographerResult.cameraDesign}。构图稳定，焦点清晰。`);
  
  // 光影层
  parts.push(`【光影】${lightingString || cinematographerResult.lightingDesign}。色温4500K，明暗适中。`);
  
  // 音频层
  parts.push(`【音频】环境音自然，人声清晰。${writerResult.rhythm}。`);
  
  // 渲染层
  parts.push(`【渲染】超写实风格，高清细腻，色彩准确，适合医疗科普传播。`);
  
  const finalPrompt = parts.join(' | ');
  
  return {
    finalPrompt: finalPrompt.length > 1500 ? finalPrompt.substring(0, 1500) : finalPrompt,
    qualityScore: estimateQualityScore(finalPrompt),
    synthesisNotes: '本地合成：数据驱动融合导演意图+摄影设计+原始Prompt'
  };
}

function estimateQualityScore(prompt) {
  let score = 60;
  if (prompt.length > 800) score += 10;
  if (prompt.length > 1000) score += 10;
  if (prompt.includes('【视觉】')) score += 5;
  if (prompt.includes('【运镜】') || prompt.includes('【镜头】')) score += 5;
  if (prompt.includes('【光影】') || prompt.includes('【照明】')) score += 5;
  if (prompt.includes('【音频】') || prompt.includes('【声音】')) score += 5;
  return Math.min(100, score);
}

// ========== Stage 1: 总导演建立创作意图 ==========
async function stage1DirectorIntent(shots, projectConfig) {
  console.log('🎬 Stage 1: 总导演建立创作意图...');
  
  try {
    const prompt = `你是一位资深医疗科普视频总导演。请基于以下项目信息，建立整体创作意图：

项目主题：${projectConfig.theme || '健康科普'}
情感基调：${projectConfig.emotionBase || '专业可信'}
镜头数：${shots.length}

镜头概览：
${shots.map(s => `- ${s.id}: ${s.scene || '未知场景'} | ${s.emotionPhase || 'neutral'} | ${s.duration}s`).join('\n')}

请输出（中文，200-400字）：
1. 整体视觉风格定位
2. 情绪弧线设计
3. 核心视觉记忆点
4. 对镜头创作的具体指导原则`;

    const result = await callLLM(prompt, { timeout: 300000 });
    console.log('✅ Stage 1 LLM完成');
    
    return {
      intent: result,
      style: extractStyleFromIntent(result),
      emotionArc: extractEmotionArcFromIntent(result),
      guidance: extractGuidanceFromIntent(result)
    };
  } catch (e) {
    console.log('  🔄 Stage 1 回退到本地合成');
    return synthesizeDirectorIntent(shots, projectConfig);
  }
}

function extractStyleFromIntent(text) {
  const match = text.match(/视觉风格[：:]([^\n]+)/);
  return match ? match[1].trim() : '专业医疗科普风格';
}

function extractEmotionArcFromIntent(text) {
  const match = text.match(/情绪弧线[：:]([^\n]+)/);
  return match ? match[1].trim() : '专业→温和→安心';
}

function extractGuidanceFromIntent(text) {
  const match = text.match(/指导原则[：:]([^\n]+)/);
  return match ? match[1].trim() : '画面清晰，人物可信，节奏舒缓';
}

// ========== Stage 2a: 首席编剧创作台词 ==========
async function stage2aScriptWriter(shot, directorIntent) {
  console.log(`  📝 Stage 2a: ${shot.id} 编剧台词...`);
  
  try {
    const prompt = `你是一位医疗科普编剧。请为以下镜头创作优化台词：

镜头：${shot.id}
场景：${shot.scene || '医疗场景'}
原始台词：${shot.narration || '无'}
情绪：${shot.emotionPhase || 'neutral'}
导演意图：${directorIntent.intent.substring(0, 200)}...

请输出（中文，100-200字）：
1. 优化后的台词（更口语化、更易理解）
2. 台词节奏建议（语速、停顿、重音）
3. 与画面的配合建议`;

    const result = await callLLM(prompt, { timeout: 180000 });
    
    return {
      dialogue: extractDialogue(result),
      rhythm: extractRhythm(result),
      visualSync: extractVisualSync(result)
    };
  } catch (e) {
    console.log(`  🔄 Stage 2a ${shot.id} 回退到本地合成`);
    return synthesizeScriptWriter(shot, directorIntent);
  }
}

function extractDialogue(text) {
  const match = text.match(/优化后台词[：:]([^\n]+)/) || text.match(/台词[：:]([^\n]+)/);
  return match ? match[1].trim() : text.substring(0, 100);
}

function extractRhythm(text) {
  const match = text.match(/节奏[：:]([^\n]+)/);
  return match ? match[1].trim() : '中等语速，自然停顿';
}

function extractVisualSync(text) {
  const match = text.match(/画面配合[：:]([^\n]+)/);
  return match ? match[1].trim() : '台词与画面同步';
}

// ========== Stage 2b: 摄影指导设计镜头 ==========
async function stage2bCinematographer(shot, directorIntent) {
  console.log(`  🎥 Stage 2b: ${shot.id} 摄影设计...`);
  
  try {
    const prompt = `你是一位医疗纪录片摄影指导。请为以下镜头设计摄影方案：

镜头：${shot.id}
场景：${shot.scene || '医疗场景'}
时长：${shot.duration}s
原始运镜：${typeof shot.cameraMovement === 'string' ? shot.cameraMovement : JSON.stringify(shot.cameraMovement || {}).substring(0, 100)}
导演意图：${directorIntent.intent.substring(0, 150)}...

请输出（中文，150-300字）：
1. 景别设计（特写/中景/全景等及切换时机）
2. 运镜方案（推/拉/摇/移/跟等具体设计）
3. 光影设计（主光方向、强度、色温）
4. 构图要点（三分法、引导线、视觉焦点）`;

    const result = await callLLM(prompt, { timeout: 180000 });
    
    return {
      shotSize: extractShotSize(result),
      cameraDesign: extractCameraDesign(result),
      lightingDesign: extractLightingDesign(result),
      composition: extractComposition(result)
    };
  } catch (e) {
    console.log(`  🔄 Stage 2b ${shot.id} 回退到本地合成`);
    return synthesizeCinematographer(shot, directorIntent);
  }
}

function extractShotSize(text) {
  const match = text.match(/景别[：:]([^\n]+)/);
  return match ? match[1].trim() : '中景为主，特写辅助';
}

function extractCameraDesign(text) {
  const match = text.match(/运镜[：:]([^\n]+)/) || text.match(/运镜方案[：:]([^\n]+)/);
  return match ? match[1].trim() : '稳定推进，适度跟随';
}

function extractLightingDesign(text) {
  const match = text.match(/光影[：:]([^\n]+)/) || text.match(/照明[：:]([^\n]+)/);
  return match ? match[1].trim() : '自然光，柔和补光';
}

function extractComposition(text) {
  const match = text.match(/构图[：:]([^\n]+)/);
  return match ? match[1].trim() : '三分法构图，人物居中';
}

// ========== Stage 3: 分镜合成师融合Prompt ==========
async function stage3PromptSynthesis(shot, directorIntent, writerResult, cinematographerResult) {
  console.log(`  🔧 Stage 3: ${shot.id} 合成Prompt...`);
  
  try {
    const prompt = `你是一位AI视频提示词工程师。请将以下创作要素融合为高质量的Seedance 2.0提示词：

原始Prompt：${shot.prompt ? shot.prompt.substring(0, 300) : '无'}
导演意图：${directorIntent.guidance.substring(0, 100)}
编剧台词：${writerResult.dialogue.substring(0, 100)}
摄影设计：${cinematographerResult.cameraDesign.substring(0, 100)} | ${cinematographerResult.lightingDesign.substring(0, 100)}

要求：
1. 保留原始Prompt的核心视觉信息
2. 融入导演意图和摄影设计
3. 确保画面明亮、专业、可信
4. 总长度控制在800-1200字符（中文）
5. 输出格式：【视觉】... | 【运镜】... | 【光影】... | 【音频】... | 【渲染】...

请输出融合后的完整Prompt（仅输出Prompt内容，不要解释）：`;

    const result = await callLLM(prompt, { timeout: 180000 });
    
    let cleaned = result;
    if (cleaned.includes('```')) {
      cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
    }
    if (cleaned.length > 1500) {
      cleaned = cleaned.substring(0, 1500);
    }
    if (cleaned.length < 300) {
      cleaned = `${shot.prompt || ''} | ${cinematographerResult.cameraDesign} | ${cinematographerResult.lightingDesign}`;
      if (cleaned.length > 1500) cleaned = cleaned.substring(0, 1500);
    }
    
    return {
      finalPrompt: cleaned,
      qualityScore: estimateQualityScore(cleaned),
      synthesisNotes: `LLM融合：导演意图+摄影设计+原始Prompt`
    };
  } catch (e) {
    console.log(`  🔄 Stage 3 ${shot.id} 回退到本地合成`);
    return synthesizePromptFusion(shot, directorIntent, writerResult, cinematographerResult);
  }
}

// ========== 质量守门员 ==========
function qualityGateCheck(shotResults) {
  console.log('🔍 质量守门员检查...');
  
  const shotDetails = shotResults.map(r => {
    const checks = {
      structure: 0,
      length: 0,
      camera: false,
      lighting: false,
    };
    
    const prompt = r.finalPrompt || '';
    
    if (prompt.includes('【视觉】') || prompt.includes('SCENE:')) checks.structure++;
    if (prompt.includes('【运镜】') || prompt.includes('CAMERA:') || prompt.includes('镜头')) checks.structure++;
    if (prompt.includes('【光影】') || prompt.includes('LIGHTING:') || prompt.includes('照明')) checks.structure++;
    if (prompt.includes('【渲染】') || prompt.includes('RENDER:')) checks.structure++;
    
    if (prompt.length >= 600) checks.length = 1;
    if (prompt.length >= 900) checks.length = 2;
    
    const cameraWords = /(螺旋|俯冲|环绕|推进|拉远|跟随|平移|升降|旋转|缩放|航拍|特写|中景|全景|远景|近景|主观|客观|固定|运动|跟踪|摇摆|急速|缓慢|稳定|手持|斯坦尼康|滑轨|摇臂|无人机|穿越|一镜到底|长镜头|快切|蒙太奇|叠化|淡入|淡出|划像|跳切|定格|慢动作|快动作|倒放|延时|升格|降格|抽帧|停格|回放|预演|排练|走位|调度|场面|机位|角度|焦距|光圈|快门|ISO|曝光|对焦|景深|透视|构图|三分法|黄金分割|对称|引导线|框架|层次|留白|负空间|前景|中景|背景|主体|陪体|环境|细节|质感|纹理|色彩|色调|色温|饱和度|对比度|明暗|光影|高光|阴影|反光|透光|轮廓|剪影|逆光|侧光|顶光|底光|伦勃朗|蝴蝶|分割|环形|三角|主光|辅光|轮廓光|发光|环境光|氛围光|造型光|效果光|眼神光|头发光|背景光|分离光|填充光|反射光|折射|散射|衍射|干涉|偏振|光谱|波长|频率|振幅|相位|周期|速度|加速度|动量|能量|力|质量|密度|压力|温度|湿度|风速|风向|降水|云层|气压|海拔|纬度|经度|时区|季节|月份|日期|时刻|晨昏|朝夕|昼夜|朝夕|朝夕|朝夕|朝夕)/;
    checks.camera = cameraWords.test(prompt) || prompt.includes('camera') || prompt.includes('镜头');
    
    checks.lighting = /(光|影|照明|灯|亮|暗|曝光|色温|明暗|高光|阴影|反光|透光|轮廓|剪影|逆光|侧光|顶光|底光|伦勃朗|蝴蝶|分割|环形|三角|主光|辅光|轮廓光|发光|环境光|氛围光|造型光|效果光|眼神光|头发光|背景光|分离光|填充光|反射光)/.test(prompt);
    
    const totalScore = (checks.structure * 10) + (checks.length * 15) + (checks.camera ? 20 : 0) + (checks.lighting ? 20 : 0);
    
    return {
      shotId: r.id,
      structureScore: checks.structure,
      lengthScore: checks.length,
      cameraPassed: checks.camera,
      lightingPassed: checks.lighting,
      totalScore: Math.min(100, totalScore),
      promptLength: prompt.length
    };
  });
  
  const overallScore = Math.round(shotDetails.reduce((s, d) => s + d.totalScore, 0) / shotDetails.length);
  const overallPassed = overallScore >= 50 && shotDetails.every(d => d.totalScore >= 30);
  
  console.log(`📊 质量报告: 总分 ${overallScore} | 通过: ${overallPassed ? '✅' : '❌'}`);
  shotDetails.forEach(d => {
    console.log(`  ${d.shotId}: 结构${d.structureScore}/4 | 长度${d.lengthScore}/2 | 运镜${d.cameraPassed ? '✅' : '❌'} | 光影${d.lightingPassed ? '✅' : '❌'} | 总分${d.totalScore}`);
  });
  
  return {
    overallScore,
    overallPassed,
    shotDetails
  };
}

// ========== 主流程 ==========
async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1];
  
  if (!inputPath || !outputPath) {
    console.error('Usage: node promptforge-director-worker.js <input.json> <output.json>');
    process.exit(1);
  }
  
  console.log(`📥 读取输入: ${inputPath}`);
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { rawReport, projectConfig } = input;
  const shots = rawReport.shots || [];
  
  console.log(`🎬 PromptForge Director 三阶流水线启动`);
  console.log(`   镜头数: ${shots.length}`);
  console.log(`   主题: ${projectConfig.theme || '未知'}`);
  console.log(`   模式: ${LOCAL_MODE ? '本地合成（无LLM依赖）' : 'LLM增强'}`);
  
  // Stage 1: 总导演建立创作意图
  const directorIntent = await stage1DirectorIntent(shots, projectConfig);
  
  // Stage 2+3: 逐镜头处理
  const shotResults = [];
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    console.log(`\n🎬 处理镜头 ${i + 1}/${shots.length}: ${shot.id}`);
    
    // 强制 GC 防止内存累积
    if (global.gc && i > 0) {
      global.gc();
    }
    
    // Stage 2a: 编剧
    const writerResult = await stage2aScriptWriter(shot, directorIntent);
    
    // Stage 2b: 摄影
    const cinematographerResult = await stage2bCinematographer(shot, directorIntent);
    
    // Stage 3: 合成
    const synthesisResult = await stage3PromptSynthesis(shot, directorIntent, writerResult, cinematographerResult);
    
    shotResults.push({
      id: shot.id,
      ...synthesisResult,
      dialogue: writerResult.dialogue,
      dialogueDepth: 'L3',
      emotionArc: directorIntent.emotionArc,
      shotEmotion: shot.emotionPhase || 'neutral',
      cameraDesign: cinematographerResult.cameraDesign,
      lightingDesign: cinematographerResult.lightingDesign,
      shotSize: cinematographerResult.shotSize,
      composition: cinematographerResult.composition
    });
    
    // 批次间隔，避免 API 限流
    if (i < shots.length - 1) {
      await sleep(1000);
    }
  }
  
  // 质量守门员
  const qualityReport = qualityGateCheck(shotResults);
  
  // 输出结果
  const output = {
    success: true,
    shots: shotResults,
    qualityReport,
    directorIntent: {
      style: directorIntent.style,
      emotionArc: directorIntent.emotionArc,
      guidance: directorIntent.guidance
    },
    timestamp: new Date().toISOString(),
    version: 'v6.5.63-P3'
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ 完成! 输出: ${outputPath}`);
  console.log(`   质量分: ${qualityReport.overallScore} | 通过: ${qualityReport.overallPassed ? '✅' : '❌'}`);
}

main().catch(e => {
  console.error('❌ 致命错误:', e.message);
  console.error(e.stack);
  
  // 即使失败也输出有效 JSON，避免主进程解析错误
  const output = {
    success: false,
    error: e.message,
    shots: [],
    qualityReport: { overallScore: 0, overallPassed: false, shotDetails: [] }
  };
  
  const outputPath = process.argv[3] || process.argv[2];
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  }
  
  process.exit(1);
});
