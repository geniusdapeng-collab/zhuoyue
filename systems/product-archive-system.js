/**
 * Product Archive System - 商品档案管理系统
 * 
 * 商业广告大片制作系统的核心基础设施
 * 管理商品全生命周期档案：图片、信息、卖点、用户反馈
 * 
 * 核心功能:
 * 1. 商品档案CRUD - 创建/读取/更新/删除商品档案
 * 2. 商品图片管理 - 定妆照/主图/细节图/场景图/使用图
 * 3. 卖点提炼系统 - 从档案自动提炼广告卖点
 * 4. 用户反馈模拟 - 好评/差评/使用场景
 * 5. 与广告系统强关联 - 自动注入商品档案到广告制作
 * 
 * @version v1.0
 * @priority P0 - 商业广告基础设施
 */

class ProductArchiveSystem {
  constructor(options = {}) {
    this.dbPath = options.dbPath || './product-archives';
    this.archives = new Map(); // 内存存储
    this.initialized = false;
    
    // 商品图片类型定义
    this.imageTypes = {
      portrait: { name: '商品定妆照', required: true, maxCount: 1 },
      main: { name: '商品主图', required: true, maxCount: 5 },
      detail: { name: '细节图', required: false, maxCount: 10 },
      scene: { name: '场景图', required: false, maxCount: 8 },
      usage: { name: '使用图', required: false, maxCount: 8 },
      comparison: { name: '对比图', required: false, maxCount: 4 },
      lifestyle: { name: '生活方式图', required: false, maxCount: 6 }
    };
    
    // 商品档案标准字段
    this.standardFields = {
      // 基础信息
      basic: {
        productId: { type: 'string', required: true, description: '商品唯一ID' },
        name: { type: 'string', required: true, description: '商品名称' },
        category: { type: 'string', required: true, description: '商品品类' },
        subCategory: { type: 'string', required: false, description: '子品类' },
        brand: { type: 'string', required: true, description: '品牌名称' },
        model: { type: 'string', required: false, description: '型号' },
        sku: { type: 'string', required: false, description: 'SKU编码' },
        price: { type: 'number', required: true, description: '价格(元)' },
        originalPrice: { type: 'number', required: false, description: '原价(元)' },
        currency: { type: 'string', required: false, default: 'CNY', description: '货币' }
      },
      
      // 外观规格
      appearance: {
        colors: { type: 'array', required: false, description: '可选颜色' },
        dimensions: { type: 'object', required: false, description: '尺寸(长x宽x高cm)' },
        weight: { type: 'number', required: false, description: '重量(g)' },
        material: { type: 'string', required: false, description: '主要材质' },
        texture: { type: 'string', required: false, description: '质感描述' },
        designStyle: { type: 'string', required: false, description: '设计风格' },
        awards: { type: 'array', required: false, description: '设计奖项' }
      },
      
      // 核心功能
      functions: {
        coreFeatures: { type: 'array', required: true, description: '核心功能列表' },
        techSpecs: { type: 'object', required: false, description: '技术参数' },
        usageScenarios: { type: 'array', required: false, description: '使用场景' },
        targetUsers: { type: 'array', required: false, description: '目标用户' },
        compatibility: { type: 'array', required: false, description: '兼容性' }
      },
      
      // 卖点提炼
      sellingPoints: {
        primary: { type: 'array', required: true, description: '一级卖点(3-5个)' },
        secondary: { type: 'array', required: false, description: '二级卖点' },
        emotional: { type: 'array', required: false, description: '情感卖点' },
        rational: { type: 'array', required: false, description: '理性卖点' },
        usp: { type: 'string', required: false, description: '独特卖点(USP)' }
      },
      
      // 品牌关联
      brand: {
        brandId: { type: 'string', required: true, description: '品牌ID' },
        brandName: { type: 'string', required: true, description: '品牌名称' },
        brandColor: { type: 'string', required: false, description: '品牌色' },
        brandSlogan: { type: 'string', required: false, description: '品牌Slogan' },
        brandTone: { type: 'string', required: false, description: '品牌调性' },
        brandStory: { type: 'string', required: false, description: '品牌故事' }
      },
      
      // 用户反馈
      userFeedback: {
        rating: { type: 'number', required: false, description: '综合评分(1-5)' },
        reviewCount: { type: 'number', required: false, description: '评价数量' },
        positiveRate: { type: 'number', required: false, description: '好评率' },
        topReviews: { type: 'array', required: false, description: '精选好评' },
        commonComplaints: { type: 'array', required: false, description: '常见差评' },
        userPhotos: { type: 'array', required: false, description: '用户晒图' }
      },
      
      // 竞争定位
      competition: {
        competitors: { type: 'array', required: false, description: '竞品列表' },
        advantages: { type: 'array', required: false, description: '竞争优势' },
        marketPosition: { type: 'string', required: false, description: '市场定位' },
        priceTier: { type: 'string', required: false, description: '价格档位' }
      }
    };
    
    // 广告系统关联配置
    this.adIntegration = {
      // 档案字段到广告卖点的映射
      fieldToSellingPoint: {
        'functions.coreFeatures': (features) => features.map(f => ({ type: 'function', content: f })),
        'appearance.awards': (awards) => awards.map(a => ({ type: 'visual', content: `荣获${a}` })),
        'sellingPoints.primary': (points) => points.map(p => ({ type: 'usp', content: p })),
        'userFeedback.topReviews': (reviews) => reviews.slice(0, 3).map(r => ({ type: 'social_proof', content: r }))
      },
      
      // 图片类型到广告场景的映射
      imageToScene: {
        portrait: ['opening', 'product_hero', 'closing'],
        main: ['product_showcase', 'feature_demo'],
        detail: ['close_up', 'texture_showcase'],
        scene: ['lifestyle', 'usage_scenario'],
        usage: ['demonstration', 'user_scenario'],
        comparison: ['before_after', 'comparison'],
        lifestyle: ['emotion', 'aspiration']
      }
    };
  }

