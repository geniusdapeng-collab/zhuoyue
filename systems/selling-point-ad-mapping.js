/**
 * Selling Point to Ad Deep Mapping - 卖点到广告的深度映射系统
 * 
 * v6.8.1: 核心基础设施
 * 将商品卖点从"文字列表"升级为"广告基因包"——每个卖点包含：
 * - 广告阶段映射（Hook/Problem/Solution/Proof/CTA）
 * - 镜头类型映射（A-roll/B-roll/混合）
 * - 运镜策略映射（具体运镜方案）
 * - 特效策略映射（光效/粒子/文字动画等）
 * - 音频策略映射（BGM风格/音效/节奏）
 * - 视觉复杂度映射（低/中/高）
 * - 时长分配映射（建议秒数）
 * - 情绪曲线映射（情绪起伏设计）
 * 
 * 核心价值：从"人读卖点→人写剧本"升级为"卖点自动驱动全链路"
 * 
 * @version v1.0
 * @priority P0 - 深度集成核心
 */

class SellingPointAdMapping {
  constructor() {
    // 卖点类型 → 广告阶段映射
    this.phaseMapping = {
      // 功能卖点 → Solution（产品展示）
      function: { primaryPhase: 'solution', secondaryPhase: 'proof', weight: 1.0 },
      // 视觉卖点 → Solution/Proof（品牌信任）
      visual: { primaryPhase: 'proof', secondaryPhase: 'solution', weight: 0.8 },
      // USP卖点 → Hook/Solution（核心卖点）
      usp: { primaryPhase: 'solution', secondaryPhase: 'hook', weight: 1.0 },
      // 价格卖点 → CTA（行动号召）
      price: { primaryPhase: 'cta', secondaryPhase: 'proof', weight: 0.9 },
      // 社交证明 → Proof（信任建立）
      social_proof: { primaryPhase: 'proof', secondaryPhase: 'cta', weight: 0.7 },
      // 情感卖点 → Hook/Problem（情感共鸣）
      emotion: { primaryPhase: 'hook', secondaryPhase: 'problem', weight: 0.8 },
      // 理性卖点 → Proof（数据说服）
      rational: { primaryPhase: 'proof', secondaryPhase: 'solution', weight: 0.8 },
      // 技术卖点 → Solution（技术展示）
      tech: { primaryPhase: 'solution', secondaryPhase: 'proof', weight: 0.9 }
    };

    // 卖点类型 → 镜头类型映射
    this.shotTypeMapping = {
      function: { primary: 'a-roll', secondary: 'b-roll', ratio: '7:3' },
      visual: { primary: 'b-roll', secondary: 'a-roll', ratio: '3:7' },
      usp: { primary: 'a-roll', secondary: 'b-roll', ratio: '8:2' },
      price: { primary: 'a-roll', secondary: 'a-roll', ratio: '10:0' },
      social_proof: { primary: 'b-roll', secondary: 'a-roll', ratio: '6:4' },
      emotion: { primary: 'b-roll', secondary: 'a-roll', ratio: '7:3' },
      rational: { primary: 'a-roll', secondary: 'b-roll', ratio: '6:4' },
      tech: { primary: 'a-roll', secondary: 'a-roll', ratio: '9:1' }
    };

    // 卖点类型 → 运镜策略映射
    this.cameraMoveMapping = {
      function: {
        primary: 'product_hero_shot',
        alternatives: ['product_reveal', '360_orbit', 'macro_detail'],
        description: '产品Hero Shot，突出功能展示'
      },
      visual: {
        primary: 'detail_push',
        alternatives: ['slow_push', 'texture_close_up'],
        description: '细节推进，展示设计美感'
      },
      usp: {
        primary: 'hero_shot_with_text',
        alternatives: ['dramatic_reveal', 'exploded_view'],
        description: 'Hero Shot + 文字叠加，强调USP'
      },
      price: {
        primary: 'text_focus',
        alternatives: ['price_animation', 'split_screen'],
        description: '价格信息聚焦，动态展示'
      },
      social_proof: {
        primary: 'testimonial',
        alternatives: ['user_scenario', 'review_overlay'],
        description: '证言镜头，真实感'
      },
      emotion: {
        primary: 'emotional_dolly',
        alternatives: ['slow_push', 'aerial_reveal'],
        description: '情感推拉，营造氛围'
      },
      rational: {
        primary: 'data_visualization',
        alternatives: ['comparison_split', 'info_graphic'],
        description: '数据可视化，理性说服'
      },
      tech: {
        primary: 'tech_exploded',
        alternatives: ['x_ray_reveal', 'animation_overlay'],
        description: '技术拆解展示，科技感'
      }
    };

    // 卖点类型 → 特效策略映射
    this.vfxMapping = {
      function: {
        primary: ['glow', 'depth_of_field', 'particle_clean'],
        secondary: ['light_rays', 'sharpening'],
        description: '辉光+景深，突出产品功能'
      },
      visual: {
        primary: ['glow', 'bokeh', 'color_grade_premium'],
        secondary: ['film_grain', 'soft_focus'],
        description: '高级感光效，设计美学'
      },
      usp: {
        primary: ['glow', 'text_animation', 'particle_burst'],
        secondary: ['light_rays', 'chromatic_aberration'],
        description: '辉光+文字动画+粒子爆发，强调核心卖点'
      },
      price: {
        primary: ['text_glow', 'price_flash', 'discount_animation'],
        secondary: ['particle_sparkle', 'shine'],
        description: '文字辉光+价格闪烁，吸引注意'
      },
      social_proof: {
        primary: ['text_overlay', 'star_rating', 'review_badge'],
        secondary: ['warm_glow', 'soft_focus'],
        description: '文字浮层+星级+徽章，增强信任'
      },
      emotion: {
        primary: ['warm_glow', 'soft_focus', 'color_grade_warm'],
        secondary: ['light_leak', 'film_grain'],
        description: '温暖辉光+柔焦，情感共鸣'
      },
      rational: {
        primary: ['text_animation', 'chart_animation', 'data_glow'],
        secondary: ['grid_overlay', 'holographic'],
        description: '文字动画+图表动画，数据说服'
      },
      tech: {
        primary: ['holographic', 'scan_line', 'circuit_glow'],
        secondary: ['particle_tech', 'laser_effect'],
        description: '全息+扫描线+电路光效，科技感'
      }
    };

    // 卖点类型 → 音频策略映射
    this.audioMapping = {
      function: {
        bgmStyle: 'tech_upbeat',
        sfx: ['product_click', 'mechanical', 'success'],
        rhythm: 'medium',
        description: '科技轻快BGM + 产品音效'
      },
      visual: {
        bgmStyle: 'elegant_calm',
        sfx: ['soft_chime', 'elegant_swish'],
        rhythm: 'slow',
        description: '优雅平静BGM + 轻柔音效'
      },
      usp: {
        bgmStyle: 'epic_building',
        sfx: ['impact', 'whoosh', 'triumph'],
        rhythm: 'building',
        description: '史诗渐进BGM + 冲击音效'
      },
      price: {
        bgmStyle: 'upbeat_exciting',
        sfx: ['cash_register', 'celebration', 'brand_sonic'],
        rhythm: 'fast',
        description: '兴奋轻快BGM + 庆祝音效'
      },
      social_proof: {
        bgmStyle: 'warm_trust',
        sfx: ['positive_ding', 'approval', 'heart'],
        rhythm: 'medium',
        description: '温暖信任BGM + 正面音效'
      },
      emotion: {
        bgmStyle: 'emotional_piano',
        sfx: ['soft_breath', 'ambient', 'heart_beat'],
        rhythm: 'slow',
        description: '情感钢琴BGM + 环境音效'
      },
      rational: {
        bgmStyle: 'tech_precise',
        sfx: ['data_tick', 'mechanical', 'precise_click'],
        rhythm: 'precise',
        description: '科技精准BGM + 数据音效'
      },
      tech: {
        bgmStyle: 'futuristic',
        sfx: ['digital_beep', 'scan', 'tech_hum'],
        rhythm: 'medium',
        description: '未来感BGM + 科技音效'
      }
    };

    // 卖点类型 → 视觉复杂度映射
    this.complexityMapping = {
      function: 'high',
      visual: 'medium',
      usp: 'high',
      price: 'medium',
      social_proof: 'low',
      emotion: 'medium',
      rational: 'medium',
      tech: 'high'
    };

    // 卖点类型 → 建议时长映射
    this.durationMapping = {
      function: { min: 3, max: 5, recommended: 4 },
      visual: { min: 2, max: 3, recommended: 2 },
      usp: { min: 3, max: 5, recommended: 4 },
      price: { min: 2, max: 4, recommended: 3 },
      social_proof: { min: 2, max: 3, recommended: 2 },
      emotion: { min: 2, max: 4, recommended: 3 },
      rational: { min: 2, max: 3, recommended: 2 },
      tech: { min: 3, max: 5, recommended: 4 }
    };

    // 卖点类型 → 情绪曲线映射
    this.emotionMapping = {
      function: { start: 'curious', peak: 'impressed', end: 'confident' },
      visual: { start: 'appreciative', peak: 'admiring', end: 'desiring' },
      usp: { start: 'interested', peak: 'excited', end: 'convinced' },
      price: { start: 'tempted', peak: 'urgent', end: 'decisive' },
      social_proof: { start: 'skeptical', peak: 'trustful', end: 'reassured' },
      emotion: { start: 'empathetic', peak: 'moved', end: 'connected' },
      rational: { start: 'analytical', peak: 'convinced', end: 'confident' },
      tech: { start: 'curious', peak: 'amazed', end: 'impressed' }
    };
  }

