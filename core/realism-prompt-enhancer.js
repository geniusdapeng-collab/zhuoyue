/**
 * Realism Prompt Enhancer v1.0
 * AI视频画面真实感软性注入层
 * 
 * 定位：不改变系统架构、不新增字段、不改动主链路模块
 * 仅作为视觉提示词的后置增强层，提升输出真实感指数
 * 
 * 注入路径：Stage 11 (视觉提示词生成) → 后置增强 → 提交渲染
 */

class RealismPromptEnhancer {
  constructor(options = {}) {
    this.enabled = options.enabled !== false; // 默认启用
    this.mode = options.mode || 'smart'; // 'full' | 'smart' | 'minimal'
    this.sceneType = options.sceneType || 'general'; // 'portrait' | 'wildlife' | 'interior' | 'general' | 'minimal'
    
    // 七维质感参数库
    this.dimensions = {
      camera: {
        primary: ['Arri Alexa 65', 'Arri Alexa Mini LF'],
        secondary: ['RED V-RAPTOR', 'Sony Venice 2'],
        auxiliary: ['65mm sensor', 'large format', 'IMAX 70mm']
      },
      lens: {
        primary: ['Cooke S7/i', 'Arri Master Prime'],
        secondary: ['Leica Summilux', 'Zeiss Otus', 'Panavision Primo'],
        modifiers: ['anamorphic 2.39:1', 'widescreen cinematic']
      },
      aperture: {
        range: 'f/1.8 - f/2.8',
        modifiers: ['shallow DOF', 'soft bokeh', 'background falls off smoothly'],
        advanced: ['tack sharp focus on subject eyes']
      },
      lighting: {
        primary: 'natural diffused overcast',
        modifiers: ['soft shadows', 'no hard light'],
        alternatives: ['golden hour soft sunlight', 'overcast skylight', 'practical lights visible in frame'],
        advanced: ['subtle rim light separating subject from background']
      },
      color: {
        primary: 'muted desaturated earth tones',
        modifiers: ['teal shadows, warm highlights', 'cinematic LUT'],
        auxiliary: ['Kodak Vision3 500T color science', 'subtle color separation'],
        forbidden: ['highly saturated', 'vivid colors']
      },
      material: {
        primary: ['subsurface scattering', 'individual hair strands visible', 'skin pores visible', 'fabric weave texture'],
        auxiliary: ['subtle imperfections', 'microscopic surface detail'],
        advanced: ['dust particles in sunlight', 'tiny water droplets on skin']
      },
      motion: {
        primary: ['motion blur on fast elements', 'wind blowing hair and fabric'],
        auxiliary: ['dust particles floating in air', 'shallow depth breathing motion', 'natural micro-movements'],
        advanced: ['lens flare from practical light', 'handheld camera subtle shake']
      },
      grain: {
        primary: 'subtle film grain',
        auxiliary: ['organic texture', 'RAW quality', 'fine noise structure'],
        forbidden: ['overly clean digital look'],
        advanced: 'Kodak 5219 grain structure'
      }
    };

    // 禁忌词映射表（AI感 → 真实感）
    this.antiPatterns = {
      'perfect skin': 'skin pores visible, subtle imperfections',
      'flawless complexion': 'subsurface scattering, individual hair strands',
      'vivid colors': 'muted desaturated earth tones',
      'highly saturated': 'muted desaturated earth tones',
      'colorful': 'teal shadows, warm highlights',
      'studio lighting': 'natural diffused overcast lighting',
      'perfect lighting': 'natural diffused overcast lighting',
      'professional lighting setup': 'natural diffused overcast with soft shadows',
      'dramatic hard shadows': 'soft shadows, no hard light',
      'everything in sharp focus': 'shallow DOF, f/1.8',
      'deep depth of field': 'shallow DOF, soft bokeh',
      'clean digital look': 'subtle film grain, organic texture',
      'crisp sharp': 'subtle film grain, RAW quality',
      'cinematic': 'Arri Alexa 65, Cooke S7/i', // 泛化词替换为具体器材
      'photorealistic': 'Arri Alexa 65, 65mm sensor, shallow DOF', // 泛化词替换为具体器材
      'static pose': 'natural micro-movements, wind blowing hair',
      'frozen moment': 'motion blur on fast elements, dust particles'
    };

    // 场景化模板
    this.templates = {
      portrait: [
        'Arri Alexa 65', 'Cooke S7/i', 'anamorphic 2.39:1',
        'f/1.8 shallow DOF', 'soft bokeh', 'background falls off smoothly',
        'natural diffused overcast', 'soft shadows', 'no hard light',
        'muted desaturated earth tones', 'teal shadows', 'warm highlights',
        'subsurface scattering', 'skin pores visible', 'individual hair strands',
        'subtle imperfections', 'wind blowing hair', 'motion blur on fast movements',
        'subtle film grain', 'organic texture'
      ],
      wildlife: [
        'Arri Alexa Mini LF', 'Master Prime', 'widescreen cinematic',
        'f/2.8 shallow DOF', 'natural diffused overcast', 'soft shadows',
        'muted earth tones', 'individual fur strands visible', 'subsurface scattering on ears and nose',
        'wind blowing fur and grass', 'dust particles in air',
        'motion blur on fast movements', 'documentary wildlife photography style', 'National Geographic',
        'subtle film grain', 'RAW quality'
      ],
      interior: [
        'Arri Alexa 65', 'Cooke S7/i', '2.39:1 anamorphic',
        'f/2.0 shallow DOF', 'natural light through window diffused overcast',
        'soft shadows', 'practical lights visible in frame',
        'muted desaturated warm earth tones', 'teal shadows', 'cinematic LUT',
        'fabric weave texture visible on furniture', 'skin pores on people',
        'subtle film grain', 'organic texture',
        'subtle rim light separating subjects from background'
      ],
      general: [
        'Arri Alexa 65', 'Cooke S7/i', 'anamorphic 2.39:1',
        'f/2.0 shallow DOF', 'natural diffused overcast', 'soft shadows', 'no hard light',
        'muted desaturated earth tones', 'teal shadows', 'warm highlights', 'cinematic LUT',
        'subsurface scattering', 'skin pores visible', 'individual hair strands',
        'subtle imperfections', 'wind blowing hair and fabric',
        'motion blur on fast elements', 'dust particles floating in air',
        'subtle film grain', 'organic texture'
      ],
      minimal: [
        'Arri Alexa 65', 'Cooke S7/i', 'f/2.0',
        'shallow DOF', 'natural diffused overcast',
        'muted earth tones', 'skin pores', 'subsurface scattering',
        'wind motion', 'subtle film grain'
      ]
    };
  }