  /**
   * 初始化系统
   */
  async init() {
    if (this.initialized) return;
    
    // 尝试加载已有档案
    try {
      const fs = require('fs').promises;
      const files = await fs.readdir(this.dbPath).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(`${this.dbPath}/${file}`, 'utf8');
          const archive = JSON.parse(data);
          this.archives.set(archive.productId, archive);
        }
      }
      
      console.log(`[ProductArchive] 已加载 ${this.archives.size} 个商品档案`);
    } catch (e) {
      console.log('[ProductArchive] 初始化新数据库');
    }
    
    this.initialized = true;
  }

  /**
   * 创建商品档案
   */
  async createArchive(data) {
    await this.init();
    
    const archive = {
      productId: data.productId || `P${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...data
    };
    
    // 验证必填字段
    const validation = this._validateArchive(archive);
    if (!validation.valid) {
      throw new Error(`档案验证失败: ${validation.errors.join(', ')}`);
    }
    
    // 保存到内存
    this.archives.set(archive.productId, archive);
    
    // 持久化到文件
    await this._persistArchive(archive);
    
    console.log(`[ProductArchive] 创建档案: ${archive.productId} - ${archive.name}`);
    return archive;
  }

  /**
   * 获取商品档案
   */
  async getArchive(productId) {
    await this.init();
    return this.archives.get(productId);
  }

  /**
   * 更新商品档案
   */
  async updateArchive(productId, updates) {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive) {
      throw new Error(`商品档案不存在: ${productId}`);
    }
    
    const updated = {
      ...archive,
      ...updates,
      productId, // 保护ID不被修改
      updatedAt: new Date().toISOString(),
      version: (archive.version || 1) + 1
    };
    
    this.archives.set(productId, updated);
    await this._persistArchive(updated);
    
    console.log(`[ProductArchive] 更新档案: ${productId}`);
    return updated;
  }

  /**
   * 添加商品图片
   */
  async addProductImages(productId, images) {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive) {
      throw new Error(`商品档案不存在: ${productId}`);
    }
    
    if (!archive.images) archive.images = {};
    
    for (const image of images) {
      const type = image.type;
      if (!this.imageTypes[type]) {
        console.warn(`[ProductArchive] 未知图片类型: ${type}`);
        continue;
      }
      
      if (!archive.images[type]) archive.images[type] = [];
      
      // 检查数量限制
      const maxCount = this.imageTypes[type].maxCount;
      if (archive.images[type].length >= maxCount) {
        console.warn(`[ProductArchive] ${type}图片数量已达上限(${maxCount})`);
        continue;
      }
      
      archive.images[type].push({
        url: image.url,
        path: image.path,
        description: image.description || '',
        uploadedAt: new Date().toISOString(),
        isMain: image.isMain || false,
        metadata: image.metadata || {}
      });
    }
    
    archive.updatedAt = new Date().toISOString();
    await this._persistArchive(archive);
    
    console.log(`[ProductArchive] 添加图片: ${productId} | ${images.length}张`);
    return archive;
  }

  /**
   * 获取商品图片（用于广告定妆照引用）
   */
  async getProductImagesForAd(productId, sceneType = 'all') {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive || !archive.images) return [];
    
    const images = [];
    
    // 根据场景类型选择图片
    if (sceneType === 'all') {
      // 返回所有图片
      for (const [type, typeImages] of Object.entries(archive.images)) {
        images.push(...typeImages.map(img => ({ ...img, imageType: type })));
      }
    } else {
      // 根据场景映射选择图片类型
      const mappedTypes = this.adIntegration.imageToScene[sceneType] || [];
      for (const type of mappedTypes) {
        if (archive.images[type]) {
          images.push(...archive.images[type].map(img => ({ ...img, imageType: type })));
        }
      }
    }
    
    // 优先返回定妆照
    const portraitImages = images.filter(img => img.imageType === 'portrait');
    if (portraitImages.length > 0) {
      return portraitImages;
    }
    
    // 其次返回主图
    const mainImages = images.filter(img => img.imageType === 'main');
    if (mainImages.length > 0) {
      return mainImages;
    }
    
    return images;
  }

  /**
   * 自动提炼广告卖点
   */
  async extractSellingPoints(productId) {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive) {
      throw new Error(`商品档案不存在: ${productId}`);
    }
    
    const sellingPoints = [];
    
    // 1. 从核心功能提炼
    if (archive.functions?.coreFeatures) {
      sellingPoints.push(...archive.functions.coreFeatures.map(f => ({
        type: 'function',
        content: f,
        source: 'coreFeatures',
        priority: 1
      })));
    }
    
    // 2. 从设计奖项提炼
    if (archive.appearance?.awards) {
      sellingPoints.push(...archive.appearance.awards.map(a => ({
        type: 'visual',
        content: `荣获${a}设计大奖`,
        source: 'awards',
        priority: 2
      })));
    }
    
    // 3. 从一级卖点提炼
    if (archive.sellingPoints?.primary) {
      sellingPoints.push(...archive.sellingPoints.primary.map(p => ({
        type: 'usp',
        content: p,
        source: 'primary',
        priority: 1
      })));
    }
    
    // 4. 从用户好评提炼
    if (archive.userFeedback?.topReviews) {
      sellingPoints.push(...archive.userFeedback.topReviews.slice(0, 3).map(r => ({
        type: 'social_proof',
        content: r,
        source: 'userReview',
        priority: 3
      })));
    }
    
    // 5. 从价格优势提炼
    if (archive.price && archive.originalPrice && archive.price < archive.originalPrice) {
      const discount = Math.round((1 - archive.price / archive.originalPrice) * 100);
      sellingPoints.push({
        type: 'price',
        content: `限时优惠${discount}%，仅需${archive.price}元`,
        source: 'price',
        priority: 2
      });
    }
    
    // 按优先级排序
    sellingPoints.sort((a, b) => a.priority - b.priority);
    
    return sellingPoints;
  }

  /**
   * 生成广告系统输入配置
   */
  async generateAdConfig(productId, options = {}) {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive) {
      throw new Error(`商品档案不存在: ${productId}`);
    }
    
    const sellingPoints = await this.extractSellingPoints(productId);
    const images = await this.getProductImagesForAd(productId, 'all');
    
    return {
      mode: 'commercial',
      resolution: options.resolution || '4K-UHD',
      product: {
        name: archive.name,
        category: archive.category,
        price: archive.price,
        sellingPoints: sellingPoints.slice(0, 5) // 取前5个卖点
      },
      brand: {
        name: archive.brand?.brandName || archive.brand,
        color: archive.brand?.brandColor || options.brandColor,
        slogan: archive.brand?.brandSlogan || '',
        tone: archive.brand?.brandTone || 'commercial'
      },
      targetAudience: archive.functions?.targetUsers || ['25-40岁城市白领'],
      platform: options.platform || 'tv',
      duration: options.duration || 30,
      creativeIntensity: options.creativeIntensity || 0.8,
      videoType: 'commercial',
      style: archive.appearance?.designStyle || 'modern',
      // 图片引用
      referenceImages: images.slice(0, 3).map(img => ({
        url: img.url || img.path,
        type: img.imageType,
        description: img.description
      }))
    };
  }

  /**
   * 模拟用户反馈
   */
  async simulateUserFeedback(productId, options = {}) {
    await this.init();
    
    const archive = this.archives.get(productId);
    if (!archive) {
      throw new Error(`商品档案不存在: ${productId}`);
    }
    
    const positiveCount = options.positiveCount || 20;
    const negativeCount = options.negativeCount || 5;
    
    const positiveTemplates = [
      '用了{product}之后，生活幸福感提升了很多！',
      '强烈推荐给{targetUser}，{feature}真的很棒！',
      '买之前还犹豫，用了之后真香！{feature}超出预期',
      '这是用过最好的{category}，{feature}太厉害了',
      '给家人买的，他们都说{feature}很方便',
      '{feature}设计太人性化了，细节满分',
      '性价比超高，{feature}媲美高端产品',
      '用了{time}了，{feature}依然很稳定'
    ];
    
    const negativeTemplates = [
      '希望{feature}能再改进一下',
      '价格有点贵，不过{feature}还行',
      '物流有点慢，但{feature}满意',
      '说明书不够详细，{feature}摸索了很久'
    ];
    
    const features = archive.functions?.coreFeatures || ['功能强大'];
    const targetUsers = archive.functions?.targetUsers || ['大家'];
    const category = archive.category || '产品';
    
    const generateReview = (templates, rating) => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      return {
        content: template
          .replace('{product}', archive.name)
          .replace('{feature}', features[Math.floor(Math.random() * features.length)])
          .replace('{targetUser}', targetUsers[Math.floor(Math.random() * targetUsers.length)])
          .replace('{category}', category)
          .replace('{time}', ['一个月', '三个月', '半年', '一年'][Math.floor(Math.random() * 4)]),
        rating: rating,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        verified: Math.random() > 0.3,
        likes: Math.floor(Math.random() * 50)
      };
    };
    
    const positiveReviews = Array.from({ length: positiveCount }, () => 
      generateReview(positiveTemplates, 4 + Math.floor(Math.random() * 2))
    );
    
    const negativeReviews = Array.from({ length: negativeCount }, () => 
      generateReview(negativeTemplates, 3)
    );
    
    const allReviews = [...positiveReviews, ...negativeReviews];
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    // 更新档案
    archive.userFeedback = {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: allReviews.length,
      positiveRate: Math.round((positiveCount / allReviews.length) * 100),
      topReviews: positiveReviews.slice(0, 5).map(r => r.content),
      commonComplaints: negativeReviews.slice(0, 3).map(r => r.content),
      allReviews: allReviews
    };
    
    await this._persistArchive(archive);
    
    console.log(`[ProductArchive] 模拟用户反馈: ${productId} | ${allReviews.length}条评价 | 评分${avgRating.toFixed(1)}`);
    return archive.userFeedback;
  }

  // ========== 内部方法 ==========

  _validateArchive(archive) {
    const errors = [];
    
    // 检查必填字段
    const requiredFields = ['productId', 'name', 'category', 'brand', 'price'];
    for (const field of requiredFields) {
      if (!archive[field]) {
        errors.push(`缺少必填字段: ${field}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async _persistArchive(archive) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // 确保目录存在
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // 保存为JSON文件
      const filePath = path.join(this.dbPath, `${archive.productId}.json`);
      await fs.writeFile(filePath, JSON.stringify(archive, null, 2), 'utf8');
    } catch (e) {
      console.error(`[ProductArchive] 持久化失败: ${e.message}`);
    }
  }
}

module.exports = { ProductArchiveSystem };