  /**
   * 为卖点注入广告基因（核心方法）
   * 输入：原始卖点 { type, content, source, priority }
   * 输出：完整广告基因包 { ... + adPhase + shotType + cameraMove + vfx + audio + ... }
   */
  enrich(sellingPoint) {
    const type = sellingPoint.type;
    
    if (!this.phaseMapping[type]) {
      console.warn(`[SellingPointMapping] 未知卖点类型: ${type}，使用默认映射`);
      return this._defaultEnrich(sellingPoint);
    }

    return {
      ...sellingPoint,
      // 广告阶段
      adPhase: this.phaseMapping[type].primaryPhase,
      adPhaseSecondary: this.phaseMapping[type].secondaryPhase,
      adWeight: this.phaseMapping[type].weight,
      
      // 镜头类型
      shotType: this.shotTypeMapping[type].primary,
      shotTypeSecondary: this.shotTypeMapping[type].secondary,
      shotRatio: this.shotTypeMapping[type].ratio,
      
      // 运镜策略
      cameraMove: this.cameraMoveMapping[type].primary,
      cameraMoveAlternatives: this.cameraMoveMapping[type].alternatives,
      cameraMoveDescription: this.cameraMoveMapping[type].description,
      
      // 特效策略
      vfxPrimary: this.vfxMapping[type].primary,
      vfxSecondary: this.vfxMapping[type].secondary,
      vfxDescription: this.vfxMapping[type].description,
      
      // 音频策略
      audioBGM: this.audioMapping[type].bgmStyle,
      audioSFX: this.audioMapping[type].sfx,
      audioRhythm: this.audioMapping[type].rhythm,
      audioDescription: this.audioMapping[type].description,
      
      // 视觉复杂度
      visualComplexity: this.complexityMapping[type],
      
      // 建议时长
      suggestedDuration: this.durationMapping[type].recommended,
      durationRange: this.durationMapping[type],
      
      // 情绪曲线
      emotionCurve: this.emotionMapping[type]
    };
  }

