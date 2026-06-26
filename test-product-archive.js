/**
 * 测试商品档案管理系统
 * 创建CleanMaster X5扫地机器人完整档案并测试
 */

const { ProductArchiveSystem } = require('./systems/product-archive-system');
const { ProductArchiveAdIntegration } = require('./systems/product-archive-ad-integration');

async function testProductArchiveSystem() {
  console.log('🎬 商品档案管理系统测试');
  console.log('═══════════════════════════════════════');
  
  // 1. 初始化系统
  const archiveSystem = new ProductArchiveSystem({ dbPath: './test-product-db' });
  await archiveSystem.init();
  console.log('✅ 商品档案系统初始化完成');
  
  // 2. 创建商品档案（CleanMaster X5）
  console.log('\n📦 创建商品档案...');
  const cleanMasterX5 = await archiveSystem.createArchive({
    productId: 'CM-X5-001',
    name: 'CleanMaster X5 智能扫地机器人',
    category: '智能家居',
    subCategory: '扫地机器人',
    brand: 'CleanMaster',
    model: 'X5',
    sku: 'CM-X5-PRO',
    price: 2999,
    originalPrice: 3999,
    currency: 'CNY',
    
    // 外观规格
    appearance: {
      colors: ['科技白', '深空灰', '玫瑰金'],
      dimensions: { length: 35, width: 35, height: 9.8 },
      weight: 3500,
      material: 'ABS工程塑料 + 钢化玻璃面板',
      texture: '磨砂质感，手感细腻',
      designStyle: '极简科技风',
      awards: ['红点设计大奖', 'iF设计奖']
    },
    
    // 核心功能
    functions: {
      coreFeatures: [
        'AI智能避障，精准识别100种障碍物',
        'LDS激光导航，建图精准度±2cm',
        '超静音设计，噪音低至55dB',
        '180分钟超长续航，一次清扫300㎡',
        '5200mAh大容量电池',
        '4000Pa飓风吸力',
        '智能电控水箱，精准控水',
        'APP远程控制，定时清扫'
      ],
      techSpecs: {
        navigation: 'LDS激光导航 + AI视觉避障',
        battery: '5200mAh锂电池',
        suction: '4000Pa',
        noise: '55dB',
        runtime: '180分钟',
        coverage: '300㎡',
        waterTank: '300ml电控水箱',
        dustBin: '500ml大容量尘盒'
      },
      usageScenarios: [
        '日常家庭清扫',
        '宠物毛发清理',
        '地毯深度清洁',
        '沙发底部清洁',
        '床底死角清扫',
        '定时预约清扫'
      ],
      targetUsers: [
        '25-35岁都市白领',
        '有宠物的家庭',
        '注重生活品质的家庭',
        '忙碌的上班族',
        '有老人小孩的家庭'
      ],
      compatibility: ['iOS', 'Android', '小米智能家居', '天猫精灵', '小度']
    },
    
    // 卖点提炼
    sellingPoints: {
      primary: [
        'AI智能避障，不撞家具不卡困',
        'LDS激光导航，精准建图不迷路',
        '超静音设计，清扫不打扰生活',
        '180分钟续航，大户型一次搞定'
      ],
      secondary: [
        '荣获红点设计大奖',
        'APP智能控制，远程操控',
        '自动回充，断点续扫',
        '5200mAh大电池，持久耐用'
      ],
      emotional: [
        '解放双手，享受美好生活',
        '家的洁净，交给聪明的它',
        '陪伴家人的时间，不该浪费在清扫上'
      ],
      rational: [
        '每天省出30分钟，一年省出182小时',
        '比请保洁阿姨更划算',
        '99.9%清洁覆盖率'
      ],
      usp: '首款AI视觉避障 + LDS激光导航双系统扫地机器人'
    },
    
    // 品牌关联
    brand: {
      brandId: 'BRAND-CM-001',
      brandName: 'CleanMaster',
      brandColor: '#0066FF',
      brandSlogan: '让清洁，更聪明',
      brandTone: '科技感 + 生活美学',
      brandStory: 'CleanMaster创立于2015年，专注于智能清洁领域，致力于用AI技术让家庭清洁更智能、更高效。'
    },
    
    // 竞争定位
    competition: {
      competitors: ['iRobot', '科沃斯', '石头科技', '小米'],
      advantages: [
        'AI避障技术领先同行2代',
        '噪音控制行业最低55dB',
        '续航时间行业最长180分钟',
        '价格仅为进口品牌1/3'
      ],
      marketPosition: '中高端智能扫地机器人领导者',
      priceTier: '中高端（2000-4000元）'
    }
  });
  
  console.log('✅ 商品档案创建成功:', cleanMasterX5.name);
  console.log('   ID:', cleanMasterX5.productId);
  console.log('   价格: ¥', cleanMasterX5.price);
  
  // 3. 添加商品图片
  console.log('\n📸 添加商品图片...');
  await archiveSystem.addProductImages('CM-X5-001', [
    {
      type: 'portrait',
      url: 'https://example.com/cleanmaster-x5-portrait.jpg',
      description: 'CleanMaster X5 定妆照 - 正面全景',
      isMain: true
    },
    {
      type: 'main',
      url: 'https://example.com/cleanmaster-x5-main-1.jpg',
      description: '主图1 - 产品正面',
      isMain: true
    },
    {
      type: 'main',
      url: 'https://example.com/cleanmaster-x5-main-2.jpg',
      description: '主图2 - 产品侧面',
      isMain: false
    },
    {
      type: 'detail',
      url: 'https://example.com/cleanmaster-x5-detail-1.jpg',
      description: '细节图 - LDS激光导航模组',
      isMain: false
    },
    {
      type: 'detail',
      url: 'https://example.com/cleanmaster-x5-detail-2.jpg',
      description: '细节图 - 5200mAh电池',
      isMain: false
    },
    {
      type: 'scene',
      url: 'https://example.com/cleanmaster-x5-scene-1.jpg',
      description: '场景图 - 客厅清扫场景',
      isMain: false
    },
    {
      type: 'scene',
      url: 'https://example.com/cleanmaster-x5-scene-2.jpg',
      description: '场景图 - 卧室静音清扫',
      isMain: false
    },
    {
      type: 'usage',
      url: 'https://example.com/cleanmaster-x5-usage-1.jpg',
      description: '使用图 - APP控制界面',
      isMain: false
    },
    {
      type: 'comparison',
      url: 'https://example.com/cleanmaster-x5-compare.jpg',
      description: '对比图 - 清洁前后对比',
      isMain: false
    },
    {
      type: 'lifestyle',
      url: 'https://example.com/cleanmaster-x5-lifestyle.jpg',
      description: '生活方式图 - 享受清洁后的闲暇时光',
      isMain: false
    }
  ]);
  
  console.log('✅ 商品图片添加完成');
  
  // 4. 模拟用户反馈
  console.log('\n💬 模拟用户反馈...');
  const feedback = await archiveSystem.simulateUserFeedback('CM-X5-001', {
    positiveCount: 30,
    negativeCount: 5
  });
  
  console.log('✅ 用户反馈模拟完成');
  console.log('   综合评分:', feedback.rating);
  console.log('   评价数量:', feedback.reviewCount);
  console.log('   好评率:', feedback.positiveRate + '%');
  console.log('   精选好评:', feedback.topReviews[0]);
  
  // 5. 提取广告卖点
  console.log('\n✨ 提取广告卖点...');
  const sellingPoints = await archiveSystem.extractSellingPoints('CM-X5-001');
  
  console.log('✅ 卖点提取完成:', sellingPoints.length, '个');
  sellingPoints.forEach((sp, i) => {
    console.log(`   ${i + 1}. [${sp.type}] ${sp.content}`);
  });
  
  // 6. 获取广告配置
  console.log('\n🎬 生成广告配置...');
  const adConfig = await archiveSystem.generateAdConfig('CM-X5-001', {
    resolution: '4K-UHD',
    platform: 'tv',
    duration: 30,
    creativeIntensity: 0.85
  });
  
  console.log('✅ 广告配置生成完成');
  console.log('   产品:', adConfig.product.name);
  console.log('   品牌:', adConfig.brand.name);
  console.log('   分辨率:', adConfig.resolution);
  console.log('   时长:', adConfig.duration + 's');
  console.log('   平台:', adConfig.platform);
  console.log('   卖点数:', adConfig.product.sellingPoints.length);
  console.log('   参考图:', adConfig.referenceImages?.length || 0, '张');
  
  // 7. 测试档案报告
  console.log('\n📊 生成档案报告...');
  const integration = new ProductArchiveAdIntegration(archiveSystem, null);
  const report = await integration.generateArchiveReport('CM-X5-001');
  
  console.log('✅ 档案报告生成完成');
  console.log('   商品名称:', report.name);
  console.log('   品牌:', report.brand);
  console.log('   价格: ¥', report.price, '(原价¥', report.originalPrice, ')', report.discount + '%OFF');
  console.log('   评分:', report.rating, '/ 5.0');
  console.log('   评价数:', report.reviewCount);
  console.log('   好评率:', report.positiveRate + '%');
  console.log('   图片数:', report.images);
  console.log('   图片类型:', report.imageTypes.join(', '));
  console.log('   核心功能:', report.coreFeatures.length, '个');
  console.log('   使用场景:', report.usageScenarios.length, '个');
  console.log('   目标用户:', report.targetUsers.length, '个');
  
  // 8. 测试一键生成广告
  console.log('\n🚀 一键生成广告大片...');
  const adResult = await integration.generateCommercialFromArchive('CM-X5-001', {
    resolution: '4K-UHD',
    platform: 'tv',
    duration: 30,
    creativeIntensity: 0.85
  });
  
  console.log('✅ 广告配置生成完成');
  console.log('   商品:', adResult.productName);
  console.log('   配置:', adResult.message);
  console.log('   卖点:', adResult.sellingPoints.length, '个');
  console.log('   图片:', adResult.images.length, '张');
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ 商品档案管理系统测试全部通过！');
  console.log('🎬 商业广告大片制作系统 + 商品档案管理系统 集成完成！');
  
  return {
    archiveSystem,
    integration,
    cleanMasterX5,
    adConfig
  };
}

// 如果直接运行
if (require.main === module) {
  testProductArchiveSystem().catch(console.error);
}

module.exports = { testProductArchiveSystem };
