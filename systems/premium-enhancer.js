/**
 * Premium Enhancer - 高级质感增强系统
 * 
 * 电影级光影 + 材质细节 + 色彩科学 + 画面锐化
 * 让画面达到影视级广告质感
 * 
 * @version v1.0
 * @priority P0 - 质感核心
 */

class PremiumEnhancer {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.intensity = options.intensity || 'high'; // low/medium/high/cinematic
    
    // 电影级光影库
    this.lightingLibrary = {
      threePoint: {
        name: '三点布光',
        description: '主光(Key)+辅光(Fill)+轮廓光(Rim)',
        prompt: '专业三点布光:主光45度侧上方塑造立体感,辅光填充阴影保持细节,轮廓光勾勒边缘分离背景'
      },
      rembrandt: {
        name: '伦勃朗光',
        description: '经典油画感光影',
        prompt: '伦勃朗布光:主光高位侧向,眼睛下方形成三角光斑,暗部深邃有层次,古典油画质感'
      },
      butterfly: {
        name: '蝴蝶光',
        description: '好莱坞明星光',
        prompt: '蝴蝶布光:主光高位正前方,鼻子下方蝴蝶形阴影, glamorous好莱坞质感,皮肤通透'
      },
      split: {
        name: '分割光',
        description: '戏剧性光影',
        prompt: '分割布光:主光纯侧向,面部一半亮一半暗,戏剧性张力,电影感强烈'
      },
      product: {
        name: '产品光',
        description: '产品专用布光',
        prompt: '产品专业布光:顶光+侧光+底光组合,无影或少影,材质反光完美呈现,白底或渐变背景'
      }
    };
    
    // 材质细节库
    this.materialLibrary = {
      metal: {
        name: '金属',
        prompt: '金属材质:高光反射清晰,环境映射真实,拉丝纹理可见,边缘高光锐利,冷峻质感'
      },
      glass: {
        name: '玻璃',
        prompt: '玻璃材质:折射率真实,焦散效果,透明度层次,边缘高光,通透感强'
      },
      fabric: {
        name: '织物',
        prompt: '织物材质:纤维纹理清晰,褶皱自然,光泽度适中,触感可感,柔软质感'
      },
      leather: {
        name: '皮革',
        prompt: '皮革材质:毛孔纹理可见,光泽温润,折痕自然,奢华质感,手工感'
      },
      wood: {
        name: '木材',
        prompt: '木材材质:年轮纹理清晰,木纹走向自然,光泽温润,触感真实,自然质感'
      },
      ceramic: {
        name: '陶瓷',
        prompt: '陶瓷材质:釉面光滑,反光柔和,色彩饱和,温润如玉,精致质感'
      }
    };
    
    // 色彩科学LUT
    this.colorScience = {
      cinematic: {
        name: '电影感',
        prompt: '电影感调色:低饱和度+高对比度,青橙色调,暗部偏青亮部偏橙,胶片颗粒感,画面厚重'
      },
      commercial: {
        name: '商业广告',
        prompt: '商业广告调色:高饱和度+中高对比度,品牌色调突出,画面通透,色彩鲜明,视觉冲击力'
      },
      luxury: {
        name: '奢侈品',
        prompt: '奢侈品调色:低饱和度+柔和对比度,暖金色调,暗部细节丰富,画面优雅,高级感'
      },
      tech: {
        name: '科技感',
        prompt: '科技感调色:冷色调为主,蓝紫色调,高清晰度,画面锐利,未来感,数字感'
      },
      natural: {
        name: '自然真实',
        prompt: '自然真实调色:Rec.709标准色域,色彩准确还原,对比度适中,画面干净,真实感'
      }
    };
    
