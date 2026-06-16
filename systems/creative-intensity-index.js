/**
 * 创意指数系统 (Creative Intensity Index) v1.0
 * 全局通用模块：解析用户创意需求，生成各模块指令，注入主链路
 *
 * 核心原则：
 * - 只影响"怎么拍"（影视表现层），不影响"拍什么"（内容/事实层）
 * - 默认 0.2（用户不填 = 系统自主，不干预）
 * - 内容防火墙：剧本、台词、医学事实等完全隔离
 */

class CreativeIntensityIndex {
  constructor(options = {}) {
    this.defaultValue = options.defaultValue || 0.2;
    this.maxValue = options.maxValue || 1.0;
    this.minValue = options.minValue || 0.0;
  }

  // ========== 第一层：用户输入解析器 ==========

  /**
   * 解析用户输入中的创意指数
   * 支持：直接数值、模糊语义、默认回退
   */
  parse(input) {
    // 1. 如果 input 本身就是数字
    if (typeof input === 'number') {
      return this._clamp(input);
    }

    // 2. 如果 input 是字符串，尝试提取数值
    if (typeof input === 'string') {
      // 尝试匹配数值（如 "0.7"、"0.5"）
      const numericMatch = input.match(/(0\.\d+|1\.0?)/);
      if (numericMatch) {
        return this._clamp(parseFloat(numericMatch[1]));
      }

      // 尝试语义匹配
      const semanticValue = this._parseSemantic(input);
      if (semanticValue !== null) {
        return this._clamp(semanticValue);
      }
    }

    // 3. 如果 input 是对象，检查 creativeIntensity 字段
    if (typeof input === 'object' && input !== null) {
      if (typeof input.creativeIntensity === 'number') {
        return this._clamp(input.creativeIntensity);
      }
      if (typeof input.creativeIntensity === 'string') {
        return this.parse(input.creativeIntensity);
      }
      // 检查常见同义词
      for (const key of ['creative', 'intensity', 'creativity', '创意', '创意指数']) {
        if (typeof input[key] === 'number') return this._clamp(input[key]);
        if (typeof input[key] === 'string') return this.parse(input[key]);
      }
    }

    // 4. 默认回退
    return this.defaultValue;
  }

  /**
   * 语义解析：将中文描述翻译为数值
   */
  _parseSemantic(text) {
    const semanticMap = {
      // 保守方向 (0.2-0.3)
      '保守': 0.2, '标准': 0.3, '稳': 0.25, '传统': 0.2,
      '正常': 0.2, '默认': 0.2, '基础': 0.25,
      '不要太多创意': 0.3, '稳一点': 0.25, '普通': 0.2,
      '常规': 0.2, '一般': 0.2, '简单': 0.25,

      // 轻度方向 (0.3-0.4)
      '轻度': 0.35, '稍微': 0.35, '一点': 0.35,
      '有点': 0.35, '稍微有': 0.35, '微': 0.3,

      // 中度方向 (0.5-0.6)
      '有点创意': 0.5, '有新意': 0.5, '出彩': 0.6,
      '加点创意': 0.55, '丰富': 0.5, '不错': 0.55,
      '中等': 0.5, '适中': 0.5, '刚好': 0.5,
      '比较好': 0.55, '挺好': 0.55, '可以': 0.5,

      // 深度方向 (0.7-0.8)
      '非常有创意': 0.7, '很出彩': 0.75, '突破': 0.8,
      '大胆': 0.75, '惊艳': 0.8, '极致': 0.85,
      '深度': 0.75, '高级': 0.75, '专业': 0.7,
      '强': 0.75, '厉害': 0.8, '牛逼': 0.8,
      '电影级': 0.75, '好莱坞': 0.8, '大片': 0.8,

      // 极致方向 (0.9-1.0)
      '创意天花板': 0.9, '拉到满': 0.95, '拉满': 0.95,
      '顶级': 0.9, '炸裂': 0.95, '逆天': 0.95,
      '极致': 0.9, '满分': 0.95, '封顶': 0.95,
      '最高': 0.95, '无上限': 0.95, '超神': 0.95,
      '维伦纽瓦': 0.9, '诺兰': 0.9, '王家卫': 0.9,
    };

    // 精确匹配
    if (semanticMap[text]) {
      return semanticMap[text];
    }

    // 模糊匹配：检查文本中包含哪些关键词
    const lowerText = text.toLowerCase();
    let matchedValue = null;
    let matchedKeyword = null;

    for (const [keyword, value] of Object.entries(semanticMap)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        // 选择数值最高的匹配（避免"保守"和"极致"同时匹配时取保守）
        if (matchedValue === null || value > matchedValue) {
          matchedValue = value;
          matchedKeyword = keyword;
        }
      }
    }

