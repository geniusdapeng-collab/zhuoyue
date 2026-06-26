/**
 * Pipeline Stage Extractor
 * 自动从nirath-master-pipeline.js提取Stage方法到独立模块
 * 
 * 使用方法: node extract-stages.js
 */

const fs = require('fs');
const path = require('path');

const PIPELINE_FILE = path.join(__dirname, 'core', 'nirath-master-pipeline.js');
const STAGES_DIR = path.join(__dirname, 'core', 'stages');

// Stage定义: [方法名, 阶段名, 依赖的方法列表]
const STAGE_DEFINITIONS = [
  ['stageMockCleanup', 'STAGE-0', []],
  ['stagePRD', 'STAGE-1', []],
  ['stageAlignment', 'STAGE-2', []],
  ['stageSchemaValidation', 'STAGE-3', []],
  ['stageCharacters', 'STAGE-4', []],
  ['stageScriptGeneration', 'STAGE-5', []],
  ['stageFPVDecision', 'STAGE-5.5', []],
  ['stageCharacterIntroAnalysis', 'STAGE-5.5B', []],
  ['stageDurationAllocation', 'STAGE-6', []],
  ['stageStoryboard', 'STAGE-7', []],
  ['stageProtagonistInitiative', 'STAGE-7.2', []],
  ['stageDurationNarrationAlignment', 'STAGE-7.4', []],
  ['stageNarrationTrim', 'STAGE-7.3', []],
  ['stageOpeningGeneration', 'STAGE-7.5', []],
  ['stageStoryboardValidation', 'STAGE-8', []],
  ['stageFiveElementCheck', 'STAGE-8.5', []],
  ['stageCameraMovement', 'STAGE-9', []],
  ['stageContinuity', 'STAGE-10', []],
  ['stageSafetyGate', 'STAGE-10.5', []],
  ['stageRender', 'STAGE-11', []],
  ['stagePromptQualityGate', 'STAGE-11.5', []],
  ['stageCompliance', 'STAGE-12', []],
  ['stagePreRenderValidation', 'STAGE-13', []],
  ['stageStyleInjection', 'STAGE-14', []],
  ['stagePostProduction', 'STAGE-15', []],
  ['stageFinalOutput', 'STAGE-16', []],
];

function extractMethod(content, methodName) {
  // 查找方法定义的开始
  const methodStartRegex = new RegExp(`(\\s+async ${methodName}\\()`);
  const startMatch = content.match(methodStartRegex);
  
  if (!startMatch) {
    console.warn(`方法 ${methodName} 未找到`);
    return null;
  }
  
  const startIndex = startMatch.index;
  const indent = startMatch[1].match(/^(\s*)/)[1];
  
  // 查找方法结束（下一个相同缩进的方法定义或类结束）
  // 简单策略：找到下一个async方法定义或文件结束
  const nextMethodRegex = new RegExp(`\\n${indent}async [a-zA-Z]`);
  const nextMatch = content.slice(startIndex + 1).match(nextMethodRegex);
  
  const endIndex = nextMatch 
    ? startIndex + 1 + nextMatch.index 
    : content.length;
  
  return content.slice(startIndex, endIndex).trim();
}

function createStageModule(stageDef, methodBody) {
  const [methodName, stageName, dependencies] = stageDef;
  const fileName = `${stageName.toLowerCase().replace(/\./g, '-')}-${methodName.replace(/^stage/, '').toLowerCase()}.js`;
  const filePath = path.join(STAGES_DIR, fileName);
  
  const moduleContent = `/**
 * ${stageName}: ${methodName}
 * 自动提取自 nirath-master-pipeline.js
 * 
 * 依赖: ${dependencies.join(', ') || '无'}
 */

class ${methodName.replace(/^stage/, 'Stage')} {
  constructor(pipeline) {
    this.pipeline = pipeline;
  }

${methodBody.replace(/^/gm, '  ')}
}

module.exports = { ${methodName.replace(/^stage/, 'Stage')} };
`;

  fs.writeFileSync(filePath, moduleContent);
  console.log(`✅ 已提取: ${fileName} (${methodBody.length} 字符)`);
  return fileName;
}

function main() {
  console.log('🔧 Pipeline Stage提取工具');
  console.log('==========================');
  
  if (!fs.existsSync(PIPELINE_FILE)) {
    console.error(`❌ Pipeline文件不存在: ${PIPELINE_FILE}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(PIPELINE_FILE, 'utf8');
  console.log(`📄 Pipeline文件大小: ${content.length} 字符`);
  
  // 确保目录存在
  if (!fs.existsSync(STAGES_DIR)) {
    fs.mkdirSync(STAGES_DIR, { recursive: true });
  }
  
  let extracted = 0;
  for (const stageDef of STAGE_DEFINITIONS) {
    const [methodName] = stageDef;
    const methodBody = extractMethod(content, methodName);
    
    if (methodBody) {
      createStageModule(stageDef, methodBody);
      extracted++;
    }
  }
  
  console.log('');
  console.log(`✅ 提取完成: ${extracted}/${STAGE_DEFINITIONS.length} 个Stage`);
  console.log(`📁 Stage模块目录: ${STAGES_DIR}`);
}

main();