  /**
   * 主入口：增强视觉提示词
   * @param {string} originalPrompt - 原始视觉提示词
   * @param {object} context - 上下文信息（场景类型、角色等）
   * @returns {string} - 增强后的提示词
   */
  enhance(originalPrompt, context = {}) {
    if (!this.enabled || !originalPrompt) {
      return originalPrompt;
    }

    const sceneType = context.sceneType || this.sceneType || 'general';
    const mode = context.mode || this.mode || 'smart';

    switch (mode) {
      case 'full':
        return this._enhanceFull(originalPrompt, sceneType);
      case 'minimal':
        return this._enhanceMinimal(originalPrompt, sceneType);
      case 'smart':
      default:
        return this._enhanceSmart(originalPrompt, sceneType);
    }
  }

  /**
   * 智能增强：分析现有提示词，补全缺失维度
   */
  _enhanceSmart(originalPrompt, sceneType) {
    // 1. 检查已有维度覆盖度
    const coverage = this._analyzeCoverage(originalPrompt);
    
    // 2. 获取缺失维度的关键词
    const missingKeywords = this._getMissingKeywords(coverage, sceneType);
    
    // 3. 反模式检查（替换AI感词汇）
    let cleanedPrompt = this._replaceAntiPatterns(originalPrompt);
    
    // 4. 追加缺失维度（避免重复）
    const enhancedPrompt = this._mergePrompts(cleanedPrompt, missingKeywords);
    
    return enhancedPrompt;
  }