    return matchedValue;
  }

  /**
   * 将数值限制在合法范围内
   */
  _clamp(value) {
    return Math.max(this.minValue, Math.min(this.maxValue, value));
  }

  // ========== 第二层：模块选择器 ==========

  /**
   * 14个模块注册表：每个模块有激活阈值和注入Stage
   */
  get MODULE_REGISTRY() {
    return {
      camera:      { threshold: 0.35, stages: ['STAGE-9'],               weight: 0.15, name: '运镜风格' },
      lighting:    { threshold: 0.30, stages: ['STAGE-10', 'STAGE-11'], weight: 0.12, name: '灯光设计' },
      production:  { threshold: 0.40, stages: ['STAGE-5B', 'STAGE-10'], weight: 0.10, name: '美术布景' },
      editing:     { threshold: 0.45, stages: ['STAGE-6', 'STAGE-7'],   weight: 0.08, name: '剪辑节奏' },
      sound:       { threshold: 0.35, stages: ['STAGE-12'],             weight: 0.08, name: '声音设计' },
      color:       { threshold: 0.30, stages: ['STAGE-10', 'STAGE-11'], weight: 0.10, name: '色彩分级' },
      composition: { threshold: 0.35, stages: ['STAGE-9', 'STAGE-10'],  weight: 0.08, name: '构图风格' },
      performance: { threshold: 0.40, stages: ['STAGE-5B'],             weight: 0.07, name: '表演指导' },
      vfx:         { threshold: 0.50, stages: ['STAGE-11'],             weight: 0.05, name: '特效程度' },
      cinematic:   { threshold: 0.45, stages: ['STAGE-9'],             weight: 0.06, name: '镜头语言' },
      atmosphere:  { threshold: 0.35, stages: ['STAGE-10'],             weight: 0.07, name: '氛围营造' },
      texture:     { threshold: 0.55, stages: ['STAGE-11'],             weight: 0.04, name: '质感处理' },
      time:        { threshold: 0.50, stages: ['STAGE-6', 'STAGE-9'],   weight: 0.05, name: '时间操控' },
      space:       { threshold: 0.45, stages: ['STAGE-10'],             weight: 0.06, name: '空间设计' }
    };
  }

  /**
   * 根据指数获取激活的模块列表
   */
  getActiveModules(intensity) {
    const registry = this.MODULE_REGISTRY;
    return Object.entries(registry)
      .filter(([id, config]) => intensity >= config.threshold)
      .map(([id, config]) => ({ id, ...config }));
  }

  /**
   * 获取模块的创意等级 (L0-L5)
   */
  getLevel(intensity) {
    if (intensity <= 0.15) return { key: 'L0', name: '保守' };
    if (intensity <= 0.30) return { key: 'L1', name: '标准' };
    if (intensity <= 0.50) return { key: 'L2', name: '平衡' };
    if (intensity <= 0.70) return { key: 'L3', name: '增强' };
    if (intensity <= 0.85) return { key: 'L4', name: '突破' };
    return { key: 'L5', name: '极致' };
  }

  // ========== 第三层：指令生成器 ==========

  /**
   * 指令模板库：每个模块每个等级对应的具体指令
   */
  get INSTRUCTION_TEMPLATES() {
    return {
      camera: {
        L0: '标准运镜：固定机位、平视角度、无特殊运动',
        L1: '基础运镜：推轨、简单环绕、固定切换',
        L2: '电影级运镜：斯坦尼康长镜头、轨道滑动、浅景深跟随',
        L3: '艺术运镜：低角度仰拍、旋转镜头、长镜头探索',
        L4: '极致运镜：无人机航拍、微距探入、POV主观视角',
        L5: '好莱坞级运镜：维伦纽瓦式史诗构图、诺兰式时间操控、王家卫式抽帧、IMAX画幅'
      },
      lighting: {
        L0: '标准灯光：自然光、均匀照明、无特殊光影',
        L1: '基础灯光：三点布光、柔光、自然光模拟',
        L2: '电影级灯光：戏剧性光影、伦勃朗光、剪影、环境光填充',
        L3: '艺术灯光：霓虹色温、体积光、光绘、投影纹理',
        L4: '极致灯光：德金斯特式黑色电影、罗杰·迪金斯式环境光、光作为叙事角色',
        L5: '大师级灯光：每个场景定制化灯光叙事、光即情绪、光即角色'
      },
      production: {
        L0: '标准布景：简洁背景、功能化道具、最少装饰',
        L1: '基础布景：场景层次、前景遮挡、背景故事化道具',
        L2: '电影级布景：定制化场景、色彩编码空间、沉浸式环境',
        L3: '艺术布景：概念化场景、超现实比例、象征性道具',
        L4: '极致布景：定制化场景建筑、色彩编码空间、沉浸式环境叙事',
        L5: '大师级布景：场景即叙事、空间即角色、环境即情绪'
      },
      editing: {
        L0: '标准剪辑：固定镜头时长、匀速切换',
        L1: '基础剪辑：标准镜头时长、匀速切换',
        L2: '电影级剪辑：情绪匹配时长、紧张处快切、情感处延长',
        L3: '艺术剪辑：变速剪辑、J型L型剪辑、节奏对比',
        L4: '极致剪辑：音乐同步剪辑、帧率切换、时间膨胀/压缩',
        L5: '大师级剪辑：节奏即叙事、剪辑即情绪、时间即角色'
      },
      sound: {
        L0: '标准音频：清晰对白、环境音填充、标准配乐',
        L1: '基础音频：清晰对白、环境音填充、标准配乐',
        L2: '电影级音频：ASMR细节、3D空间音频、情绪配乐',
        L3: '艺术音频：声音景观设计、动态音乐、情绪音效',
        L4: '极致音频：汉斯·季默式史诗配乐、声音作为叙事驱动、每个视觉元素专属音景',
        L5: '大师级音频：声音即叙事、静默即力量、音频即角色'
      },
      color: {
        L0: '标准色彩：自然色温、标准饱和度、白平衡',
        L1: '基础色彩：自然色温、标准饱和度、白平衡',
        L2: '电影级色彩：电影LUT、冷暖对比、单色调色',
        L3: '艺术色彩：赛博朋克色、青橙对比、去饱和+单色强调',
        L4: '极致色彩：维伦纽瓦式琥珀色、王家卫式霓虹色、诺兰式冷蓝、单色世界',
        L5: '大师级色彩：色彩即叙事、色调即情绪、色温即时间'
      },
      composition: {
        L0: '标准构图：三分法、中心对称、标准景别',
        L1: '基础构图：三分法、中心对称、标准景别',
        L2: '电影级构图：框架构图、引导线、前景遮挡、深度层次',
        L3: '艺术构图：极端对称、负空间、几何分割、打破三分法',
        L4: '极致构图：维伦纽瓦式宏大比例、韦斯·安德森式对称、抽象构图',
        L5: '大师级构图：构图即叙事、空间即情绪、画框即世界'
      },
      performance: {
        L0: '标准表演：自然表情、标准肢体语言、专业稳重',
        L1: '基础表演：自然表情、标准肢体语言、专业稳重',
        L2: '电影级表演：情感层次、微表情、眼神变化、手势设计',
        L3: '艺术表演：情绪化表演、即兴感、打破第四面墙、象征性动作',
        L4: '极致表演：方法派表演、情绪爆发、角色化肢体语言、表演即叙事',
        L5: '大师级表演：表演即角色、微表情即情绪、身体即叙事'
      },
      vfx: {
        L0: '无特效',
        L1: '基础特效：粒子光斑、简单过渡、环境粒子',
        L2: '电影级特效：光效粒子、镜头光晕、环境互动粒子',
        L3: '艺术特效：复杂粒子系统、流体模拟、光绘轨迹',
        L4: '极致特效：全息投影、空间扭曲、时间残影、量子可视化',
        L5: '大师级特效：特效即叙事、粒子即情绪、视觉即哲学'
      },
      cinematic: {
        L0: '标准镜头语言：标准景别切换、客观视角',
        L1: '基础镜头语言：标准景别切换、客观视角',
        L2: '电影级镜头语言：主观视角插入、反应镜头、过肩镜头',
        L3: '艺术镜头语言：元叙事镜头、打破第四面墙、观众意识',
        L4: '极致镜头语言：自我反射式电影、多重现实、镜头即角色',
        L5: '大师级镜头语言：镜头即意识、视角即叙事、画框即哲学'
      },
      atmosphere: {
        L0: '标准氛围：轻微雾效、基础环境感',
        L1: '基础氛围：轻微雾效、基础环境感',
        L2: '电影级氛围：环境雾、体积雾、光雾交互、季节感',
        L3: '艺术氛围：超现实氛围、梦境感、时间错位感',
        L4: '极致氛围：塔可夫斯基式诗意、毕赣式梦境、时间流动性',
        L5: '大师级氛围：氛围即叙事、环境即情绪、空气即角色'
      },
      texture: {
        L0: '数字清晰：无特殊质感',
        L1: '基础质感：轻微胶片颗粒、标准锐度',
        L2: '电影级质感：胶片颗粒、柯达2383质感、轻微柔光',
        L3: '艺术质感：16mm胶片感、变形宽银幕、光学瑕疵',
        L4: '极致质感：湿版摄影质感、手绘动画质感、AI生成瑕疵美学',
        L5: '大师级质感：质感即叙事、媒介即情绪、材质即时间'
      },
      time: {
        L0: '标准时间：标准速度、正常时间流',
        L1: '基础时间：标准速度、正常时间流',
        L2: '电影级时间：慢动作强调、快切压缩、时间标记',
        L3: '艺术时间：时间膨胀、时间倒流、平行时间线',
        L4: '极致时间：诺兰式时间操控、时间作为角色、非线性时间',
        L5: '大师级时间：时间即叙事、节奏即情绪、流逝即哲学'
      },
      space: {
        L0: '标准空间：标准景深、单平面构图',
        L1: '基础空间：标准景深、单平面构图',
        L2: '电影级空间：多层景深、前景中景背景、空间层次',
        L3: '艺术空间：超现实空间、不可能几何、空间错位',
        L4: '极致空间：埃舍尔式空间、多维空间、空间作为叙事',
        L5: '大师级空间：空间即叙事、维度即情绪、纵深即哲学'
      }
    };
  }

  /**
   * 为单个模块生成指令
   */
  generateModuleInstruction(moduleId, intensity) {
    const templates = this.INSTRUCTION_TEMPLATES[moduleId];
    if (!templates) return null;

    const level = this.getLevel(intensity);
    const instruction = templates[level.key];

    if (!instruction) return null;

    return {
      tag: `[${moduleId.toUpperCase()}:${level.key}]`,
      instruction,
      level: level.key,
      levelName: level.name,
      intensity,
      weight: this.MODULE_REGISTRY[moduleId]?.weight || 0.1
    };
  }

  /**
   * 为指定 Stage 生成所有需要注入的指令
   */
  generateStageInstructions(stageName, intensity) {
    const activeModules = this.getActiveModules(intensity);
    const stageModules = activeModules.filter(m => m.stages.includes(stageName));

    if (stageModules.length === 0) return null;

    const instructions = stageModules.map(m =>
      this.generateModuleInstruction(m.id, intensity)
    ).filter(Boolean);

    if (instructions.length === 0) return null;

    return {
      stage: stageName,
      intensity,
      level: this.getLevel(intensity),
      count: instructions.length,
      instructions: instructions.map(i => `[${i.tag}] ${i.instruction}`).join('\n'),
      details: instructions
    };
  }

  // ========== 内容防火墙检查 ==========

  /**
   * 检查模块是否为内容层（受防火墙保护）
   */
  isContentModule(moduleId) {
    const contentModules = ['script', 'dialogue', 'facts', 'medical', 'data', 'narrative_content'];
    return contentModules.includes(moduleId);
  }

  /**
   * 生成内容防火墙日志
   */
  generateFirewallLog() {
    return `\n[CONTENT_FIREWALL] 🔒 内容层完全隔离，创意指数无效：
  - 剧本内容 (Script) → 已锁定
  - 台词对白 (Dialogue) → 已锁定
  - 医学事实 (Medical Facts) → 已锁定
  - 科学数据 (Data) → 已锁定
  - 叙事逻辑 (Story Logic) → 已锁定
[CONTENT_FIREWALL] ✅ 表现层接受创意指数调控：运镜、灯光、布景、剪辑、声音、色彩、构图、表演、特效、镜头语言、氛围、质感、时间、空间\n`;
  }

  // ========== 完整报告生成 ==========

  /**
   * 生成创意指数完整报告
   */
  generateReport(intensity) {
    const activeModules = this.getActiveModules(intensity);
    const level = this.getLevel(intensity);

    return {
      intensity,
      level: level.key,
      levelName: level.name,
      activeModules: activeModules.map(m => ({
        id: m.id,
        name: m.name,
        weight: m.weight,
        stages: m.stages,
        instruction: this.generateModuleInstruction(m.id, intensity)
      })),
      inactiveModules: Object.entries(this.MODULE_REGISTRY)
        .filter(([id, config]) => intensity < config.threshold)
        .map(([id, config]) => ({ id, name: config.name, threshold: config.threshold })),
      firewall: this.generateFirewallLog(),
      summary: `创意指数 ${intensity} (${level.name})：已激活 ${activeModules.length}/14 个模块`
    };
  }
}

module.exports = { CreativeIntensityIndex };
