const { ProductArchiveSystem } = require('./systems/product-archive-system');
const { ProductArchiveAdIntegration } = require('./systems/product-archive-ad-integration');

async function main() {
  console.log('商品档案管理系统测试');
  console.log('====================');
  
  const archiveSystem = new ProductArchiveSystem({ dbPath: './test-product-db' });
  await archiveSystem.init();
  
  // 创建档案
  const archive = await archiveSystem.createArchive({
    productId: 'CM-X5-001',
    name: 'CleanMaster X5 智能扫地机器人',
    category: '智能家居',
    brand: 'CleanMaster',
    price: 2999,
    originalPrice: 3999,
    appearance: {
      colors: ['科技白', '深空灰'],
      awards: ['红点设计大奖']
    },
    functions: {
      coreFeatures: ['AI智能避障', '激光导航', '超静音'],
      targetUsers: ['25-40岁城市白领']
    },
    sellingPoints: {
      primary: ['AI避障不撞家具', '180分钟续航', '55dB超静音']
    },
    brand: {
      brandId: 'BRAND-CM-001',
      brandName: 'CleanMaster',
      brandColor: '#0066FF',
      brandSlogan: '让清洁，更聪明'
    }
  });
  
  console.log('✅ 档案创建:', archive.name);
  
  // 添加图片
  await archiveSystem.addProductImages('CM-X5-001', [
    { type: 'portrait', url: 'https://example.com/x5-portrait.jpg', description: '定妆照', isMain: true },
    { type: 'main', url: 'https://example.com/x5-main.jpg', description: '主图' },
    { type: 'scene', url: 'https://example.com/x5-scene.jpg', description: '客厅场景' }
  ]);
  console.log('✅ 图片添加完成');
  
  // 模拟用户反馈
  const feedback = await archiveSystem.simulateUserFeedback('CM-X5-001', { positiveCount: 20, negativeCount: 5 });
  console.log('✅ 用户反馈:', feedback.rating, '/5.0', feedback.reviewCount, '条评价');
  
  // 提取卖点
  const points = await archiveSystem.extractSellingPoints('CM-X5-001');
  console.log('✅ 提炼卖点:', points.length, '个');
  points.forEach((p, i) => console.log('   ', i + 1, `[${p.type}]`, p.content));
  
  // 生成广告配置
  const adConfig = await archiveSystem.generateAdConfig('CM-X5-001', { resolution: '4K-UHD', duration: 30 });
  console.log('✅ 广告配置:', adConfig.product.name, adConfig.resolution);
  
  // 生成报告
  const integration = new ProductArchiveAdIntegration(archiveSystem, null);
  const report = await integration.generateArchiveReport('CM-X5-001');
  console.log('✅ 档案报告:', report.name, '评分', report.rating, '图片', report.images);
  
  console.log('\n全部测试通过！');
}

main().catch(console.error);
