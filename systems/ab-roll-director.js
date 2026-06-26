/**
 * AB-Roll Director - A镜/B镜导演系统
 * 
 * 影视创作核心概念:
 * - A-roll (主镜): 核心叙事镜头，包含对话、主要动作、关键场景
 * - B-roll (辅镜/插入镜): 辅助叙事镜头，展示环境、细节、氛围、过渡
 * 
 * 融合策略:
 * 1. 自动识别: 根据镜头特征判断A/B-roll类型
 * 2. Prompt差异化: A-roll聚焦人物叙事，B-roll聚焦环境氛围
 * 3. 节奏控制: A/B-roll交替出现，避免视觉疲劳
 * 4. 主动生成: 关键场景自动配套B-roll补充镜头
 * 
 * @version v1.0
 * @priority P0 - 影视质感增强
 */

class ABRollDirector {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.brollRatio = options.brollRatio || 0.3; // B-roll占比30%
    this.maxBrollPerScene = options.maxBrollPerScene || 2;
    
    // A-roll特征（核心叙事）
    this.aRollIndicators = {
      shotTypes: ['opening', 'climax', 'conflict', 'rising', 'resolution', 'interaction'],
      minImportance: 5,
      hasDialogue: true,
      hasCharacters: true
    };
    
    // B-roll特征（辅助叙事）
    this.bRollIndicators = {
      shotTypes: ['setup', 'transition', 'atmosphere', 'detail'],
      maxImportance: 4,
      noDialogue: true
    };
    
    // B-roll视觉风格库
    this.bRollVisualStyles = {
      atmosphere: [
        '环境氛围渲染，光影微妙变化',
        '空镜构图，空间纵深感强',
        '自然光影流转，时间感流逝',
        '大景深环境展示，人物置于景中'
      ],
      detail: [
        '物品特写，材质纹理清晰可见',
        '手部动作细节，指节纹理真实',
        '局部光影特写，明暗对比细腻',
        '微距视角，细节层次丰富'
      ],
      transition: [
        '运动模糊过渡，视线引导流畅',
        '光影渐变转场，情绪自然过渡',
        '景别跳跃，节奏变化明显',
        '视角切换，空间关系建立'
      ],
      reaction: [
        '反应镜头，情绪层次递进',
        '眼神特写，内心活动外化',
        '侧脸轮廓，光影勾勒情绪',
        '微表情捕捉，细节传达情绪'
      ]
    };
    
