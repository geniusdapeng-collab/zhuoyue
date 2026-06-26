/**
 * 镜头时长分配 V3 12维度测试
 * 验证新7个维度是否正确工作
 */

const { ShotDurationAllocator } = require('./systems/shot-duration-allocator');

// 模拟商业广告大片（带完整维度信息）
const testScript = {
  totalDuration: 30,
  rhythmCurve: 'commercial_adrenaline',
  videoType: 'commercial', // 🔥 v6.8.4: 视频类型
  narrations: [
    {
      id: 'S01',
      text: '震撼开场！全新CleanMaster X5，重新定义家庭清洁',
      type: 'hook',
      importance: 9,
      visualComplexity: 5,
      // 🔥 v6.8.4: 新维度
      emotionStart: '平静',
      emotionEnd: '兴奋',
      emotionCurve: ['平静', '好奇', '兴奋'],
      visualElements: '产品特写+光效+品牌Logo',
      narrativeBeat: 'climax',
      showcaseType: 'static',
      transitionType: 'particle'
    },
    {
      id: 'S02',
      text: '你还在为地毯深处的灰尘烦恼吗？传统清洁只能表面打扫',
      type: 'problem',
      importance: 7,
      visualComplexity: 4,
      emotionStart: '烦恼',
      emotionEnd: '希望',
      visualElements: '脏地毯特写+人物烦恼表情',
      narrativeBeat: 'setup',
      showcaseType: 'multi_angle',
      transitionType: 'fade'
    },
    {
      id: 'S03',
      text: 'CleanMaster X5，5200Pa飓风吸力，LDS激光导航，智能避障，APP远程控制',
      type: 'solution',
      importance: 9,
      visualComplexity: 7,
      sellingPointType: 'function',
      sellingPointPriority: 1,
      emotionStart: '好奇',
      emotionEnd: '兴奋',
      visualElements: '产品360度旋转+功能演示+参数展示',
      narrativeBeat: 'climax',
      showcaseType: '360',
      transitionType: 'slide'
    },
    {
      id: 'S04',
      text: '德国红点设计奖，98%用户好评，全球销量第一',
      type: 'proof',
      importance: 8,
      visualComplexity: 6,
      sellingPointType: 'social_proof',
      sellingPointPriority: 2,
      emotionStart: '怀疑',
      emotionEnd: '信任',
      visualElements: '奖项展示+用户评价+销量数据',
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

console.log('🧪 测试 ShotDurationAllocator V3 - 12维度智能分配');
console.log('='.repeat(60));

const allocator = new ShotDurationAllocator();
const result = allocator.allocate(testScript);

console.log('\n📊 测试结果：');
console.log(`总镜头: ${result.summary.totalShots}`);
console.log(`总分配: ${result.summary.totalAllocated}秒 / 30秒预算`);
console.log(`平均每镜: ${result.summary.averageDuration.toFixed(1)}秒`);
console.log(`时长跨度: ${result.summary.durationRange}`);
console.log(`优化等级: ${result.optimizationLevel}`);
console.log(`验证结果: ${result.validation.valid ? '✅通过' : '❌失败'}`);

console.log('\n📋 镜头详情：');
result.shots.forEach(shot => {
  console.log(`\n${shot.id}: ${shot.duration}秒`);
  console.log(`  角色: ${shot.type} | 重要性: ${shot.importance}`);
  console.log(`  字数: ${shot.charCount} | 语音基线: ${shot.voiceBaseline}秒`);
  if (shot.optimizationLogs) {
    shot.optimizationLogs.forEach(log => {
      console.log(`  ${log.id}: imp=${log.importance}, 压缩=${log.compressionRate || '无'}, 视觉+${log.visualBonus || 0}`);
    });
  }
});

if (result.warnings.length > 0) {
  console.log('\n⚠️ 警告：');
  result.warnings.forEach(w => console.log(`  - ${w}`));
}

console.log('\n' + '='.repeat(60));
console.log('✅ V3 12维度测试完成！');
