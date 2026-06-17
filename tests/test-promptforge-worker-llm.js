'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = process.cwd();
const inputFile = path.join(root, 'tmp-promptforge-input.json');
const outputFile = path.join(root, 'tmp-promptforge-output.json');
const workerFile = path.join(root, 'core', 'promptforge-director-worker.js');

const inputData = {
  projectConfig: {
    theme: '测试主题',
    mode: 'generic'
  },
  rawReport: {
    shots: [
      {
        id: 'S01',
        scene: '医院诊室',
        visualPrompt: '一位医生在诊室中面对镜头讲解横纹肌溶解的风险',
        dialogue: '大家好，今天我们来了解横纹肌溶解。',
        emotionPhase: 'professional',
        duration: 5,
        cameraMovement: {
          description: '中景稳定构图'
        }
      }
    ]
  }
};

fs.writeFileSync(inputFile, JSON.stringify(inputData, null, 2), 'utf8');

console.log('🚀 启动 PromptForge Worker 自测...');
console.log('worker: ' + workerFile);

const child = spawn('node', [workerFile, inputFile, outputFile], {
  cwd: root,
  env: { ...process.env },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (buf) => {
  const text = buf.toString();
  stdout += text;
  process.stdout.write(text);
});

child.stderr.on('data', (buf) => {
  const text = buf.toString();
  stderr += text;
  process.stderr.write(text);
});

child.on('close', (code) => {
  console.log('\n====================');
  console.log('退出码: ' + code);
  console.log('====================');

  if (!fs.existsSync(outputFile)) {
    console.error('❌ 未生成输出文件');
    process.exit(1);
  }

  const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

  const hasLLMStartLog = stdout.includes('🤖 LLM调用开始');
  const hasLLMSuccessLog = stdout.includes('✅ LLM调用成功');
  const hasFallbackLog = stdout.includes('回退到本地合成');

  console.log('\n📊 验证结果:');
  console.log('- 检测到 LLM 调用开始日志: ' + (hasLLMStartLog ? 'YES' : 'NO'));
  console.log('- 检测到 LLM 调用成功日志: ' + (hasLLMSuccessLog ? 'YES' : 'NO'));
  console.log('- 检测到 fallback 日志: ' + (hasFallbackLog ? 'YES' : 'NO'));
  console.log('- output.success: ' + output.success);
  console.log('- output.fallbackUsed: ' + output.fallbackUsed);
  console.log('- output.fallbackCount: ' + output.fallbackCount);

  if (output.shots && output.shots[0]) {
    console.log('- finalPrompt长度: ' + (output.shots[0].finalPrompt || '').length);
    console.log('- fallbackUsed(shot): ' + output.shots[0].fallbackUsed);
    console.log('- finalPrompt预览: ' + (output.shots[0].finalPrompt || '').slice(0, 200) + '...');
  }

  if (!hasLLMStartLog) {
    console.error('\n❌ 失败：没有出现 LLM 调用日志，worker 可能根本没调到 LLM');
    process.exit(2);
  }

  if (hasFallbackLog && !hasLLMSuccessLog) {
    console.error('\n⚠️ 警告：worker 发生了 fallback，说明 LLM 仍未稳定成功');
    process.exit(3);
  }

  console.log('\n✅ Worker LLM 调用链路看起来已恢复');
  process.exit(0);
});
