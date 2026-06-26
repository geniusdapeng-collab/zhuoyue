/**
 * 镜头时长分配 V3 12维度测试 - 非平均分配验证
 * 验证时长是否根据内容多少和节奏进行非平均分配
 */

const { ShotDurationAllocator } = require('./systems/shot-duration-allocator');

// 测试：不同内容复杂度的镜头应该得到不同时长
const testScript = {
  totalDuration: 35,
  rhythmCurve: 'commercial_adrenaline',
  videoType: 'commercial',
  narrations: [
    {
      id: 'S01',
      text: '震撼开场！',
      type: 'hook',
      importance: 9,
      visualComplexity: 3,
      emotionStart: '平静',
      emotionEnd: '兴奋',
      visualElements: '产品特写',
      narrativeBeat: 'climax',
      showcaseType: 'static',
      transitionType: 'particle'
    },
    {
      id: 'S02',
      text: '你还在为地毯深处的灰尘烦恼吗？传统清洁只能表面打扫，深层灰尘永远留在纤维里',
      type: 'problem',
      importance: 7,
      visualComplexity: 5,
      emotionStart: '烦恼',
      emotionEnd: '希望',
      visualElements: '脏地毯特写+人物烦恼表情+灰尘飞舞',
      narrativeBeat: 'setup',
      showcaseType: 'multi_angle',
      transitionType: 'fade'
    },
    {
      id: 'S03',
      text: 'CleanMaster X5，5200Pa飓风吸力，LDS激光导航，智能避障，APP远程控制，一键启动',
      type: 'solution',
      importance: 9,
      visualComplexity: 8,
      sellingPointType: 'function',
      sellingPointPriority: 1,
      emotionStart: '好奇',
      emotionEnd: '兴奋',
      visualElements: '产品360度旋转+功能演示+参数展示+使用场景',
      narrativeBeat: 'climax',
      showcaseType: '360',
      transitionType: 'slide'
    },
    {
      id: 'S04',
      text: '德国红点设计奖，98%用户好评，全球销量第一，值得信赖',
      type: 'proof',
      importance: 8,
      visualComplexity: 6,
      sellingPointType: 'social_proof',
      sellingPointPriority: 2,
      emotionStart: '怀疑',
      emotionEnd: '信任',
      visualElements: '奖项展示+用户评价+销量数据+品牌Logo',
      narrativeBeat: 'rising',
      showcaseType: 'static',
      transitionType: 'wipe'
    },
    {
      id: 'S05',
      text: '限时特惠，原价5999，现在只要3999！立即抢购！',
      type: 'cta',
      importance: 10,
      visualComplexity: 4,
      sellingPointType: 'price',
      sellingPointPriority: 1,
      emotionStart: '兴奋',
      emotionEnd: '狂喜',
      visualElements: '价格标签+倒计时+购买按钮',
      narrativeBeat: 'climax',
      showcaseType: 'static',
      transitionType: 'light'
    }
  ]
};

console.log('🧪 V3 12维度非平均分配验证');
console.log('='.repeat(60));

const allocator = new ShotDurationAllocator();
const result = allocator.allocate(testScript);

console.log('\n📊 核心验证指标：');
console.log(`总镜头: ${result.summary.totalShots}`);
console.log(`总分配: ${result.summary.totalAllocated}秒 / 35秒预算`);
console.log(`平均每镜: ${result.summary.averageDuration.toFixed(1)}秒`);
console.log(`时长跨度: ${result.summary.durationRange}`);
console.log(`优化等级: ${result.optimizationLevel}`);

// 非平均分配验证
const durations = result.shots.map(s => s.duration);
const max = Math.max(...durations);
const min = Math.min(...durations);
const variance = durations.reduce((sum, d) => sum + Math.pow(d - result.summary.averageDuration, 2), 0) / durations.length;
const stdDev = Math.sqrt(variance);

console.log(`\n🔍 非平均分配验证：`);
console.log(`最大时长: ${max}秒 | 最小时长: ${min}秒`);
console.log(`时长差: ${max - min}秒`);
console.log(`标准差: ${stdDev.toFixed(2)}`);
console.log(`${max - min >= 3 ? '✅' : '❌'} 非平均分配: ${max - min >= 3 ? '是' : '否'} (差值${max - min}秒，要求≥3秒)`);

console.log(`\n📋 镜头详情：`);
result.shots.forEach(shot => {
  const deviation = shot.duration - result.summary.averageDuration;
  const bar = '█'.repeat(shot.duration) + '░'.repeat(15 - shot.duration);
  console.log(`${shot.id}: ${bar} ${shot.duration}秒 (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}) | ${shot.type}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ V3 非平均分配验证完成！');