  /**
   * 全量增强：直接追加完整模板
   */
  _enhanceFull(originalPrompt, sceneType) {
    const template = this.templates[sceneType] || this.templates.general;
    const templateStr = template.join(', ');
    
    // 清理原提示词中的反模式
    const cleanedPrompt = this._replaceAntiPatterns(originalPrompt);
    
    return `${cleanedPrompt}, ${templateStr}`;
  }

  /**
   * 最小增强：仅追加最高ROI关键词
   */
  _enhanceMinimal(originalPrompt, sceneType) {
    const template = this.templates.minimal;
    const templateStr = template.join(', ');
    
    const cleanedPrompt = this._replaceAntiPatterns(originalPrompt);
    
    return `${cleanedPrompt}, ${templateStr}`;
  }

  /**
   * 分析提示词维度覆盖度
   */
  _analyzeCoverage(prompt) {
    const coverage = {
      camera: false, lens: false, aperture: false, lighting: false,
      color: false, material: false, motion: false, grain: false
    };
    
    const lowerPrompt = prompt.toLowerCase();
    
    // 检查各维度
    if (lowerPrompt.includes('arri') || lowerPrompt.includes('red') || lowerPrompt.includes('sony venice')) {
      coverage.camera = true;
    }
    if (lowerPrompt.includes('cooke') || lowerPrompt.includes('master prime') || lowerPrompt.includes('leica') || lowerPrompt.includes('zeiss')) {
      coverage.lens = true;
    }
    if (lowerPrompt.includes('f/') || lowerPrompt.includes('dof') || lowerPrompt.includes('bokeh')) {
      coverage.aperture = true;
    }
    if (lowerPrompt.includes('light') || lowerPrompt.includes('overcast') || lowerPrompt.includes('shadow')) {
      coverage.lighting = true;
    }
    if (lowerPrompt.includes('muted') || lowerPrompt.includes('desaturated') || lowerPrompt.includes('teal') || lowerPrompt.includes('lut')) {
      coverage.color = true;
    }
    if (lowerPrompt.includes('subsurface') || lowerPrompt.includes('pores') || lowerPrompt.includes('hair strands') || lowerPrompt.includes('texture')) {
      coverage.material = true;
    }
    if (lowerPrompt.includes('motion') || lowerPrompt.includes('wind') || lowerPrompt.includes('blur')) {
      coverage.motion = true;
    }
    if (lowerPrompt.includes('grain') || lowerPrompt.includes('texture') || lowerPrompt.includes('raw')) {
      coverage.grain = true;
    }
    
    return coverage;
  }

  /**
   * 获取缺失维度的关键词
   */
  _getMissingKeywords(coverage, sceneType) {
    const keywords = [];
    const dim = this.dimensions;
    
    // 根据场景类型选择不同优先级的关键词
    if (sceneType === 'portrait') {
      if (!coverage.camera) keywords.push(dim.camera.primary[0]);
      if (!coverage.lens) keywords.push(dim.lens.primary[0]);
      if (!coverage.aperture) keywords.push(`f/1.8 ${dim.aperture.modifiers[0]}`);
      if (!coverage.lighting) keywords.push(dim.lighting.primary, dim.lighting.modifiers[1]);
      if (!coverage.color) keywords.push(dim.color.primary, dim.color.modifiers[0]);
      if (!coverage.material) keywords.push(dim.material.primary[0], dim.material.primary[2]);
      if (!coverage.motion) keywords.push(dim.motion.primary[1]);
      if (!coverage.grain) keywords.push(dim.grain.primary);
    } else if (sceneType === 'wildlife') {
      if (!coverage.camera) keywords.push(dim.camera.primary[1]);
      if (!coverage.lens) keywords.push(dim.lens.primary[1]);
      if (!coverage.aperture) keywords.push(`f/2.8 ${dim.aperture.modifiers[0]}`);
      if (!coverage.lighting) keywords.push(dim.lighting.primary);
      if (!coverage.color) keywords.push('muted earth tones');
      if (!coverage.material) keywords.push('individual fur strands visible', 'subsurface scattering on ears');
      if (!coverage.motion) keywords.push('motion blur on fast movements', 'dust particles in air');
      if (!coverage.grain) keywords.push('subtle film grain', 'RAW quality');
    } else {
      // general default
      if (!coverage.camera) keywords.push(dim.camera.primary[0]);
      if (!coverage.lens) keywords.push(dim.lens.primary[0]);
      if (!coverage.aperture) keywords.push(`f/2.0 ${dim.aperture.modifiers[0]}`);
      if (!coverage.lighting) keywords.push(dim.lighting.primary, dim.lighting.modifiers[1]);
      if (!coverage.color) keywords.push(dim.color.primary, dim.color.modifiers[0]);
      if (!coverage.material) keywords.push(dim.material.primary[0]);
      if (!coverage.motion) keywords.push(dim.motion.primary[0]);
      if (!coverage.grain) keywords.push(dim.grain.primary);
    }
    
    return keywords;
  }

