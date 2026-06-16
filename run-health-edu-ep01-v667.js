const { NirathMasterPipeline } = require('./core/nirath-master-pipeline.js');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, 'output', 'health-edu-ep01-v667');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

async function run() {
  console.log('=== 横纹肌溶解科普视频 - v6.6.7 完整预生产 ===\n');
  
  const input = {
    title: '什么是横纹肌溶解——症状及实验室检查',
    projectName: 'health-edu-ep01',
    videoType: 'educational',
    targetDuration: 62,
    creativeIntensity: 0.8,
    style: 'realistic',
    platform: ['douyin', 'xiaohongshu'],
    aspectRatio: '9:16',
    requirementConfirmed: true,
    characters: [{
      id: 'chen-zhuo',
      name: '陈卓',
      role: '健康科普讲解员',
      appearance: '穿警服的女士',
      profession: '警方健康顾问'
    }],
    scenes: [
      {
        id: 'S01', title: '片头+开场介绍',
        description: '陈卓穿警服出镜，主标题+副标题展示，自我介绍',
        type: 'establishing', characters: ['chen-zhuo'],
        estimatedDuration: 8, hasTitleCard: true,
        dialogue: '大家好，我是陈卓。今天咱们聊聊横纹肌溶解。'
      },
      {
        id: 'S02', title: '症状讲解',
        description: '陈卓讲解横纹肌溶解的典型症状',
        type: 'monologue', characters: ['chen-zhuo'],
        estimatedDuration: 20,
        dialogue: '横纹肌溶解最典型的症状就是肌肉疼痛、无力，尿液颜色变深。'
      },
      {
        id: 'S03', title: '实验室检查指标',
        description: '讲解肌酸激酶、肌红蛋白等检查指标',
        type: 'monologue', characters: ['chen-zhuo'],
        estimatedDuration: 20,
        dialogue: '到医院检查，主要看肌酸激酶（CK）和肌红蛋白。'
      },
      {
        id: 'S04', title: '高危人群提示',
        description: '提醒哪些人群需要特别注意',
        type: 'monologue', characters: ['chen-zhuo'],
        estimatedDuration: 12,
        dialogue: '剧烈运动后、服用某些降脂药物、或者中暑的朋友，都是高危人群。'
      },
      {
        id: 'S05', title: '结尾总结',
        description: '总结要点，不预告下一集',
        type: 'closing', characters: ['chen-zhuo'],
        estimatedDuration: 8,
        dialogue: '记住，出现肌肉疼痛、酱油色尿，一定要及时就医。'
      }
    ],
    requirements: {
      creativeIntensity: 0.8,
      style: 'realistic',
      subStyle: 'hollywood-cinematic',
      duration: { min: 59, max: 65, target: 62 },
      aspectRatio: '9:16',
      hasTitleCard: true,
      noNextEpisodePreview: true
    }
  };
  
  const pipeline = new NirathMasterPipeline({
    mode: 'generic',
    projectName: input.projectName,
    outputDir: OUTPUT
  });
  
  const result = await pipeline.execute(input, { skipRequirementConfirmation: true });
  
  console.log('\n=== 预生产完成 ===');
  console.log('项目:', input.projectName);
  console.log('总分:', result.score || result.totalScore || 'N/A');
  console.log('评级:', result.grade || result.level || 'N/A');
  console.log('状态:', result.passed ? 'PASS ✅' : (result.status === 'REQUIREMENT_CONFIRMATION_REQUIRED' ? '等待确认 ⏸️' : 'FAIL ❌'));
  console.log('输出目录:', OUTPUT);
  
  // 保存完整报告
  fs.writeFileSync(
    path.join(OUTPUT, 'preproduction-report.json'),
    JSON.stringify(result, null, 2),
    'utf8'
  );
  
  return result;
}

run().catch(console.error);
