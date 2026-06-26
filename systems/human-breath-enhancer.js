/**
 * Human Breath Enhancer - 人物呼吸感增强器
 * 作用: 为含有人物的镜头注入生命力、真实感、呼吸感描述
 * 
 * 增强维度:
 * 1. 眼神灵动 - 眼神追踪、眨眼、瞳孔反应
 * 2. 发丝质感 - 头发飘动、光泽、细节
 * 3. 微动作 - 肩膀起伏、手指微动、颈部转动
 * 4. 呼吸节奏 - 胸部起伏、喘息声、气息流动
 * 
 * 注入位置: Stage-11 Render阶段 → Prompt视觉描述部分
 * 触发条件: 镜头包含人类角色（非异兽/非纯背景）
 * 
 * @version v1.0
 * @priority P0 - 人物质感增强
 */

class HumanBreathEnhancer {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.intensity = options.intensity || 'medium'; // low/medium/high
    this.maxLength = options.maxLength || 200; // 最大增加字符数
    
    // 呼吸感描述库
    this.breathLibrary = {
      // 眼神灵动
      eyes: [
        '眼神灵动自然，瞳孔随光线微妙收缩',
        '目光流转有神，眼睑轻微眨动',
        '眼睛湿润有光泽，视线微微偏移',
        '瞳孔反应真实，眼神聚焦后有轻微涣散',
        '眼角细微肌肉牵动，目光带有情绪层次'
      ],
      
      // 发丝质感
      hair: [
        '发丝根根分明，微风拂动时自然飘摆',
        '头发光泽柔和，发梢轻微颤动',
        '发丝随动作产生惯性摆动，落地后微微回弹',
        '额头前几缕碎发随呼吸轻轻起伏',
        '头发纹理清晰，受光面与背光面过渡自然'
      ],
      
      // 微动作
      microMotion: [
        '肩膀随呼吸自然起伏，节奏舒缓',
        '手指无意识微曲，指节轻微颤动',
        '颈部肌肉微微牵动，头部有轻微惯性摆动',
        '站立时重心轻微偏移，身体微晃后自然调整',
        '衣料随肢体微动产生自然褶皱变化'
      ],
      
      // 呼吸节奏
      breathing: [
        '胸部随呼吸缓慢起伏，节奏约为每秒一次',
        '鼻翼微微扩张，气息从唇间轻缓流出',
        '颈部血管随脉搏轻微跳动',
        '嘴角随呼吸节奏有几乎不可察觉的微动',
        '胸腔扩张时肩胛骨有轻微后移'
      ]
    };
    
