/**
 * 测试主题：CleanMaster智能扫地机器人X5 商业广告大片
 * 
 * 品牌信息：
 * - 品牌：CleanMaster
 * - 产品：智能扫地机器人X5
 * - 卖点：AI避障/激光导航/静音/超长续航
 * - 品牌色：科技蓝 #0066FF
 * - 品牌调性：科技感 + 生活美学
 * - 目标受众：25-40岁城市白领
 * - 投放平台：抖音 + 电视
 * - 时长：30秒
 * - 创意指数：0.85
 * 
 * 预期广告结构：
 * - Hook (0-3s): 家庭主妇看着满地灰尘，表情无奈
 * - Problem (3-8s): 传统扫地方式麻烦，弯腰累、灰尘飞扬
 * - Solution (8-20s): 扫地机器人优雅登场，AI避障演示、激光导航展示
 * - Proof (20-25s): 前后对比，地面焕然一新，静音演示
 * - CTA (25-30s): 品牌Logo + Slogan + 购买引导
 */

const testConfig = {
  mode: 'commercial',
  resolution: '4K-UHD',
  product: {
    name: 'CleanMaster X5智能扫地机器人',
    category: '智能家居',
    price: '2999元',
    sellingPoints: [
      { type: 'function', content: 'AI智能避障，精准识别100种障碍物' },
      { type: 'tech', content: 'LDS激光导航，建图精准度±2cm' },
      { type: 'function', content: '超静音设计，噪音低至55dB' },
      { type: 'function', content: '180分钟超长续航，一次清扫300㎡' },
      { type: 'visual', content: '极简设计，荣获红点设计大奖' }
    ]
  },
  brand: {
    name: 'CleanMaster',
    color: '#0066FF',
    slogan: '让清洁，更聪明',
    tone: '科技感 + 生活美学',
    logo: 'cleanmaster-logo.png'
  },
  targetAudience: {
    age: '25-40岁',
    occupation: '城市白领',
    income: '月收入1.5万+',
    painPoints: ['没时间打扫', '弯腰累', '清洁不彻底', '宠物毛发难清理']
  },
  platform: 'tv',
  duration: 30,
  creativeIntensity: 0.85,
  videoType: 'commercial',
  style: 'tech + lifestyle'
};

module.exports = testConfig;
