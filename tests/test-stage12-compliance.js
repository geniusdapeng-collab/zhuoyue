'use strict';

const { checkStandardCompliance } = require('../systems/prompt-standard-v3');
const { buildStandardPromptFromShot } = require('../systems/prompt-standard-bridge');
const { safeStructuredTrim } = require('../systems/safe-structured-trim');

const rawShot = {
  shotId: 'S01',
  scene: '椰树下初见',
  visualPrompt: 'Alex与Sarah在椰树下初次相遇，海风吹拂，阳光温暖，画面具有纪录片真实质感',
  action: 'Sarah低头看向Alex，Alex抬手回应，双方自然对视',
  dialogue: '你看，风来了。',
  emotionPhase: '温暖、治愈',
  cameraString: '中景稳定运镜，轻微向下摇镜',
  timelineString: '0-30% 建立环境，30-70% 人物互动，70-100% 情绪收束',
  lightingString: 'golden hour 自然光，柔和逆光勾边，明暗层次清晰',
  backgroundSoundString: '伴随海风吹拂椰树叶沙沙声，海浪轻拍沙滩，环境音自然，声画同步',
  negativePrompt: 'no text, no watermark, no subtitle, no deformed hands, no extra fingers',
  renderStyle: 'hyperrealistic cinematic quality, 35mm film grain, HDR',
  directorStyle: '通用导演风格'
};

const oldPrompt = `
16:9 cinematic, golden hour, clear sky, 婴儿，7个月男孩，女性，35岁，椰树下初见，
tilt_down, 中景居中构图，纪录片场景，伴随海风吹拂椰树叶沙沙声，海浪轻拍沙滩，
Director style: 通用导演, hyperrealistic, no text, no watermark
`.trim();

const newPrompt = safeStructuredTrim(buildStandardPromptFromShot({
  ...rawShot,
  prompt: oldPrompt
}), 1500);

const oldResult = checkStandardCompliance(oldPrompt, 'S01');
const newResult = checkStandardCompliance(newPrompt, 'S01');

console.log('================ OLD PROMPT ================');
console.log(oldPrompt);
console.log('\n旧合规结果:');
console.log(JSON.stringify(oldResult, null, 2));

console.log('\n================ NEW PROMPT ================');
console.log(newPrompt);
console.log('\n新合规结果:');
console.log(JSON.stringify(newResult, null, 2));

console.log('\n================ SUMMARY ================');
console.log(`旧 coverage: ${oldResult.coverage}%`);
console.log(`新 coverage: ${newResult.coverage}%`);

if (newResult.coverage <= oldResult.coverage) {
  console.error('❌ 合规率没有提升');
  process.exit(1);
}

if (newResult.coverage < 60) {
  console.error('❌ 合规率仍低于通过线 60%');
  process.exit(2);
}

console.log('✅ 合规率已提升，并达到基本通过线');
process.exit(0);
