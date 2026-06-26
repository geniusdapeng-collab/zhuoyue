/**
 * Commercial Mode - 商业广告片专业模式
 * 
 * 核心原则: "产品才是主角，整个剧情为产品服务"
 * 
 * 广告片结构:
 * 1. Hook (0-3s): 强力开场，3秒抓住注意力
 * 2. Problem (3-8s): 痛点呈现，建立共鸣
 * 3. Solution (8-18s): 产品登场，核心卖点展示
 * 4. Proof (18-25s): 效果证明，信任建立
 * 5. CTA (25-30s): 行动号召，品牌强化
 * 
 * @version v1.0
 * @priority P0 - 商业模式
 */

class CommercialMode {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.product = options.product || null;
    this.brand = options.brand || null;
    this.sellingPoints = options.sellingPoints || [];
    this.brandColor = options.brandColor || null;
    this.targetAudience = options.targetAudience || null;
    this.platform = options.platform || 'tv';
    
    // 广告片结构模板
    this.structure = {
      hook: {
        duration: 3,
        purpose: 'grab_attention',
        elements: ['强力视觉', '悬念', '冲突', '惊艳画面'],
        promptTemplate: '【Hook开场】视觉冲击力极强,画面极具张力,3秒内抓住观众注意力,情绪瞬间被点燃'
      },
      problem: {
        duration: 5,
        purpose: 'build_empathy',
        elements: ['痛点场景', '情绪共鸣', '问题呈现'],
        promptTemplate: '【痛点呈现】生活化场景,真实感强,观众产生"这就是我"的共鸣,情绪被带入'
      },
      solution: {
        duration: 10,
        purpose: 'show_product',
        elements: ['产品登场', '核心卖点', '使用场景', '效果展示'],
        promptTemplate: '【产品登场】产品处于画面绝对中心,光线聚焦产品,细节清晰可见,卖点直观展示'
      },
      proof: {
        duration: 7,
        purpose: 'build_trust',
        elements: ['效果对比', '数据展示', '用户证言', '权威背书'],
        promptTemplate: '【效果证明】前后对比明显,效果震撼,可信度强,说服力十足'
      },
      cta: {
        duration: 5,
        purpose: 'call_to_action',
        elements: ['品牌LOGO', 'Slogan', '购买引导', '联系方式'],
        promptTemplate: '【行动号召】品牌LOGO醒目,Slogan有力,画面大气,品牌记忆点深刻'
      }
    };
    
    // 商业广告规范
    this.commercialRules = {
      // 产品始终处于视觉中心
      productCenter: '产品始终处于画面视觉中心位置,构图围绕产品展开',
      // 光线聚焦
      lightingFocus: '主光源聚焦产品,产品亮度高于背景20%,轮廓光勾勒产品边缘',
      // 背景虚化
      backgroundBlur: '背景适度虚化(Bokeh效果),突出产品主体,景深控制精准',
      // 品牌色调
      brandColor: '品牌色调贯穿全片,色彩占比30%-50%,形成视觉记忆',
      // 画面简洁
      simplicity: '画面简洁大气,留白适度,拒绝杂乱,每帧都是海报级',
      // 质感优先
      texture: '材质细节清晰可见,金属反光/玻璃折射/织物纹理/皮革毛孔',
      // 高级感
      premium: '高级感色调,低饱和度+高对比度,电影级调色,画面通透'
    };
    