  /**
   * 批量为卖点注入广告基因
   */
  enrichAll(sellingPoints) {
    return sellingPoints.map(sp => this.enrich(sp));
  }

  /**
   * 按广告阶段分组（用于剧本生成）
   */
  groupByPhase(enrichedPoints) {
    const groups = {
      hook: [],
      problem: [],
      solution: [],
      proof: [],
      cta: []
    };

    enrichedPoints.forEach(point => {
      const phase = point.adPhase;
      if (groups[phase]) {
        groups[phase].push(point);
      }
    });

    return groups;
  }

  /**
   * 生成广告阶段分配报告
   */
  generatePhaseReport(enrichedPoints) {
    const groups = this.groupByPhase(enrichedPoints);
    const total = enrichedPoints.length;
    
    const report = {
      totalPoints: total,
      phaseDistribution: {},
      recommendations: []
    };

    for (const [phase, points] of Object.entries(groups)) {
      const count = points.length;
      const percentage = Math.round((count / total) * 100);
      report.phaseDistribution[phase] = {
        count,
        percentage,
        points: points.map(p => ({ type: p.type, content: p.content.slice(0, 30) }))
      };

      // 生成建议
      if (phase === 'hook' && count === 0) {
        report.recommendations.push('⚠️ Hook阶段缺少卖点，建议添加情感卖点或核心USP');
      }
      if (phase === 'solution' && count < 2) {
        report.recommendations.push('⚠️ Solution阶段卖点不足，建议增加功能卖点');
      }
      if (phase === 'cta' && count === 0) {
        report.recommendations.push('⚠️ CTA阶段缺少卖点，建议添加价格卖点');
      }
    }

    return report;
  }