    // 情绪强度映射
    this.emotionIntensity = {
      'calm': { eyes: 0.3, hair: 0.5, motion: 0.2, breathing: 0.4 },
      'tense': { eyes: 0.8, hair: 0.6, motion: 0.7, breathing: 0.9 },
      'excited': { eyes: 0.9, hair: 0.8, motion: 0.9, breathing: 1.0 },
      'sad': { eyes: 0.6, hair: 0.4, motion: 0.3, breathing: 0.5 },
      'angry': { eyes: 1.0, hair: 0.7, motion: 0.8, breathing: 0.9 },
      'neutral': { eyes: 0.5, hair: 0.5, motion: 0.4, breathing: 0.5 }
    };
  }

  /**
   * 主入口: 为镜头增强呼吸感
   * @param {Object} shot - 镜头对象
   * @param {string} prompt - 当前prompt
   * @returns {Object} { enhanced: string, added: string[], stats: {} }
   */
  enhance(shot, prompt) {
    if (!this.enabled) return { enhanced: prompt, added: [], stats: { skipped: 'disabled' } };
    
    // 检查是否包含人类角色
    if (!this._hasHumanCharacter(shot)) {
      return { enhanced: prompt, added: [], stats: { skipped: 'no_human' } };
    }
    
    // 获取情绪强度
    const emotion = shot.emotionPhase || shot.emotion || 'neutral';
    const intensity = this.emotionIntensity[emotion] || this.emotionIntensity['neutral'];
    
    // 选择描述
    const selected = this._selectDescriptions(intensity, shot);
    
    // 构建增强文本
    const breathText = this._buildBreathText(selected, shot);
    
    // 注入到prompt
    const enhanced = this._injectIntoPrompt(prompt, breathText);
    
    return {
      enhanced,
      added: selected,
      stats: {
        originalLength: prompt.length,
        enhancedLength: enhanced.length,
        addedLength: breathText.length,
        emotion,
        intensity
      }
    };
  }

  /**
   * 检查是否包含人类角色
   */
  _hasHumanCharacter(shot) {
    if (!shot.characters || shot.characters.length === 0) return false;
    
    // 检查角色类型
    return shot.characters.some(c => {
      const charStr = typeof c === 'string' ? c : JSON.stringify(c);
      // 排除异兽标记
      return !charStr.includes('异兽') && !charStr.includes('beast') && !charStr.includes('monster');
    });
  }

  /**
   * 根据情绪强度选择描述
   */
  _selectDescriptions(intensity, shot) {
    const selected = [];
    
    // 根据强度决定是否包含该维度
    if (Math.random() < intensity.eyes) {
      selected.push(this._pickRandom(this.breathLibrary.eyes));
    }
    if (Math.random() < intensity.hair) {
      selected.push(this._pickRandom(this.breathLibrary.hair));
    }
    if (Math.random() < intensity.motion) {
      selected.push(this._pickRandom(this.breathLibrary.microMotion));
    }
    if (Math.random() < intensity.breathing) {
      selected.push(this._pickRandom(this.breathLibrary.breathing));
    }
    
    return selected;
  }

  /**
   * 构建呼吸感文本
   */
  _buildBreathText(descriptions, shot) {
    if (descriptions.length === 0) return '';
    
    // 根据镜头类型调整
    const shotSize = shot.shotSize || 'medium';
    let prefix = '';
    
    switch (shotSize) {
      case 'extreme_close_up':
      case 'close_up':
        prefix = '【人物微表情】';
        break;
      case 'medium':
        prefix = '【人物动态】';
        break;
      case 'long':
      case 'extreme_long':
        prefix = '【人物气息】';
        break;
      default:
        prefix = '【人物质感】';
    }
    
    return `${prefix}${descriptions.join('；')}`;
  }

  /**
   * 将呼吸感文本注入prompt
   * 策略: 在视觉描述之后，技术规格之前插入
   */
  _injectIntoPrompt(prompt, breathText) {
    if (!breathText) return prompt;
    
    // 如果prompt已满，先trim
    if (prompt.length + breathText.length > 988) {
      // 智能trim: 保留核心视觉，裁剪非关键描述
      prompt = this._smartTrim(prompt, 988 - breathText.length - 10);
    }
    
    // 查找最佳插入位置
    // 策略: 在【视觉】标记后，或在prompt中间偏后位置
    const visualMarker = prompt.indexOf('【视觉】');
    if (visualMarker !== -1) {
      // 在【视觉】内容结束后插入
      const visualEnd = prompt.indexOf('【', visualMarker + 1);
      if (visualEnd !== -1) {
        return prompt.slice(0, visualEnd) + breathText + prompt.slice(visualEnd);
      }
    }
    
    // 备用: 在prompt末尾插入
    return prompt + ' ' + breathText;
  }

  /**
   * 智能裁剪prompt
   */
  _smartTrim(prompt, maxLength) {
    if (prompt.length <= maxLength) return prompt;
    
    // 优先裁剪的标记（按优先级）
    const trimmableMarkers = [
      '【辅助运镜】',
      '【光影细节补充】',
      '【环境质感】',
      '【环境音效】',
      '【技术规格】'
    ];
    
    let trimmed = prompt;
    for (const marker of trimmableMarkers) {
      if (trimmed.length <= maxLength) break;
      
      const idx = trimmed.lastIndexOf(marker);
      if (idx !== -1) {
        // 找到该标记到下一个标记之间的内容
        const nextMarker = trimmed.indexOf('【', idx + 1);
        if (nextMarker !== -1) {
          trimmed = trimmed.slice(0, idx) + trimmed.slice(nextMarker);
        }
      }
    }
    
    // 如果还是太长，硬截断
    if (trimmed.length > maxLength) {
      trimmed = trimmed.slice(0, maxLength - 3) + '...';
    }
    
    return trimmed;
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = { HumanBreathEnhancer };