    // A-roll视觉强化
    this.aRollVisualStyles = {
      dialogue: [
        '人物对话场景，眼神交流自然',
        '正反打构图，对话节奏清晰',
        '面部光影细腻，情绪传达准确',
        '口型动作精准，台词节奏匹配'
      ],
      action: [
        '核心动作展示，动态模糊适度',
        '人物姿态舒展，肢体语言丰富',
        '动作连贯流畅，关键帧清晰',
        '速度与力量感，视觉冲击力强'
      ],
      emotion: [
        '情绪高潮镜头，面部表情饱满',
        '眼神聚焦有力，情绪张力十足',
        '光影烘托情绪，氛围渲染到位',
        '人物状态沉浸，情感共鸣强烈'
      ]
    };
  }

  /**
   * 分析故事板，标记A/B-roll
   * @param {Array} shots - 故事板镜头列表
   * @returns {Array} 标记了rollType的镜头列表
   */
  analyzeStoryboard(shots) {
    if (!this.enabled || !Array.isArray(shots)) return shots;
    
    const analyzed = shots.map((shot, index) => {
      const rollType = this._classifyRollType(shot, index, shots);
      return {
        ...shot,
        rollType, // 'a-roll' | 'b-roll'
        rollConfidence: this._calculateConfidence(shot, rollType),
        rollSuggestion: this._getRollSuggestion(shot, rollType)
      };
    });
    
    // 检查A/B-roll比例是否合理
    const bRollCount = analyzed.filter(s => s.rollType === 'b-roll').length;
    const total = analyzed.length;
    const bRollRatio = total > 0 ? bRollCount / total : 0;
    
    console.log(`[AB-Roll] 分析完成 | A-roll:${total - bRollCount} | B-roll:${bRollCount} | 比例:${(bRollRatio * 100).toFixed(1)}%`);
    
    return analyzed;
  }

  /**
   * 为渲染阶段注入A/B-roll差异化Prompt
   * @param {Object} shot - 镜头对象
   * @param {string} prompt - 当前prompt
   * @returns {string} 增强后的prompt
   */
  enhancePrompt(shot, prompt) {
    if (!this.enabled || !shot.rollType) return prompt;
    
    const rollType = shot.rollType;
    
    if (rollType === 'a-roll') {
      return this._enhanceARollPrompt(shot, prompt);
    } else if (rollType === 'b-roll') {
      return this._enhanceBRollPrompt(shot, prompt);
    }
    
    return prompt;
  }

  /**
   * 主动生成B-roll补充镜头
   * 当检测到连续多个A-roll时，建议插入B-roll
   * @param {Array} shots - 当前故事板
   * @returns {Array} 补充了B-roll的新故事板
   */
  generateSupplementaryBRoll(shots) {
    if (!this.enabled || !Array.isArray(shots)) return shots;
    
    const enhanced = [];
    let consecutiveARoll = 0;
    
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const rollType = shot.rollType || this._classifyRollType(shot, i, shots);
      
      enhanced.push(shot);
      
      if (rollType === 'a-roll') {
        consecutiveARoll++;
        
        // 连续3个A-roll后，插入一个B-roll过渡
        if (consecutiveARoll >= 3 && i < shots.length - 1) {
          const bRoll = this._createTransitionBRoll(shot, i);
          enhanced.push(bRoll);
          consecutiveARoll = 0;
          console.log(`[AB-Roll] 自动插入B-roll过渡: ${bRoll.id}`);
        }
      } else {
        consecutiveARoll = 0;
      }
    }
    
    return enhanced;
  }

  // ========== 内部方法 ==========

  /**
   * 分类镜头类型
   */
  _classifyRollType(shot, index, allShots) {
    // 强制标记检查
    if (shot.forceRollType) return shot.forceRollType;
    
    // 基于镜头特征判断
    const hasDialogue = shot.dialogue && shot.dialogue.trim().length > 0;
    const hasCharacters = shot.characters && shot.characters.length > 0;
    const importance = shot.importance || 5;
    const shotType = shot.shotType || shot.type || 'standard';
    
    // A-roll判定（核心叙事）
    if (hasDialogue && hasCharacters && importance >= 5) {
      return 'a-roll';
    }
    
    // A-roll判定（高潮/冲突）
    if (['climax', 'conflict', 'rising', 'resolution'].includes(shotType)) {
      return 'a-roll';
    }
    
    // A-roll判定（互动场景）
    if (shotType === 'interaction' && hasCharacters) {
      return 'a-roll';
    }
    
    // B-roll判定（无对话空镜）
    if (!hasDialogue && !hasCharacters) {
      return 'b-roll';
    }
    
    // B-roll判定（低重要性）
    if (importance <= 3) {
      return 'b-roll';
    }
    
    // B-roll判定（过渡/氛围）
    if (['setup', 'transition', 'atmosphere'].includes(shotType)) {
      return 'b-roll';
    }
    
    // 默认：根据位置判断
    // 故事板开头和结尾通常是A-roll
    if (index === 0 || index === allShots.length - 1) {
      return 'a-roll';
    }
    
    // 其他情况默认为A-roll
    return 'a-roll';
  }

  /**
   * 计算分类置信度
   */
  _calculateConfidence(shot, rollType) {
    const hasDialogue = shot.dialogue && shot.dialogue.trim().length > 0;
    const hasCharacters = shot.characters && shot.characters.length > 0;
    const importance = shot.importance || 5;
    
    if (rollType === 'a-roll') {
      let score = 0;
      if (hasDialogue) score += 0.4;
      if (hasCharacters) score += 0.3;
      if (importance >= 7) score += 0.2;
      if (['climax', 'conflict'].includes(shot.shotType)) score += 0.1;
      return Math.min(score, 1.0);
    } else {
      let score = 0;
      if (!hasDialogue) score += 0.4;
      if (!hasCharacters) score += 0.3;
      if (importance <= 3) score += 0.2;
      if (['setup', 'transition'].includes(shot.shotType)) score += 0.1;
      return Math.min(score, 1.0);
    }
  }

  /**
   * 获取Roll建议
   */
  _getRollSuggestion(shot, rollType) {
    if (rollType === 'a-roll') {
      if (shot.dialogue) {
        return '对话场景：聚焦人物表情和口型，正反打构图';
      } else if (['climax', 'conflict'].includes(shot.shotType)) {
        return '高潮场景：强化动作和情绪，视觉冲击力强';
      } else {
        return '叙事场景：保持核心动作连贯，人物状态沉浸';
      }
    } else {
      if (!shot.characters || shot.characters.length === 0) {
        return '空镜/环境：展示空间氛围，光影变化，时间流逝';
      } else {
        return '辅助镜头：反应镜头或细节特写，补充叙事层次';
      }
    }
  }

  /**
   * 增强A-roll Prompt
   */
  _enhanceARollPrompt(shot, prompt) {
    const enhancements = [];
    
    // 根据A-roll子类型选择增强
    if (shot.dialogue && shot.dialogue.trim().length > 0) {
      // 对话场景
      const dialogueStyle = this._pickRandom(this.aRollVisualStyles.dialogue);
      enhancements.push(`【人物叙事】${dialogueStyle}`);
    }
    
    if (['climax', 'conflict', 'rising'].includes(shot.shotType)) {
      // 动作/情绪场景
      const actionStyle = this._pickRandom(this.aRollVisualStyles.action);
      const emotionStyle = this._pickRandom(this.aRollVisualStyles.emotion);
      enhancements.push(`【核心动作】${actionStyle}`);
      enhancements.push(`【情绪张力】${emotionStyle}`);
    }
    
    if (enhancements.length === 0) {
      const defaultStyle = this._pickRandom(this.aRollVisualStyles.dialogue);
      enhancements.push(`【叙事主镜】${defaultStyle}`);
    }
    
    // 注入到prompt
    return this._injectIntoPrompt(prompt, enhancements, '【A-roll主镜】');
  }

  /**
   * 增强B-roll Prompt
   */
  _enhanceBRollPrompt(shot, prompt) {
    const enhancements = [];
    
    // 根据B-roll子类型选择增强
    if (!shot.characters || shot.characters.length === 0) {
      // 纯环境/空镜
      const atmosphereStyle = this._pickRandom(this.bRollVisualStyles.atmosphere);
      enhancements.push(`【环境氛围】${atmosphereStyle}`);
    } else {
      // 有人物但非主叙事
      if (shot.shotType === 'transition') {
        const transitionStyle = this._pickRandom(this.bRollVisualStyles.transition);
        enhancements.push(`【过渡转场】${transitionStyle}`);
      } else {
        const reactionStyle = this._pickRandom(this.bRollVisualStyles.reaction);
        const detailStyle = this._pickRandom(this.bRollVisualStyles.detail);
        enhancements.push(`【反应镜头】${reactionStyle}`);
        enhancements.push(`【细节补充】${detailStyle}`);
      }
    }
    
    // B-roll标记：减少人物动作描述权重
    enhancements.push('【B-roll辅镜】弱化核心叙事，强化环境氛围和视觉层次');
    
    // 注入到prompt
    return this._injectIntoPrompt(prompt, enhancements, '【B-roll辅镜】');
  }

  /**
   * 创建过渡B-roll镜头
   */
  _createTransitionBRoll(prevShot, index) {
    return {
      id: `${prevShot.id}-br`,
      scene: `${prevShot.scene}-过渡`,
      type: 'transition',
      shotType: 'transition',
      rollType: 'b-roll',
      rollAutoGenerated: true,
      dialogue: '',
      narration: '',
      characters: [],
      duration: Math.max(2, Math.min(5, prevShot.duration * 0.5)),
      importance: 2,
      visualComplexity: 4,
      emotionPhase: 'transition',
      fpvRecommended: false,
      prompt: '', // 将在Stage-11生成
      isSupplementary: true,
      parentShotId: prevShot.id
    };
  }

  /**
   * 将增强文本注入prompt
   */
  _injectIntoPrompt(prompt, enhancements, marker) {
    if (!enhancements.length) return prompt;
    
    const text = enhancements.join('；');
    const fullText = `${marker}${text}`;
    
    // 检查长度限制
    if (prompt.length + fullText.length > 988) {
      // 智能裁剪
      const maxAdd = 988 - prompt.length - 10;
      if (maxAdd < 20) return prompt; // 空间不足，不注入
      const truncated = fullText.slice(0, maxAdd) + '...';
      return prompt + ' ' + truncated;
    }
    
    // 在prompt末尾注入
    return prompt + ' ' + fullText;
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = { ABRollDirector };