  /**
   * 反模式替换：将AI感词汇替换为真实感词汇
   */
  _replaceAntiPatterns(prompt) {
    let result = prompt;
    
    for (const [antiPattern, replacement] of Object.entries(this.antiPatterns)) {
      // 不区分大小写替换，但保留原始大小写风格
      const regex = new RegExp(`\\b${antiPattern}\\b`, 'gi');
      result = result.replace(regex, replacement);
    }
    
    return result;
  }

  /**
   * 合并提示词（避免重复）
   */
  _mergePrompts(original, newKeywords) {
    // 简单拼接，去重逻辑由调用方处理
    const combined = newKeywords.length > 0 
      ? `${original}, ${newKeywords.join(', ')}` 
      : original;
    
    return combined;
  }

  /**
   * 质量检验：评估提示词真实感指数
   */
  evaluate(originalPrompt, enhancedPrompt) {
    const beforeCoverage = this._analyzeCoverage(originalPrompt);
    const afterCoverage = this._analyzeCoverage(enhancedPrompt);
    
    const beforeScore = Object.values(beforeCoverage).filter(Boolean).length;
    const afterScore = Object.values(afterCoverage).filter(Boolean).length;
    
    return {
      beforeScore,
      afterScore,
      improvement: afterScore - beforeScore,
      coverageBefore: beforeCoverage,
      coverageAfter: afterCoverage,
      isEnhanced: afterScore > beforeScore
    };
  }

  /**
   * 批量增强（用于pipeline批量处理）
   */
  enhanceBatch(shots, context = {}) {
    return shots.map((shot, index) => {
      const sceneType = this._detectSceneType(shot, context);
      const enhanced = this.enhance(shot.visualPrompt || '', {
        ...context,
        sceneType,
        shotIndex: index
      });
      
      return {
        ...shot,
        visualPrompt: enhanced,
        _realismEnhancement: {
          original: shot.visualPrompt,
          sceneType,
          enabled: this.enabled
        }
      };
    });
  }

  /**
   * 自动检测场景类型
   */
  _detectSceneType(shot, context) {
    // 优先使用上下文指定的场景类型
    if (context.sceneType && this.templates[context.sceneType]) {
      return context.sceneType;
    }
    
    // 根据镜头内容推断
    const prompt = (shot.visualPrompt || shot.description || '').toLowerCase();
    const sceneTypes = shot.sceneType || shot.type || '';
    
    if (sceneTypes.includes('animal') || sceneTypes.includes('wildlife') || 
        prompt.includes('animal') || prompt.includes('wildlife') || prompt.includes('狮子')) {
      return 'wildlife';
    }
    
    if (sceneTypes.includes('interior') || sceneTypes.includes('indoor') ||
        prompt.includes('室内') || prompt.includes('room') || prompt.includes('house')) {
      return 'interior';
    }
    
    // 默认肖像/人物
    return 'portrait';
  }
}

module.exports = { RealismPromptEnhancer };
