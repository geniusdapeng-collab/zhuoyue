/**
 * VFX System - 后期特效系统
 * 
 * 专业级影视后期特效，让画面达到好莱坞级别
 * 
 * @version v1.0
 * @priority P0 - 特效核心
 */

class VFXSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.intensity = options.intensity || 'medium'; // low/medium/high/cinematic
    
    // 光效系统
    this.lightEffects = {
      lensFlare: {
        name: '镜头光晕',
        description: '光源进入画面时的光晕效果',
        prompt: '镜头光晕自然柔和,光源进入画面时产生唯美光晕,不刺眼,电影级光学质感'
      },
      bokeh: {
        name: '光斑虚化',
        description: '背景散景光斑',
        prompt: '背景Bokeh光斑柔和圆润,虚化自然,光圈形状优美,散景层次丰富,氛围感强'
      },
      godRay: {
        name: '体积光',
        description: '光线穿透介质形成的光束',
        prompt: 'God ray体积光穿透,光线束清晰可见,丁达尔效应,神圣感与氛围感,光影层次丰富'
      },
      lightLeak: {
        name: '漏光',
        description: '胶片漏光效果',
        prompt: '胶片漏光效果自然,边缘光晕温暖,复古胶片感,不干扰主体,增添艺术气息'
      },
      glow: {
        name: '辉光',
        description: '物体边缘发光',
        prompt: '边缘辉光柔和,产品轮廓光勾勒,高级感提升,不刺眼,霓虹或暖光效果'
      }
    };
    
    // 粒子系统
    this.particleEffects = {
      dust: {
        name: '环境尘埃',
        description: '空气中漂浮的微尘',
        prompt: '环境光尘粒子漂浮,空气中有微粒感,光线穿透可见,自然真实,不干扰主体'
      },
      spark: {
        name: '火花粒子',
        description: '火花/火星效果',
        prompt: '火花粒子飞溅,动态轨迹自然,火星闪烁,温度感传递,能量感强烈'
      },
      powder: {
        name: '粉末粒子',
        description: '粉末/烟雾效果',
        prompt: '粉末飘散动态,粒子轨迹自然,烟雾缭绕,质感轻盈,视觉冲击力强'
      },
      liquid: {
        name: '液体粒子',
        description: '水滴/液体飞溅',
        prompt: '液体飞溅动态,水滴晶莹剔透,表面张力可见,慢动作清晰,清凉感/水润感'
      },
      snow: {
        name: '雪花粒子',
        description: '雪花/花瓣飘落',
        prompt: '雪花/花瓣优雅飘落,轨迹自然,旋转翻滚,浪漫氛围,唯美感强'
      }
    };
    
    // 动态图形
    this.motionGraphics = {
      textAnimation: {
        name: '文字动画',
        description: '标题/文字动态出现',
        prompt: '文字优雅入场,动画流畅,字体设计精美,与画面风格统一,品牌调性一致'
      },
      logoReveal: {
        name: 'LOGO揭示',
        description: '品牌LOGO动画展示',
        prompt: '品牌LOGO优雅揭示,动画有记忆点,设计简洁大气,品牌调性突出,结尾定格有力'
      },
      dataViz: {
        name: '数据可视化',
        description: '数据/图表动态展示',
        prompt: '数据可视化动态,图表优雅呈现,信息清晰,动画流畅,科技感与美感并存'
      },
      transition: {
        name: '图形转场',
        description: '几何图形转场',
        prompt: '几何图形转场流畅,形状匹配自然,节奏感强,视觉衔接顺畅,设计感十足'
      }
    };
    
    // 画面效果
    this.imageEffects = {
      filmGrain: {
        name: '胶片颗粒',
        description: '模拟胶片颗粒感',
        prompt: '细腻胶片颗粒感,颗粒分布均匀,不干扰画面,电影质感,复古与高级感并存'
      },
      chromatic: {
        name: '色差',
        description: '边缘色差效果',
        prompt: '轻微色差效果,RGB边缘分离,视觉风格化,不夸张,艺术感与科技感'
      },
      vignette: {
        name: '暗角',
        description: '画面边缘暗角',
        prompt: '画面暗角自然,边缘渐暗,焦点集中于中心,电影感强烈,不压抑'
      },
      motionBlur: {
        name: '动态模糊',
        description: '运动模糊效果',
        prompt: '动态模糊自然,运动方向清晰,速度感传递,不模糊主体,流畅感增强'
      },
      depthOfField: {
        name: '景深控制',
        description: '浅景深效果',
        prompt: '浅景深效果,主体清晰背景虚化,焦点精准,虚实过渡自然,高级感强'
      }
    };
  }

  /**
   * 为镜头选择特效
   */
  selectEffects(shot, options = {}) {
    if (!this.enabled) return [];
    
    const effects = [];
    const phase = shot.phase || 'solution';
    const shotType = shot.shotType || 'standard';
    
    // 根据阶段选择特效
    if (phase === 'hook') {
      // 开场用强烈光效+粒子
      effects.push(
        this._pickRandom([this.lightEffects.lensFlare, this.lightEffects.glow]),
        this._pickRandom([this.particleEffects.spark, this.particleEffects.powder])
      );
    } else if (phase === 'solution') {
      // 产品展示用辉光+景深+粒子
      effects.push(
        this.lightEffects.glow,
        this.imageEffects.depthOfField
      );
      
      // 根据产品类型添加粒子
      if (shotType === 'product') {
        effects.push(this._pickRandom([
          this.particleEffects.dust,
          this.particleEffects.liquid
        ]));
      }
    } else if (phase === 'proof') {
      // 证明阶段用对比特效
      effects.push(
        this._pickRandom([this.imageEffects.motionBlur, this.lightEffects.godRay])
      );
    } else if (phase === 'cta') {
      // CTA用LOGO+光效
      effects.push(
        this.motionGraphics.logoReveal,
        this.lightEffects.glow
      );
    }
    
    // 通用画面效果（根据强度）
    if (this.intensity === 'cinematic' || this.intensity === 'high') {
      effects.push(this.imageEffects.filmGrain);
      effects.push(this.imageEffects.vignette);
    }
    
    // 去重
    return [...new Set(effects)].filter(Boolean);
  }

  /**
   * 增强镜头Prompt
   */
  enhance(shot, prompt) {
    if (!this.enabled) return prompt;
    
    const effects = this.selectEffects(shot);
    if (!effects.length) return prompt;
    
    // 构建特效文本
    const effectTexts = effects.map(e => `【${e.name}】${e.prompt}`);
    const enhancement = `【后期特效】${effectTexts.join(' | ')}`;
    
    // 智能注入
    return this._smartInject(prompt, enhancement);
  }

  /**
   * 获取特效使用报告
   */
  getEffectsReport(shots) {
    const report = {
      totalShots: shots.length,
      shotsWithEffects: 0,
      effectCounts: {},
      byPhase: {}
    };
    
    shots.forEach(shot => {
      const effects = this.selectEffects(shot);
      if (effects.length > 0) {
        report.shotsWithEffects++;
        
        effects.forEach(effect => {
          report.effectCounts[effect.name] = (report.effectCounts[effect.name] || 0) + 1;
        });
        
        const phase = shot.phase || 'unknown';
        report.byPhase[phase] = (report.byPhase[phase] || 0) + effects.length;
      }
    });
    
    return report;
  }

  /**
   * 智能注入（不超限）
   */
  _smartInject(prompt, enhancement) {
    const maxLength = 988;
    
    if (prompt.length + enhancement.length + 3 <= maxLength) {
      return `${prompt} | ${enhancement}`;
    }
    
    const spaceNeeded = enhancement.length + 10;
    const remaining = maxLength - spaceNeeded;
    
    if (remaining < 100) {
      return prompt;
    }
    
    const trimmedPrompt = prompt.slice(0, remaining);
    return `${trimmedPrompt}... | ${enhancement}`;
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = { VFXSystem };
