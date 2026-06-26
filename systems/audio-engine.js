/**
 * Audio Engine - 专业音频系统
 * 
 * 背景音乐智能匹配 + 音效库 + 节奏同步引擎
 * 
 * @version v1.0
 * @priority P0 - 音频核心
 */

class AudioEngine {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.style = options.style || 'commercial'; // commercial/cinematic/tech/luxury
    
    // 背景音乐风格库
    this.musicStyles = {
      epic: {
        name: '史诗大气',
        description: '宏大叙事，气势恢宏',
        bpm: 80,
        mood: 'powerful, grand, inspiring',
        instruments: 'orchestra, brass, strings, percussion',
        prompt: '史诗级管弦乐,铜管与弦乐交织,鼓点有力,气势恢宏,情绪逐层递进,高潮震撼'
      },
      upbeat: {
        name: '轻快活力',
        description: '轻快明亮，充满活力',
        bpm: 120,
        mood: 'energetic, positive, bright',
        instruments: 'piano, guitar, drums, synth',
        prompt: '轻快明亮背景音乐,钢琴与吉他为主,节奏明快,活力四射,积极向上,品牌年轻感'
      },
      luxury: {
        name: '奢华优雅',
        description: '低调奢华，优雅高级',
        bpm: 70,
        mood: 'elegant, sophisticated, calm',
        instruments: 'piano, strings, ambient, jazz',
        prompt: '奢华优雅背景音乐,钢琴独奏或弦乐四重奏,节奏舒缓,低调奢华,高级感,品味非凡'
      },
      tech: {
        name: '科技感',
        description: '未来科技，数字感强',
        bpm: 100,
        mood: 'modern, futuristic, precise',
        instruments: 'synth, electronic, glitch, bass',
        prompt: '科技感电子音乐,合成器音色,节奏精准,数字感强,未来感,现代简约'
      },
      emotional: {
        name: '情感共鸣',
        description: '温暖动人，情感丰富',
        bpm: 65,
        mood: 'warm, touching, emotional',
        instruments: 'piano, strings, acoustic guitar, cello',
        prompt: '温暖动人背景音乐,钢琴与大提琴对话,情感细腻,温暖治愈,故事感强,引发共鸣'
      },
      minimal: {
        name: '极简现代',
        description: '极简风格，留白艺术',
        bpm: 90,
        mood: 'minimal, clean, modern',
        instruments: 'ambient, synth, soft percussion',
        prompt: '极简现代背景音乐,环境音乐为主,留白艺术,不喧宾夺主,高级感,空间感'
      }
    };
    
    // 音效库
    this.soundEffects = {
      // 转场音效
      transition: {
        whoosh: 'whoosh快速转场音效,风声掠过,速度感',
        swoosh: 'swoosh优雅转场音效,流畅顺滑,高级感',
        impact: 'impact重击转场音效,冲击力,强调感',
        sweep: 'sweep扫频转场音效,频率变化,科技感'
      },
      // 产品音效
      product: {
        click: 'click清脆点击音效,机械质感,精密感',
        pop: 'pop气泡弹出音效,轻快愉悦,活力感',
        unlock: 'unlock解锁音效,开启感,期待感',
        reveal: 'reveal揭示音效,神秘感,仪式感'
      },
      // 氛围音效
      atmosphere: {
        wind: 'wind微风环境音效,自然氛围,空间感',
        city: 'city城市环境音效,繁华感,现代感',
        nature: 'nature自然环境音效,宁静,放松',
        room: 'room室内环境音效,温暖,亲近感'
      },
      // 品牌音效
      brand: {
        sonic: 'sonic品牌音效标识,3-5秒,记忆点深刻',
        ding: 'ding清脆提示音效,品牌关联,正向情绪',
        chime: 'chime优雅钟声,品牌高级感,仪式感'
      }
    };
    
