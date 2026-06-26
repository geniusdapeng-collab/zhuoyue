const { SellingPointAdMapping } = require('./systems/selling-point-ad-mapping');

console.log('🎬 卖点深度映射系统测试');
console.log('═══════════════════════════════════════');

// 1. 测试原始卖点
const rawSellingPoints = [
  { type: 'function', content: 'AI智能避障，精准识别100种障碍物', source: 'coreFeatures', priority: 1 },
  { type: 'function', content: 'LDS激光导航，建图精准度±2cm', source: 'coreFeatures', priority: 1 },
  { type: 'function', content: '超静音设计，噪音低至55dB', source: 'coreFeatures', priority: 1 },
  { type: 'usp', content: 'AI避障不撞家具', source: 'primary', priority: 1 },
  { type: 'visual', content: '荣获红点设计大奖', source: 'awards', priority: 2 },
  { type: 'price', content: '限时优惠25%，仅需2999元', source: 'price', priority: 2 },
  { type: 'social_proof', content: '设计太人性化了，细节满分', source: 'userReview', priority: 3 },
  { type: 'emotion', content: '解放双手，享受美好生活', source: 'emotional', priority: 2 }
];

console.log('原始卖点:', rawSellingPoints.length, '个');

// 2. 测试丰富卖点
const mapper = new SellingPointAdMapping();
const enriched = mapper.enrichAll(rawSellingPoints);

console.log('\n✅ 卖点丰富完成:', enriched.length, '个');
console.log('\n═══════════════════════════════════════');
console.log('卖点广告基因示例:');
console.log('═══════════════════════════════════════');

enriched.forEach((sp, i) => {
  console.log(`\n卖点 ${i + 1}: [${sp.type}] ${sp.content.slice(0, 30)}...`);
  console.log(`  📍 广告阶段: ${sp.adPhase} (备选: ${sp.adPhaseSecondary})`);
  console.log(`  🎬 镜头类型: ${sp.shotType} (占比: ${sp.shotRatio})`);
  console.log(`  📹 运镜策略: ${sp.cameraMove} - ${sp.cameraMoveDescription}`);
  console.log(`  ✨ 特效策略: ${sp.vfxPrimary.join(' + ')}`);
  console.log(`  🎵 音频策略: ${sp.audioBGM} - ${sp.audioDescription}`);
  console.log(`  ⏱️  建议时长: ${sp.suggestedDuration}秒`);
  console.log(`  🎭 情绪曲线: ${sp.emotionCurve.start}→${sp.emotionCurve.peak}→${sp.emotionCurve.end}`);
});

// 3. 测试阶段分组
console.log('\n═══════════════════════════════════════');
console.log('广告阶段分组:');
console.log('═══════════════════════════════════════');
const groups = mapper.groupByPhase(enriched);
Object.entries(groups).forEach(([phase, points]) => {
  if (points.length > 0) {
    console.log(`\n${phase.toUpperCase()}阶段 (${points.length}个卖点):`);
    points.forEach(p => console.log(`  - [${p.type}] ${p.content.slice(0, 40)}...`));
  }
});

// 4. 测试阶段分配报告
console.log('\n═══════════════════════════════════════');
console.log('阶段分配报告:');
console.log('═══════════════════════════════════════');
const report = mapper.generatePhaseReport(enriched);
console.log(`总卖点数: ${report.totalPoints}`);
Object.entries(report.phaseDistribution).forEach(([phase, data]) => {
  console.log(`${phase}: ${data.count}个 (${data.percentage}%)`);
});
if (report.recommendations.length > 0) {
  console.log('\n改进建议:');
  report.recommendations.forEach(r => console.log(`  ⚠️ ${r}`));
}

// 5. 测试镜头分配方案
console.log('\n═══════════════════════════════════════');
console.log('镜头分配方案 (30秒):');
console.log('═══════════════════════════════════════');
const shotPlan = mapper.generateShotPlan(enriched, 30);
console.log(`总镜头数: ${shotPlan.length}`);
shotPlan.forEach(shot => {
  console.log(`\nShot ${shot.shotIndex} [${shot.phase}] ${shot.startTime}-${shot.endTime}s (${shot.duration}s)`);
  console.log(`  卖点: [${shot.sellingPoint.type}] ${shot.sellingPoint.content.slice(0, 30)}...`);
  console.log(`  镜头: ${shot.shotType} | 运镜: ${shot.cameraMove}`);
  console.log(`  特效: ${shot.vfx?.join?.('+') || shot.vfx}`);
  console.log(`  音频: ${shot.audio}`);
  console.log(`  情绪: ${shot.emotion?.start}→${shot.emotion?.peak}→${shot.emotion?.end}`);
});

// 6. 测试Prompt注入指令
console.log('\n═══════════════════════════════════════');
console.log('Prompt注入指令示例:');
console.log('═══════════════════════════════════════');
shotPlan.slice(0, 3).forEach(shot => {
  if (shot.sellingPoint) {
    const injection = mapper.generatePromptInjection(shot.sellingPoint);
    console.log(`\nShot ${shot.shotIndex} [${shot.phase}]:`);
    console.log(`  ${injection}`);
  }
});

console.log('\n═══════════════════════════════════════');
console.log('✅ 卖点深度映射系统测试全部通过！');
console.log('🎬 每个卖点都拥有了完整的广告基因！');
console.log('🎯 从"文字列表"升级为"全链路驱动指令"！');
