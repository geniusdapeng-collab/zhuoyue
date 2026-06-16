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

    // 金色光影五维参数库（v2.0 通用版）
    this.goldLightingDimensions = {
      // 2.1 轮廓逆光 (Rim Backlight)
      rimBacklight: {
        intensity: ['0.6 subtle rim', '0.75 elegant glow', '0.85 dramatic halo', '0.95 sacred aura', '1.0 silhouette'],
        colorTemp: ['4000K', '4500K', '5500K'],
        direction: ['15° above behind', '30° side behind', '45° low behind'],
        template: '{intensity} golden rim backlight from {direction}, luminous edge glow outlining {subject}, warm champagne gold rim color, subtle golden aura surrounding {subject}, clean separation from background'
      },
      // 2.2 体积光/上帝光 (Volumetric God Rays)
      volumetricLight: {
        opening: ['cloud gap', 'window', 'skylight', 'canopy gap'],
        direction: ['vertical 80°-90°', 'diagonal 45°-60°'],
        density: ['low subtle haze', 'medium soft beams', 'high dramatic shafts'],
        gradient: ['white to warm gold', 'top white to bottom warm gold'],
        template: 'volumetric {intensity} light beams piercing through {medium} from {opening}, god rays descending through atmospheric haze, particles of light visible in beam, {gradient} color gradient along beam length'
      },
      // 2.3 漫射柔光 (Diffused Ambient)
      diffusedAmbient: {
        ratio: ['1:1', '1:1.2', '1:1.5'],
        shadowOpacity: ['80%', '85%', '90%', '95%'],
        colorTemp: ['5500K', '6500K', '7500K'],
        template: 'soft diffused ambient lighting from {source}, extremely gentle shadow transitions, no harsh shadows, no visible light source, seamless tonal gradation, ethereal and weightless atmosphere, {colorTemp} white balance'
      },
      // 2.4 微粒金光 (Particulate Gold)
      particulateGold: {
        density: ['sparse', 'scattered', 'medium', 'dense'],
        particleType: ['dust-like', 'pollen', 'sparkle', 'bokeh'],
        motion: ['static', 'floating', 'rising', 'swirling'],
        glowMode: ['lit-only', 'self-glow', 'both'],
        depthDistribution: { front: 20, mid: 50, back: 30 },
        template: '{particleType} of golden light {motion} in air, {density} distribution, {glowMode} in light beams, creating depth layers, subtle magical atmosphere'
      },
      // 2.5 反射映射 (Reflective Mapping)
      reflectiveMapping: {
        surface: ['marble', 'water', 'glass', 'metal', 'silk'],
        intensity: ['subtle 0.2-0.3', 'moderate 0.4-0.6', 'strong 0.7-0.9'],
        clarity: ['blurred', 'soft', 'sharp'],
        colorShift: ['warm gold', 'neutral', 'cool blue'],
        template: '{surface} surface reflecting {reflectionColor} light, {clarity} reflection quality, golden light bounce creating subtle warm glow, expanded sense of space through reflection'
      }
    };

    // 金色色彩分级体系（v2.0 通用版）
    this.goldColorSystem = {
      // 3.1 三层金色模型
      threeLayerGold: {
        ambientGold: { saturation: '10-25%', lightness: '75-90%', area: '50-70%' },
        structuralGold: { saturation: '35-55%', lightness: '55-75%', area: '15-25%' },
        highlightGold: { saturation: '55-80%', lightness: '85-100%', area: '5-15%' },
        maxTotalArea: '30%'
      },
      // 3.2 金色色温情绪谱
      goldTemperatureEmotion: {
        sacred: { hue: '偏黄', hex: '#D4A574', temp: '4500K', light: '高轮廓光+体积光+冷暗部' },
        dreamy: { hue: '偏玫瑰', hex: '#E8B4A2', temp: '3800K', light: '柔光漫射+微粒金光+浅景深' },
        cool: { hue: '偏白金', hex: '#E5DCC3', temp: '6200K', light: '均匀漫射+冷轮廓+极简构图' },
        epic: { hue: '偏暗赭', hex: '#B8860B', temp: '5200K', light: '侧光硬阴影+暖暗部+大景别' },
        passionate: { hue: '偏橙', hex: '#E8985E', temp: '3500K', light: '高对比+硬光+动态光效' },
        futuristic: { hue: '偏柠檬', hex: '#F0E68C', temp: '5800K', light: '冷主光+金轮廓+数据粒子' },
        organic: { hue: '偏草金', hex: '#C9B037', temp: '4800K', light: '自然光+漫射+环境反射' }
      },
      // 3.3 "白灰金"通用配色公式
      whiteGrayGoldFormula: {
        white: '60-75%',
        gray: '8-15%',
        gold: '15-25%',
        accent: '0-5%'
      },
      // 3.4 暗部压色规范
      shadowColor: {
        coolBlueGray: { hex: '#2C3E50-#4A6274', effect: '冷暖对比，空间深邃', usage: '通用首选' },
        warmBrownGray: { hex: '#4A3C2A-#5C4D3C', effect: '统一暖调，复古质感', usage: '古典/自然' },
        purpleGray: { hex: '#3D2B4E-#5A3D6E', effect: '神秘高贵，戏剧性强', usage: '奢华/奇幻' },
        greenGray: { hex: '#2F4538-#4A6350', effect: '自然有机，宁静感', usage: '生态/茶酒' },
        neutralGray: { hex: '#404040-#5A5A5A', effect: '无色彩倾向，极简', usage: '科技/建筑' }
      }
    };

    // v2.0: 金色光影场景化模板（通用版）
    this.goldTemplates = {
      // 4.1 人像/人物类
      portraitDreamy: [
        'subject in light-colored flowing garments, minimal background',
        'strong golden rim backlight at 30° above behind subject, 0.8 intensity',
        'soft diffused ambient from front-left, extremely gentle shadows',
        'golden particles floating at midground, shallow depth of field',
        'ethereal, serene, timeless',
        'white:gray:gold = 70:10:20',
        'hair and fabric edges glowing with golden rim light'
      ],
      portraitLuxury: [
        'subject against clean white/gray backdrop',
        'precise golden rim light outlining facial bone structure and shoulders',
        'near-shadowless diffused ambient at 1:1.2 ratio',
        'subtle golden reflection in eyes, minimal gold accessories',
        'sophisticated, controlled luxury',
        'white:gray:gold = 75:12:13',
        'sharp but soft rim, no spill onto face center'
      ],
      portraitCinematic: [
        'environmental context with depth layers',
        'golden hour natural backlight through environment',
        'cool blue-gray ambient shadow side',
        'volumetric god rays + floating golden dust',
        'nostalgic, epic, emotional',
        'white:gray:gold = 55:20:25',
        'strong warm/cool contrast on subject'
      ],
      // 4.2 产品/静物类
      productLuxury: [
        'product on reflective white marble surface, soft gradient background',
        'precise golden rim light tracing product silhouette, 0.7 intensity',
        '360° diffused soft light, minimal shadows',
        'golden reflection on surface + subtle sparkle particles',
        'premium, aspirational, meticulous',
        'white:gray:gold = 70:8:22',
        'reflection doubles the golden presence without adding area'
      ],
      productFood: [
        'food on white/cream ceramic surface, minimal props',
        'warm golden side-light at 45° emphasizing texture',
        'soft overhead diffused light',
        'steam/glow with golden particles + reflective sauce highlights',
        'appetizing, warm, artisanal',
        'white:gray:gold = 65:10:25',
        'golden light makes food appear warmer and fresher'
      ],
      productTech: [
        'device floating in white void, subtle geometric elements',
        'cool white main light + golden accent rim on edges',
        'evenly diffused ambient, clinical precision',
        'golden UI elements reflecting on surface + data particles',
        'futuristic, premium tech, clean luxury',
        'white:gray:gold = 75:10:12',
        'gold leans lemon (#F0E68C), not warm orange'
      ],
      // 4.3 建筑/空间类
      architectureSacred: [
        'grand interior with white/cream surfaces, tall vertical space',
        'vertical god ray from ceiling opening, central dominant beam',
        'ambient golden bounce from floor and walls',
        'golden structural details + particle rain in light beam',
        'majestic, sacred, transcendent',
        'white:gray:gold = 65:10:25',
        'symmetrical composition, central light as axis'
      ],
      architectureModern: [
        'clean geometric white concrete/glass structure',
        'golden hour sunlight grazing surfaces at low angle',
        'soft sky ambient filling shadows with cool blue-gray',
        'golden light on one facade, cool shadow on opposite',
        'serene, monumental, timeless',
        'white:gray:gold = 70:15:15',
        'strong warm/cool facade contrast'
      ],
      // 4.4 自然/风景类
      natureClouds: [
        'cloud layers or atmospheric vista with white/gray dominant',
        'golden hour backlight illuminating cloud edges from behind',
        'soft ambient sky light, blue-gray shadow areas',
        'golden rim on cloud formations + god rays through gaps',
        'ethereal, infinite, transcendent',
        'white:gray:gold = 70:15:15',
        'cloud layers create natural depth planes'
      ],
      natureForest: [
        'forest scene with white mist + dark tree silhouettes',
        'golden light shafts through canopy gaps, volumetric in mist',
        'cool blue-gray shadow under canopy',
        'golden dust/pollen in light beams + backlit leaves',
        'magical, serene, enchanted',
        'white:gray:gold = 50:25:25',
        'darker base makes golden light more dramatic'
      ]
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
    
    // 5. v2.0: 金色光影软性注入
    const goldEnhanced = this._injectGoldLighting(enhancedPrompt, sceneType);
    
    return goldEnhanced;
  }

  /**
   * v2.0: 金色光影软性注入
   * 基于五维打光体系和金色色彩分级，自动注入光影描述
   */
  _injectGoldLighting(prompt, sceneType) {
    // 检查是否已有金色光影描述
    const hasGoldLighting = /golden|gold|champagne|rim light|god rays|volumetric/i.test(prompt);
    const hasRimLight = /rim light|backlight|edge glow|luminous edge/i.test(prompt);
    const hasVolumetric = /volumetric|god rays|light beams|shafts of light/i.test(prompt);
    const hasDiffused = /diffused|soft ambient|gentle shadow|ethereal/i.test(prompt);
    const hasParticulate = /particles|dust motes|sparkle|bokeh/i.test(prompt);
    
    let goldKeywords = [];
    
    // 根据场景类型选择光影模板
    if (sceneType === 'portrait') {
      if (!hasRimLight) {
        goldKeywords.push('strong golden rim backlight at 30° above behind subject, luminous edge glow');
      }
      if (!hasDiffused) {
        goldKeywords.push('soft diffused ambient from front-left, extremely gentle shadows');
      }
      if (!hasParticulate) {
        goldKeywords.push('golden particles floating at midground, shallow depth of field');
      }
      if (!hasGoldLighting) {
        goldKeywords.push('warm champagne gold and ivory white color palette');
      }
    } else if (sceneType === 'product') {
      if (!hasRimLight) {
        goldKeywords.push('precise golden rim light tracing product silhouette, 0.7 intensity');
      }
      if (!hasDiffused) {
        goldKeywords.push('360° diffused soft light, minimal shadows');
      }
      if (!hasGoldLighting) {
        goldKeywords.push('white:gray:gold = 70:8:22, premium commercial lighting');
      }
    } else if (sceneType === 'architecture') {
      if (!hasVolumetric) {
        goldKeywords.push('volumetric god rays from skylight, golden light shafts');
      }
      if (!hasDiffused) {
        goldKeywords.push('ambient golden bounce from floor and walls');
      }
      if (!hasGoldLighting) {
        goldKeywords.push('white:gray:gold = 65:10:25, majestic sacred lighting');
      }
    } else if (sceneType === 'nature') {
      if (!hasVolumetric) {
        goldKeywords.push('golden light shafts through canopy gaps, volumetric in mist');
      }
      if (!hasRimLight) {
        goldKeywords.push('golden rim backlight on hill ridges, luminous edge glow');
      }
      if (!hasGoldLighting) {
        goldKeywords.push('white:gray:gold = 70:15:15, ethereal nature lighting');
      }
    } else {
      // general 默认
      if (!hasRimLight) {
        goldKeywords.push('subtle golden rim backlight, luminous edge glow separating subject');
      }
      if (!hasDiffused) {
        goldKeywords.push('soft diffused ambient lighting, gentle shadow transitions');
      }
      if (!hasGoldLighting) {
        goldKeywords.push('warm champagne gold and ivory white color palette');
      }
    }
    
    // 添加三层金色控制（确保不超限30%）
    if (!hasGoldLighting) {
      goldKeywords.push('ambient gold 15% + structural gold 20% + highlight gold 10%');
    }
    
    // 添加暗部压色（冷蓝灰）
    if (!/cool shadow|blue-gray|teal shadow|cold shadow/i.test(prompt)) {
      goldKeywords.push('cool blue-gray shadows (#2C3E50), subtle warm/cool contrast');
    }
    
    if (goldKeywords.length > 0) {
      return `${prompt}, ${goldKeywords.join(', ')}`;
    }
    
    return prompt;
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
      color: false, material: false, motion: false, grain: false,
      goldLighting: false, goldColor: false, goldShadow: false
    };
    
    const lowerPrompt = prompt.toLowerCase();
    
    // 检查原有维度
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
    
    // v2.0: 检查金色光影维度
    if (lowerPrompt.includes('golden') || lowerPrompt.includes('gold') || lowerPrompt.includes('champagne') || lowerPrompt.includes('rim light')) {
      coverage.goldLighting = true;
    }
    if (lowerPrompt.includes('white:gray:gold') || lowerPrompt.includes('color palette') || lowerPrompt.includes('three-layer gold')) {
      coverage.goldColor = true;
    }
    if (lowerPrompt.includes('cool shadow') || lowerPrompt.includes('blue-gray') || lowerPrompt.includes('teal shadow') || lowerPrompt.includes('#2C3E50')) {
      coverage.goldShadow = true;
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
