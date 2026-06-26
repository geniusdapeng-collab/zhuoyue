const { ShotDurationAllocator } = require('./systems/shot-duration-allocator');

console.log('🎬 商业广告大片时长分配系统测试 (v6.8.3升级)');
console.log('══════════════════════════════════════════════════════════');

// 1. 测试商业广告五段式结构
console.log('\n【测试1】商业广告五段式 - 肾上腺素式节奏');
console.log('─────────────────────────────────────────────────────');

const commercialScript = {
  totalDuration: 30,
  rhythmCurve: 'commercial_adrenaline',
  narrations: [
    {
      id: 'S01',
      text: '你的地板真的干净吗？',
      type: 'hook',
      importance: 9,
      sellingPointType: 'emotion',
      sellingPointPriority: 2,
      visualComplexity: 5
    },
    {
      id: 'S02',
      text: '传统扫地机器人总是撞墙、卡死、漏扫',
      type: 'problem',
      importance: 7,
      sellingPointType: 'social_proof',
      sellingPointPriority: 3,
      visualComplexity: 4
    },
    {
      id: 'S03',
      text: 'CleanMaster X5，AI智能避障，识别100种障碍物',
      type: 'solution',
      importance: 9,
      sellingPointType: 'function',
      sellingPointPriority: 1,
      visualComplexity: 8
    },
    {
      id: 'S04',
      text: 'LDS激光导航，建图精度正负2厘米',
      type: 'solution',
      importance: 9,
      sellingPointType: 'tech',
      sellingPointPriority: 1,
      visualComplexity: 7
    },
    {
      id: 'S05',
      text: '5200Pa飓风吸力，地毯深层灰尘无处遁形',
      type: 'solution',
      importance: 9,
      sellingPointType: 'usp',
      sellingPointPriority: 1,
      visualComplexity: 8
    },
    {
      id: 'S06',
      text: '10万家庭的选择，好评率99.2%',
      type: 'proof',
      importance: 8,
      sellingPointType: 'social_proof',
      sellingPointPriority: 3,
      visualComplexity: 5
    },
    {
      id: 'S07',
      text: '限时特惠，下单立减500元',
      type: 'cta',
      importance: 10,
      sellingPointType: 'price',
      sellingPointPriority: 2,
      visualComplexity: 4
    }
  ]
};

const allocator = new ShotDurationAllocator();
const result = allocator.allocate(commercialScript);

console.log('\n📊 测试1结果分析:');
console.log(`总时长: ${result.summary.totalAllocated}秒 / ${commercialScript.totalDuration}秒预算`);
console.log(`镜头数: ${result.summary.totalShots}`);
console.log(`平均时长: ${result.summary.averageDuration.toFixed(1)}秒`);
console.log(`时长跨度: ${result.summary.minDuration}-${result.summary.maxDuration}秒`);
console.log(`节奏曲线: ${result.shots[0]?.rhythmPosition ? '已应用' : '未应用'}`);

// 验证非平均分配
const durations = result.shots.map(s => s.duration);
const maxDiff = Math.max(...durations) - Math.min(...durations);
console.log(`最大时长差: ${maxDiff}秒 ${maxDiff > 0 ? '✅ (非平均分配)' : '❌ (平均分配)'}`);

// 验证高权重卖点获得更多时长
const functionShots = result.shots.filter(s => 
  s.optimizationLogs?.some(l => l.id.includes('S03') || l.id.includes('S04') || l.id.includes('S05'))
);
const emotionShots = result.shots.filter(s => 
  s.optimizationLogs?.some(l => l.id.includes('S01'))
);

if (functionShots.length > 0 && emotionShots.length > 0) {
  const avgFunction = functionShots.reduce((sum, s) => sum + s.duration, 0) / functionShots.length;
  const avgEmotion = emotionShots.reduce((sum, s) => sum + s.duration, 0) / emotionShots.length;
  console.log(`\n卖点权重验证:`);
  console.log(`  功能/USP/技术类平均时长: ${avgFunction.toFixed(1)}秒`);
  console.log(`  情感类平均时长: ${avgEmotion.toFixed(1)}秒`);
  console.log(`  ${avgFunction > avgEmotion ? '✅' : '❌'} 高权重卖点获得更多时长`);
}