    // 音频分层策略
    this.audioLayers = {
      // A-roll音频层
      aRoll: {
        dialogue: '对话清晰度优先,降噪处理,人声突出',
        music: '背景音乐-6dB,不干扰对话',
        effects: '环境音效-12dB,营造氛围'
      },
      // B-roll音频层
      bRoll: {
        music: '背景音乐-3dB,情绪主导',
        effects: '转场音效-6dB,节奏强调',
        atmosphere: '环境音效-9dB,空间感'
      }
    };
  }

  /**
   * 为视频选择背景音乐
   */
  selectMusic(shots, options = {}) {
    if (!this.enabled) return null;
    
    const style = options.style || this.style;
    const duration = options.duration || 30;
    const emotion = options.emotion || 'neutral';
    
    // 根据情绪和品牌调性选择
    let selectedStyle = this.musicStyles.upbeat; // 默认
    
    if (style === 'luxury') {
      selectedStyle = this.musicStyles.luxury;
    } else if (style === 'tech') {
      selectedStyle = this.musicStyles.tech;
    } else if (style === 'emotional') {
      selectedStyle = this.musicStyles.emotional;
    } else if (style === 'epic') {
      selectedStyle = this.musicStyles.epic;
    } else if (style === 'minimal') {
      selectedStyle = this.musicStyles.minimal;
    }
    
    // 根据视频情绪调整
    if (['excited', 'energetic'].includes(emotion)) {
      selectedStyle = this.musicStyles.upbeat;
    } else if (['calm', 'elegant'].includes(emotion)) {
      selectedStyle = this.musicStyles.luxury;
    }
    
    return {
      ...selectedStyle,
      duration: duration,
      fadeIn: 2, // 淡入2秒
      fadeOut: 3, // 淡出3秒
      dynamicRange: 'medium'
    };
  }

  /**
   * 生成音频节奏同步建议
   */
  generateSyncPlan(shots, music) {
    if (!this.enabled || !music) return null;
    
    const bpm = music.bpm || 120;
    const beatDuration = 60 / bpm; // 每拍时长(秒)
    
    const syncPlan = {
      bpm: bpm,
      beatDuration: beatDuration,
      cuts: [],
      effects: []
    };
    
    let currentTime = 0;
    
    shots.forEach((shot, index) => {
      const shotDuration = shot.duration || 5;
      
      // 在镜头切换点匹配节拍
      const beatAligned = Math.round(currentTime / beatDuration) * beatDuration;
      const deviation = Math.abs(currentTime - beatAligned);
      
      if (deviation < 0.5) {
        // 接近节拍，建议对齐
        syncPlan.cuts.push({
          shotIndex: index,
          time: beatAligned,
          type: 'beat_sync',
          confidence: 'high'
        });
      }
      
      // 在镜头中间添加效果点
      const midPoint = currentTime + shotDuration / 2;
      const midBeat = Math.round(midPoint / beatDuration) * beatDuration;
      
      syncPlan.effects.push({
        shotIndex: index,
        time: midBeat,
        type: 'accent',
        suggestion: '强调音效或音乐重音'
      });
      
      currentTime += shotDuration;
    });
    
    return syncPlan;
  }

  /**
   * 为镜头选择音效
   */
  selectSoundEffects(shot, options = {}) {
    if (!this.enabled) return [];
    
    const effects = [];
    const phase = shot.phase || 'solution';
    const shotType = shot.shotType || 'standard';
    const rollType = shot.rollType || 'a-roll';
    
    // 转场音效
    if (shotType === 'transition' || phase === 'hook') {
      effects.push(this._pickRandom([
        this.soundEffects.transition.whoosh,
        this.soundEffects.transition.swoosh
      ]));
    }
    
    // 产品音效
    if (phase === 'solution' || shotType === 'product') {
      effects.push(this._pickRandom([
        this.soundEffects.product.reveal,
        this.soundEffects.product.click
      ]));
    }
    
    // 品牌音效（CTA阶段）
    if (phase === 'cta') {
      effects.push(this.soundEffects.brand.sonic);
    }
    
    // 氛围音效（B-roll）
    if (rollType === 'b-roll') {
      effects.push(this._pickRandom([
        this.soundEffects.atmosphere.wind,
        this.soundEffects.atmosphere.city
      ]));
    }
    
    return effects.filter(Boolean);
  }

  /**
   * 生成音频Prompt
   */
  generateAudioPrompt(shot, options = {}) {
    if (!this.enabled) return '';
    
    const music = options.music || this.musicStyles.upbeat;
    const effects = this.selectSoundEffects(shot);
    
    let prompt = `【音频设计】背景音乐:${music.prompt}`;
    
    if (effects.length > 0) {
      prompt += ` | 音效:${effects.join(', ')}`;
    }
    
    // 音频分层
    const rollType = shot.rollType || 'a-roll';
    const layer = this.audioLayers[rollType === 'b-roll' ? 'bRoll' : 'aRoll'];
    
    prompt += ` | 音频层级:${JSON.stringify(layer)}`;
    
    return prompt;
  }

  /**
   * 获取音频使用报告
   */
  getAudioReport(shots, options = {}) {
    const music = this.selectMusic(shots, options);
    const syncPlan = this.generateSyncPlan(shots, music);
    
    let totalEffects = 0;
    const effectsByPhase = {};
    
    shots.forEach(shot => {
      const effects = this.selectSoundEffects(shot);
      totalEffects += effects.length;
      
      const phase = shot.phase || 'unknown';
      effectsByPhase[phase] = (effectsByPhase[phase] || 0) + effects.length;
    });
    
    return {
      music: music,
      syncPlan: syncPlan,
      totalEffects: totalEffects,
      effectsByPhase: effectsByPhase,
      recommendations: [
        '音乐淡入淡出处理，避免突兀',
        '对话场景降低背景音乐音量',
        '转场点添加音效增强节奏',
        '品牌音效在CTA阶段突出'
      ]
    };
  }

  _pickRandom(arr) {
    if (Array.isArray(arr)) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    // 如果是对象，返回随机值
    const values = Object.values(arr);
    return values[Math.floor(Math.random() * values.length)];
  }
}

module.exports = { AudioEngine };
