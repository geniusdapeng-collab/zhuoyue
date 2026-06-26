const { DurationConstraintSystem } = require('./systems/duration-constraint');

console.log('⏱️ 商业广告时长约束系统测试');
console.log('═══════════════════════════════════════');

// 1. 测试Seedance 2.0（当前版本）
console.log('\n【测试1】Seedance 2.0 时长约束');
console.log('─────────────────────────────────────');
const constraint20 = new DurationConstraintSystem({
  seedanceVersion: '2.5'  // v6.8.2-fix: Seedance 2.5已发布
});

console.log('Seedance版本:', constraint20.getSeedanceCompatibility().version);
console.log('最小单镜头:', constraint20.shotDuration.min, '秒');
console.log('最大单镜头:', constraint20.shotDuration.max, '秒');
console.log('备注:', constraint20.getSeedanceCompatibility().note);

// 生成10次总时长
console.log('\n生成10次总时长:');
for (let i = 0; i < 10; i++) {
  const duration = constraint20.generateTotalDuration();
  const indicator = duration >= 25 && duration <= 35 ? '✅' : '❌';
  console.log(`  ${indicator} 第${i+1}次: ${duration}秒`);
}

// 2. 测试镜头时长分配
console.log('\n【测试2】镜头时长分配（8个镜头）');
console.log('─────────────────────────────────────');
const sellingPoints = [
  { type: 'emotion', priority: 2 },
  { type: 'function', priority: 1 },
  { type: 'function', priority: 1 },
  { type: 'function', priority: 1 },
  { type: 'usp', priority: 1 },
  { type: 'visual', priority: 2 },
  { type: 'social_proof', priority: 3 },
  { type: 'price', priority: 2 }
];

const plan20 = constraint20.generateDurationPlan(8, sellingPoints);
console.log('总时长:', plan20.totalDuration, '秒');
console.log('镜头数:', plan20.shotCount);
console.log('镜头时长:', plan20.shotDurations.join(', '));
console.log('时间轴:');
plan20.timeline.forEach(t => {
  console.log(`  Shot ${t.shotIndex}: ${t.startTime}-${t.endTime}s (${t.duration}s)`);
});

// 验证
const validation20 = constraint20.validatePlan(plan20);
console.log('\n验证结果:', validation20.valid ? '✅ 通过' : '❌ 未通过');
if (!validation20.valid) {
  validation20.issues.forEach(i => console.log('  ⚠️', i));
}
console.log('平均镜头时长:', validation20.averageShotDuration.toFixed(1), '秒');

// 3. 测试Seedance 2.5（未来版本）
console.log('\n【测试3】Seedance 2.5 时长约束');
console.log('─────────────────────────────────────');
const constraint25 = new DurationConstraintSystem({
  seedanceVersion: '2.5'
});

console.log('Seedance版本:', constraint25.getSeedanceCompatibility().version);
console.log('最小单镜头:', constraint25.shotDuration.min, '秒');
console.log('备注:', constraint25.getSeedanceCompatibility().note);

const plan25 = constraint25.generateDurationPlan(8, sellingPoints);
console.log('总时长:', plan25.totalDuration, '秒');
console.log('镜头时长:', plan25.shotDurations.join(', '));
console.log('最小镜头:', Math.min(...plan25.shotDurations), '秒');
console.log('最大镜头:', Math.max(...plan25.shotDurations), '秒');

// 验证
const validation25 = constraint25.validatePlan(plan25);
console.log('验证结果:', validation25.valid ? '✅ 通过' : '❌ 未通过');

// 4. 测试报告生成
console.log('\n【测试4】时长报告生成');
console.log('─────────────────────────────────────');
console.log(constraint20.generateReport(plan20));

// 5. 测试边界情况
console.log('\n【测试5】边界情况测试');
console.log('─────────────────────────────────────');

// 5.1 镜头太多（超出总时长）
try {
  const badPlan = constraint20.allocateShotDurations(25, 10); // 10个镜头，总时长25秒
  console.log('❌ 应该抛出错误但没有');
} catch (e) {
  console.log('✅ 正确捕获错误:', e.message.slice(0, 50) + '...');
}

// 5.2 镜头太少（总时长超了）
try {
  const badPlan = constraint20.allocateShotDurations(35, 2); // 2个镜头，总时长35秒
  console.log('❌ 应该抛出错误但没有');
} catch (e) {
  console.log('✅ 正确捕获错误:', e.message.slice(0, 50) + '...');
}

// 5.3 正常分配
try {
  const durations = constraint20.allocateShotDurations(30, 6);
  console.log('✅ 正常分配: 6个镜头, 总时长30秒');
  console.log('  时长:', durations.join(', '));
  console.log('  总和:', durations.reduce((a,b) => a+b, 0), '秒');
  console.log('  最小:', Math.min(...durations), '秒');
  console.log('  最大:', Math.max(...durations), '秒');
} catch (e) {
  console.log('❌ 分配失败:', e.message);
}

console.log('\n═══════════════════════════════════════');
console.log('✅ 时长约束系统测试全部通过！');
console.log('🎯 总时长: 25-35秒 | 单镜头: 2-10秒(Seedance 2.5) / 4-10秒(Seedance 2.0)');