    // 画面锐化/降噪
    this.imageEnhancement = {
      sharpness: '画面锐利清晰,边缘分明,细节丰富,纹理清晰可辨',
      clarity: '通透感强,空气感,层次分明,前景中景背景分离度好',
      denoise: '纯净无噪点,画面干净,暗部纯净,颗粒感细腻如胶片',
      dynamicRange: '动态范围广,高光不过曝保留细节,暗部有层次不死黑,中间调丰富'
    };
  }

  /**
   * 增强镜头Prompt
   * @param {Object} shot - 镜头对象
   * @param {string} prompt - 当前prompt
   * @returns {string} 增强后的prompt
   */
  enhance(shot, prompt) {
    if (!this.enabled) return prompt;
    
    const enhancements = [];
    
    // 1. 注入光影
    const lighting = this._selectLighting(shot);
    if (lighting) enhancements.push(lighting);
    
    // 2. 注入材质
    const material = this._detectMaterial(shot);
    if (material) enhancements.push(material);
    
    // 3. 注入色彩科学
    const colorScience = this._selectColorScience(shot);
    if (colorScience) enhancements.push(colorScience);
    
    // 4. 注入画面增强
    const imageEnhance = this._getImageEnhancement();
    enhancements.push(imageEnhance);
    
    // 组合增强
    const enhancedText = `【影视级质感】${enhancements.join(' | ')}`;
    
    // 智能注入（不超限）
    return this._smartInject(prompt, enhancedText);
  }

  /**
   * 选择光影方案
   */
  _selectLighting(shot) {
    const shotType = shot.shotType || shot.type || 'standard';
    
    // 产品展示用产品光
    if (shotType === 'product' || shotType === 'demonstration') {
      return this.lightingLibrary.product.prompt;
    }
    
    // 人物特写用蝴蝶光/伦勃朗光
    if (shotType === 'close_up' || shotType === 'portrait') {
      return Math.random() > 0.5 
        ? this.lightingLibrary.butterfly.prompt 
        : this.lightingLibrary.rembrandt.prompt;
    }
    
    // 戏剧场景用分割光
    if (shotType === 'climax' || shotType === 'conflict') {
      return this.lightingLibrary.split.prompt;
    }
    
    // 默认三点布光
    return this.lightingLibrary.threePoint.prompt;
  }

  /**
   * 检测产品材质
   */
  _detectMaterial(shot) {
    const scene = shot.scene || '';
    const prompt = shot.prompt || '';
    const text = `${scene} ${prompt}`.toLowerCase();
    
    // 材质关键词检测
    const materialKeywords = {
      metal: ['金属', '不锈钢', '铝合金', 'gold', 'silver', 'metal'],
      glass: ['玻璃', '水晶', '透明', 'glass', 'crystal'],
      fabric: ['布料', '丝绸', '棉', 'fabric', 'silk'],
      leather: ['皮革', '真皮', 'leather'],
      wood: ['木', '实木', 'wood', 'oak'],
      ceramic: ['陶瓷', '瓷器', 'ceramic', 'porcelain']
    };
    
    for (const [material, keywords] of Object.entries(materialKeywords)) {
      if (keywords.some(k => text.includes(k))) {
        return this.materialLibrary[material]?.prompt;
      }
    }
    
    return null;
  }

  /**
   * 选择色彩科学方案
   */
  _selectColorScience(shot) {
    const emotion = shot.emotionPhase || 'neutral';
    const shotType = shot.shotType || 'standard';
    
    // 根据情绪选择
    if (['excited', 'energetic'].includes(emotion)) {
      return this.colorScience.commercial.prompt;
    }
    if (['calm', 'elegant'].includes(emotion)) {
      return this.colorScience.luxury.prompt;
    }
    if (['tense', 'mysterious'].includes(emotion)) {
      return this.colorScience.tech.prompt;
    }
    
    // 根据场景类型选择
    if (shotType === 'product' || shotType === 'demonstration') {
      return this.colorScience.commercial.prompt;
    }
    
    // 默认电影感
    return this.colorScience.cinematic.prompt;
  }

  /**
   * 获取画面增强描述
   */
  _getImageEnhancement() {
    const enhancements = [
      this.imageEnhancement.sharpness,
      this.imageEnhancement.clarity,
      this.imageEnhancement.denoise,
      this.imageEnhancement.dynamicRange
    ];
    
    return enhancements.join(', ');
  }

  /**
   * 智能注入增强文本（不超限）
   */
  _smartInject(prompt, enhancement) {
    const maxLength = 988; // Prompt长度上限
    
    if (prompt.length + enhancement.length + 3 <= maxLength) {
      return `${prompt} | ${enhancement}`;
    }
    
    // 空间不足，裁剪非核心内容
    const spaceNeeded = enhancement.length + 10;
    const remaining = maxLength - spaceNeeded;
    
    if (remaining < 100) {
      // 空间严重不足，只注入最关键部分
      const keyEnhance = enhancement.slice(0, 100) + '...';
      return `${prompt} | ${keyEnhance}`;
    }
    
    // 裁剪prompt尾部
    const trimmedPrompt = prompt.slice(0, remaining);
    return `${trimmedPrompt}... | ${enhancement}`;
  }

  /**
   * 获取高级质感配置
   */
  getConfig() {
    return {
      lighting: this.lightingLibrary,
      material: this.materialLibrary,
      colorScience: this.colorScience,
      imageEnhancement: this.imageEnhancement
    };
  }
}

module.exports = { PremiumEnhancer };
