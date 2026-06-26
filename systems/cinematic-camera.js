/**
 * Cinematic Camera System - 专业电影级运镜系统
 * 
 * 影视级广告运镜库，让画面像好莱坞大片一样流畅专业
 * 
 * @version v1.0
 * @priority P0 - 运镜核心
 */

class CinematicCameraSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.style = options.style || 'commercial'; // commercial/cinematic/dynamic/slow
    
    // 广告级产品展示运镜
    this.productMoves = {
      orbit360: {
        name: '360度环绕',
        description: '产品为中心，摄像机环绕展示',
        prompt: '摄像机360度平滑环绕产品,轨道运动流畅,产品始终处于画面中心,多角度展示细节,运动速度均匀'
      },
      macroReveal: {
        name: '微距揭示',
        description: '从微距细节逐渐拉出展示全貌',
        prompt: '微距镜头展示产品细节纹理,缓慢向后拉出 reveals 产品全貌,焦点转换平滑,细节到整体过渡自然'
      },
      pushIn: {
        name: '推进聚焦',
        description: '平滑推进聚焦产品核心卖点',
        prompt: 'Dolly平滑推进,焦点锁定产品核心卖点,景深逐渐变浅,背景虚化柔和,情绪逐渐升温'
      },
      floatSpin: {
        name: '悬浮旋转',
        description: '产品在空间中悬浮旋转展示',
        prompt: '产品优雅悬浮于空中,缓慢旋转展示各角度,光线跟随旋转变化,魔幻感与高级感并存'
      },
      explodeView: {
        name: '拆解展示',
        description: '产品拆解展示内部结构',
        prompt: '产品优雅拆解,各部件悬浮展示,内部结构清晰可见,科技感与工艺感并存,装配过程可逆'
      },
      reveal: {
        name: '揭幕展示',
        description: '幕布/盖子揭开展示产品',
        prompt: '幕布优雅揭开,产品逐渐 reveal,光线随之洒落,仪式感与期待感营造到位'
      }
    };
    
    // 电影级叙事运镜
    this.narrativeMoves = {
      tracking: {
        name: '跟拍跟踪',
        description: '跟随主体移动，保持画面稳定',
        prompt: '摄像机稳定跟拍主体,运动速度匹配主体,画面稳定流畅,背景动态模糊适度,节奏感强'
      },
      craneUp: {
        name: '升降运镜',
        description: '从低角度升起或从高角度降下',
        prompt: 'Crane升降运镜,从低角度缓缓升起 reveals 宏大场景,或从高角度降下聚焦细节,空间感强烈'
      },
      dollyZoom: {
        name: '滑轨变焦',
        description: 'Dolly移动同时变焦，产生眩晕感',
        prompt: 'Dolly同时Zoom,背景压缩或拉伸,主体大小不变,眩晕感与情绪张力并存,希区柯克式运镜'
      },
      whipPan: {
        name: '快速摇镜',
        description: '快速水平摇动，制造动感',
        prompt: 'Whip pan快速摇镜,动感十足,转场流畅,节奏感极强,视觉冲击力强'
      },
      handheld: {
        name: '手持呼吸感',
        description: '轻微晃动模拟手持质感',
        prompt: '手持质感微晃动,呼吸感自然,不稳定中见稳定,纪实感与真实感,情绪紧张感'
      },
      rackFocus: {
        name: '移焦转换',
        description: '焦点从一个主体转移到另一个',
        prompt: 'Rack focus焦点平滑转移,前景后景交替清晰,叙事焦点随之转换,情绪引导自然'
      }
    };
    
    // 变速运镜
    this.speedMoves = {
      slowMotion: {
        name: '慢动作',
        description: '高速拍摄慢放，展示细节',
        prompt: '120fps慢动作拍摄,时间凝固感,细节极致清晰,水花飞溅/粉尘漂浮/发丝飘动,唯美震撼'
      },
      speedRamp: {
        name: '变速 ramping',
        description: '正常→慢动作→正常速度变化',
        prompt: 'Speed ramping速度渐变,正常速度→慢动作→正常速度,节奏变化自然,强调关键时刻'
      },
      timeLapse: {
        name: '延时摄影',
        description: '时间压缩，展示变化过程',
        prompt: 'Time-lapse延时摄影,时间压缩,云卷云舒/日出日落/人流穿梭,时间流逝感,宏观视角'
      },
      hyperlapse: {
        name: '移动延时',
        description: '摄像机移动+延时摄影',
        prompt: 'Hyperlapse移动延时,摄像机移动+时间压缩,空间感+时间感双重震撼,城市/风景流动感'
      }
    };
    
    // 广告快剪运镜
    this.fastCutMoves = {
      matchCut: {
        name: '匹配剪辑',
        description: '相似形状/颜色/动作匹配转场',
        prompt: 'Match cut匹配剪辑,相似形状/颜色/动作无缝衔接,转场流畅自然,视觉连贯性极强'
      },
      jumpCut: {
        name: '跳剪',
        description: '同角度跳剪，制造节奏感',
        prompt: 'Jump cut跳剪,同角度快速剪辑,节奏感强烈,时间压缩,动感十足'
      },
      smashCut: {
        name: ' smash cut',
        description: '强烈对比转场',
        prompt: 'Smash cut强烈对比转场,情绪/场景/节奏剧烈反差,冲击力极强,观众注意力瞬间抓住'
      },
      montage: {
        name: '蒙太奇',
        description: '快速剪辑序列，展示过程/变化',
        prompt: 'Montage蒙太奇快速剪辑,多场景快速切换,过程压缩展示,节奏明快,信息量大'
      }
    };
  }

  /**
   * 为镜头选择运镜方案
   */
  selectCameraMove(shot, options = {}) {
    if (!this.enabled) return null;
    
    const shotType = shot.shotType || shot.type || 'standard';
    const phase = shot.phase || 'solution';
    const duration = shot.duration || 5;
    
    // 根据阶段选择运镜
    if (phase === 'hook' || phase === 'cta') {
      // Hook/CTA用强烈运镜
      return this._pickRandom([
        this.fastCutMoves.smashCut,
        this.narrativeMoves.whipPan,
        this.speedMoves.slowMotion
      ]);
    }
    
    if (phase === 'solution') {
      // 产品展示用产品运镜
      if (duration >= 8) {
        return this._pickRandom([
          this.productMoves.orbit360,
          this.productMoves.macroReveal,
          this.productMoves.pushIn
        ]);
      } else {
        return this._pickRandom([
          this.productMoves.reveal,
          this.narrativeMoves.rackFocus
        ]);
      }
    }
    
    if (phase === 'proof') {
      // 证明阶段用对比运镜
      return this._pickRandom([
        this.fastCutMoves.matchCut,
        this.narrativeMoves.dollyZoom,
        this.speedMoves.speedRamp
      ]);
    }
    
    // 默认根据镜头类型选择
    if (shotType === 'close_up' || shotType === 'detail') {
      return this._pickRandom([
        this.productMoves.macroReveal,
        this.narrativeMoves.rackFocus,
        this.speedMoves.slowMotion
      ]);
    }
    
    if (shotType === 'wide' || shotType === 'establishing') {
      return this._pickRandom([
        this.narrativeMoves.craneUp,
        this.speedMoves.hyperlapse,
        this.narrativeMoves.tracking
      ]);
    }
    
    // 默认商业运镜
    return this._pickRandom([
      this.narrativeMoves.tracking,
      this.narrativeMoves.rackFocus,
      this.productMoves.pushIn
    ]);
  }

  /**
   * 增强镜头Prompt
   */
  enhance(shot, prompt) {
    if (!this.enabled) return prompt;
    
    const cameraMove = this.selectCameraMove(shot);
    if (!cameraMove) return prompt;
    
    // 注入运镜指令
    const moveText = `【运镜】${cameraMove.name}: ${cameraMove.prompt}`;
    
    // 智能注入（不超限）
    return this._smartInject(prompt, moveText);
  }

  /**
   * 为产品展示镜头生成专业运镜序列
   */
  generateProductSequence(productShots) {
    const sequence = [];
    
    // 序列1: 揭示 → 环绕 → 微距 → 推进
    if (productShots.length >= 4) {
      sequence.push(
        { shot: productShots[0], move: this.productMoves.reveal },
        { shot: productShots[1], move: this.productMoves.orbit360 },
        { shot: productShots[2], move: this.productMoves.macroReveal },
        { shot: productShots[3], move: this.productMoves.pushIn }
      );
    } else if (productShots.length >= 2) {
      sequence.push(
        { shot: productShots[0], move: this.productMoves.reveal },
        { shot: productShots[1], move: this.productMoves.orbit360 }
      );
    }
    
    return sequence;
  }

  /**
   * 获取快剪节奏建议
   */
  getFastCutRhythm(shots) {
    const rhythm = {
      totalDuration: shots.reduce((s, x) => s + x.duration, 0),
      cutCount: shots.length,
      averageCutDuration: 0,
      rhythm: 'moderate',
      suggestion: ''
    };
    
    rhythm.averageCutDuration = rhythm.totalDuration / rhythm.cutCount;
    
    if (rhythm.averageCutDuration < 2) {
      rhythm.rhythm = 'fast';
      rhythm.suggestion = '快剪节奏，适合Hook/高能段落';
    } else if (rhythm.averageCutDuration > 5) {
      rhythm.rhythm = 'slow';
      rhythm.suggestion = '慢节奏，适合情感/展示段落';
    } else {
      rhythm.rhythm = 'moderate';
      rhythm.suggestion = '中等节奏，适合常规叙事';
    }
    
    return rhythm;
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
      return prompt; // 空间不足，不注入
    }
    
    const trimmedPrompt = prompt.slice(0, remaining);
    return `${trimmedPrompt}... | ${enhancement}`;
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = { CinematicCameraSystem };