// 2. 测试不同节奏曲线对比
console.log('\n【测试2】同一片段，不同节奏曲线对比');
console.log('─────────────────────────────────────────────────────');

const curves = ['commercial_adrenaline', 'commercial_suspense', 'commercial_contrast', 'commercial_progressive'];
const results = {};

curves.forEach(curve => {
  const script = { ...commercialScript, rhythmCurve: curve };
  const r = allocator.allocate(script);
  results[curve] = r;
  const durations = r.shots.map(s => s.duration);
  console.log(`${curve}:`);
  console.log(`  总时长: ${r.summary.totalAllocated}秒 | 镜头: ${r.summary.totalShots} | 跨度: ${r.summary.minDuration}-${r.summary.maxDuration}秒`);
  console.log(`  时长序列: [${durations.join(', ')}]`);
});

// 3. 测试与传统模式的对比
console.log('\n【测试3】商业广告模式 vs 传统教育模式');
console.log('─────────────────────────────────────────────────────');

// 传统教育模式
const eduScript = {
  totalDuration: 30,
  rhythmCurve: 'classic',
  narrations: [
    { id: 'S01', text: '大家好，今天我们来学习...', type: 'opening', importance: 5, visualComplexity: 2 },
    { id: 'S02', text: '首先，我们来看一下定义...', type: 'definition', importance: 8, visualComplexity: 5 },
    { id: 'S03', text: '这个概念的核心原理是...', type: 'explanation', importance: 7, visualComplexity: 4 },
    { id: 'S04', text: '让我们通过一个例子来理解...', type: 'demonstration', importance: 9, visualComplexity: 8 },
    { id: 'S05', text: '总结一下，今天我们学到了...', type: 'closing', importance: 4, visualComplexity: 2 }
  ]
};

const eduResult = allocator.allocate(eduScript);
console.log(`传统教育模式 (classic):`);
console.log(`  总时长: ${eduResult.summary.totalAllocated}秒 | 镜头: ${eduResult.summary.totalShots}`);
console.log(`  时长序列: [${eduResult.shots.map(s => s.duration).join(', ')}]`);

console.log(`\n商业广告模式 (commercial_adrenaline):`);
console.log(`  总时长: ${result.summary.totalAllocated}秒 | 镜头: ${result.summary.totalShots}`);
console.log(`  时长序列: [${result.shots.map(s => s.duration).join(', ')}]`);

// 4. 测试边界情况
console.log('\n【测试4】边界情况测试');
console.log('─────────────────────────────────────────────────────');

// 4.1 内容超载
const overloadScript = {
  totalDuration: 20,
  rhythmCurve: 'commercial_adrenaline',
  narrations: Array(12).fill(null).map((_, i) => ({
    id: `S${String(i+1).padStart(2, '0')}`,
    text: '这是一个很长的文本，用来测试内容超载的情况，需要很多字才能触发',
    type: 'solution',
    importance: 8,
    sellingPointType: 'function',
    visualComplexity: 6
  }))
};

const overloadResult = allocator.allocate(overloadScript);
console.log(`内容超载测试: ${overloadResult.optimizationLevel}`);
if (overloadResult.warnings?.length > 0) {
  overloadResult.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
}

// 4.2 单镜头
const singleScript = {
  totalDuration: 30,
  rhythmCurve: 'commercial_adrenaline',
  narrations: [
    { id: 'S01', text: '只有一个镜头', type: 'hook', importance: 9, sellingPointType: 'emotion', visualComplexity: 5 }
  ]
};

const singleResult = allocator.allocate(singleScript);
console.log(`\n单镜头测试: ${singleResult.shots.length}个镜头，${singleResult.shots[0]?.duration}秒`);

console.log('\n══════════════════════════════════════════════════════════');
console.log('✅ 商业广告时长分配系统测试完成！');
console.log('🎯 核心升级:');
console.log('  • 五段式广告角色: Hook/Problem/Solution/Proof/CTA');
console.log('  • 4种商业节奏曲线: 肾上腺素式/悬念式/对比式/渐进式');
console.log('  • 卖点权重驱动: function/usp/tech > visual/price > social_proof/emotion');
console.log('  • 非平均分配: 根据内容和节奏智能分配时长');