  /**
   * 生成镜头分配方案（用于故事板）
   */
  generateShotPlan(enrichedPoints, totalDuration) {
    const groups = this.groupByPhase(enrichedPoints);
    const plan = [];
    let currentTime = 0;

    // 按广告阶段顺序生成镜头
    const phaseOrder = ['hook', 'problem', 'solution', 'proof', 'cta'];
    
    phaseOrder.forEach(phase => {
      const points = groups[phase];
      if (points.length === 0) return;

      // 计算该阶段总时长
      const phaseDuration = points.reduce((sum, p) => sum + p.suggestedDuration, 0);
      const phaseRatio = phaseDuration / enrichedPoints.reduce((sum, p) => sum + p.suggestedDuration, 0);
      const allocatedDuration = Math.round(totalDuration * phaseRatio);

      points.forEach((point, idx) => {
        const shotDuration = Math.round(
          allocatedDuration * (point.suggestedDuration / phaseDuration)
        );

        plan.push({
          phase,
          shotIndex: plan.length + 1,
          startTime: currentTime,
          duration: shotDuration,
          endTime: currentTime + shotDuration,
          sellingPoint: point,
          shotType: point.shotType,
          cameraMove: point.cameraMove,
          vfx: point.vfxPrimary,
          audio: point.audioBGM,
          emotion: point.emotionCurve
        });

        currentTime += shotDuration;
      });
    });

    return plan;
  }

  /**
   * 生成Prompt注入指令（用于Stage-11渲染）
   */
  generatePromptInjection(enrichedPoint) {
    const injections = [];

    // 1. 运镜注入
    if (enrichedPoint.cameraMove) {
      injections.push(`【运镜】${enrichedPoint.cameraMoveDescription}(${enrichedPoint.cameraMove})`);
    }

    // 2. 特效注入
    if (enrichedPoint.vfxPrimary && enrichedPoint.vfxPrimary.length > 0) {
      injections.push(`【特效】${enrichedPoint.vfxPrimary.join(' + ')}`);
    }

    // 3. 音频注入
    if (enrichedPoint.audioBGM) {
      injections.push(`【音频】${enrichedPoint.audioDescription}(${enrichedPoint.audioBGM})`);
    }

    // 4. 情绪注入
    if (enrichedPoint.emotionCurve) {
      const ec = enrichedPoint.emotionCurve;
      injections.push(`【情绪】${ec.start}→${ec.peak}→${ec.end}`);
    }

    // 5. 品牌一致性注入（如果是产品展示）
    if (enrichedPoint.shotType === 'a-roll') {
      injections.push(`【品牌】产品始终处于画面中心，品牌色贯穿`);
    }

    return injections.join(' | ');
  }

  /**
   * 默认映射（未知类型）
   */
  _defaultEnrich(sellingPoint) {
    return {
      ...sellingPoint,
      adPhase: 'solution',
      adPhaseSecondary: 'proof',
      adWeight: 0.5,
      shotType: 'a-roll',
      shotTypeSecondary: 'b-roll',
      shotRatio: '5:5',
      cameraMove: 'standard',
      cameraMoveAlternatives: ['pan', 'tilt'],
      cameraMoveDescription: '标准运镜',
      vfxPrimary: ['glow'],
      vfxSecondary: ['sharpening'],
      vfxDescription: '基础辉光',
      audioBGM: 'upbeat',
      audioSFX: ['soft'],
      audioRhythm: 'medium',
      audioDescription: '轻快BGM',
      visualComplexity: 'medium',
      suggestedDuration: 3,
      durationRange: { min: 2, max: 4, recommended: 3 },
      emotionCurve: { start: 'neutral', peak: 'interested', end: 'positive' }
    };
  }
}

module.exports = { SellingPointAdMapping };