    // 卖点展示策略
    this.sellingPointStrategies = {
      visual: {
        name: '视觉展示',
        description: '通过画面直观展示产品外观/设计/工艺',
        prompt: '产品外观精美,设计感十足,工艺精湛,细节完美'
      },
      function: {
        name: '功能演示',
        description: '展示产品核心功能和使用方式',
        prompt: '产品功能直观展示,使用场景真实,操作流畅自然,效果立竿见影'
      },
      comparison: {
        name: '对比展示',
        description: '与竞品或旧方案对比',
        prompt: '前后对比鲜明,优势一目了然,说服力极强'
      },
      emotion: {
        name: '情感共鸣',
        description: '通过情感故事建立连接',
        prompt: '情感真实动人,故事引人入胜,品牌温度传递到位'
      },
      authority: {
        name: '权威背书',
        description: '专家/数据/认证背书',
        prompt: '权威感十足,数据可视化,认证标识醒目,专业可信'
      }
    };
  }

  /**
   * 生成商业广告片剧本结构
   */
  generateStructure(duration = 30) {
    const structure = [];
    let currentTime = 0;
    
    // Hook - 开场
    const hookDuration = Math.min(3, duration * 0.1);
    structure.push({
      phase: 'hook',
      startTime: currentTime,
      duration: hookDuration,
      endTime: currentTime + hookDuration,
      ...this.structure.hook
    });
    currentTime += hookDuration;
    
    // Problem - 痛点
    const problemDuration = Math.min(5, duration * 0.15);
    structure.push({
      phase: 'problem',
      startTime: currentTime,
      duration: problemDuration,
      endTime: currentTime + problemDuration,
      ...this.structure.problem
    });
    currentTime += problemDuration;
    
    // Solution - 产品
    const solutionDuration = Math.min(10, duration * 0.35);
    structure.push({
      phase: 'solution',
      startTime: currentTime,
      duration: solutionDuration,
      endTime: currentTime + solutionDuration,
      ...this.structure.solution
    });
    currentTime += solutionDuration;
    
    // Proof - 证明
    const proofDuration = Math.min(7, duration * 0.25);
    structure.push({
      phase: 'proof',
      startTime: currentTime,
      duration: proofDuration,
      endTime: currentTime + proofDuration,
      ...this.structure.proof
    });
    currentTime += proofDuration;
    
    // CTA - 号召
    const ctaDuration = duration - currentTime;
    structure.push({
      phase: 'cta',
      startTime: currentTime,
      duration: ctaDuration,
      endTime: duration,
      ...this.structure.cta
    });
    
    return structure;
  }

  /**
   * 生成商业广告规范Prompt
   */
  generateCommercialPrompt() {
    const rules = Object.values(this.commercialRules);
    return `【商业广告规范】${rules.join(' | ')}`;
  }

  /**
   * 为镜头生成商业增强Prompt
   */
  enhanceShotPrompt(shot, prompt) {
    if (!this.enabled) return prompt;
    
    const phase = shot.phase || 'solution';
    const phaseConfig = this.structure[phase];
    
    if (!phaseConfig) return prompt;
    
    // 注入阶段特定Prompt
    let enhanced = prompt;
    
    // 注入商业规范
    enhanced += ` | ${this.generateCommercialPrompt()}`;
    
    // 注入阶段模板
    enhanced += ` | ${phaseConfig.promptTemplate}`;
    
    // 注入卖点展示
    if (this.sellingPoints.length > 0 && phase === 'solution') {
      const point = this.sellingPoints[0];
      const strategy = this.sellingPointStrategies[point.type] || this.sellingPointStrategies.visual;
      enhanced += ` | 【卖点展示】${strategy.prompt}`;
    }
    
    // 注入品牌色调
    if (this.brandColor) {
      enhanced += ` | 【品牌色调】主色调为${this.brandColor},贯穿全片`;
    }
    
    return enhanced;
  }

  /**
   * 标记镜头为商业广告相位
   */
  markShotPhase(shots, structure) {
    return shots.map((shot, index) => {
      // 根据时间位置确定相位
      const shotTime = shot.startTime || 0;
      const phase = structure.find(s => 
        shotTime >= s.startTime && shotTime < s.endTime
      );
      
      return {
        ...shot,
        phase: phase?.phase || 'solution',
        phasePurpose: phase?.purpose || 'show_product'
      };
    });
  }

  /**
   * 获取产品展示运镜指令
   */
  getProductCameraMoves() {
    return [
      '平滑Dolly推进,焦点锁定产品',
      '360度环绕展示,产品始终处于画面中心',
      '微距推进,展示产品材质细节',
      '悬浮旋转,展示产品多角度',
      '轨道横移,产品细节逐一展现',
      '俯拍展示产品整体,仰拍展示产品气势'
    ];
  }
}

module.exports = { CommercialMode };
