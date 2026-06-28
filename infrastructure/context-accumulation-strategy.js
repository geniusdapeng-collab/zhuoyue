/**
 * 上下文累积与动态输入解析器
 * 
 * 解决 Skill 间 IO 字段名不匹配问题：
 * 1. 字段别名映射（如 cameraPlan.shots → shots）
 * 2. 动态推导（如从 product+brand 推导 commercialInput）
 * 3. 类型自动转换
 */

class ContextAccumulationStrategy {
  constructor(options = {}) {
    this.aliases = options.aliases || {};       // 字段别名: { shots: ['cameraPlan.shots', 'storyboard.shots'] }
    this.transformers = options.transformers || {}; // 自定义转换函数
    this.mergeMode = options.mergeMode || 'deep'; // shallow | deep | overwrite
  }

  /**
   * 将 Stage 输出累积到 context
   */
  accumulate(context, output, stageId) {
    if (!output || typeof output !== 'object') return context;

    const merged = this.mergeMode === 'shallow' 
      ? { ...context, ...output }
      : this._deepMerge(context, output);

    // 为输出字段创建快捷别名
    this._createAliases(merged, output, stageId);

    return merged;
  }

  /**
   * 从 context 中解析 Skill 需要的输入字段
   * 支持字段别名、路径访问、动态推导
   */
  resolveInput(context, fieldContracts, options = {}) {
    const resolved = {};
    const unresolved = [];

    for (const field of fieldContracts) {
      const { name, type, required, aliases, derive } = field;

      // 1. 直接匹配
      let value = this._getValue(context, name);

      // 2. 别名匹配
      if (value === undefined && aliases) {
        for (const alias of aliases) {
          value = this._getValue(context, alias);
          if (value !== undefined) break;
        }
      }

      // 3. 全局别名匹配（从策略配置）
      if (value === undefined && this.aliases[name]) {
        for (const alias of this.aliases[name]) {
          value = this._getValue(context, alias);
          if (value !== undefined) break;
        }
      }

      // 4. 动态推导
      if (value === undefined && derive) {
        value = this._deriveValue(context, derive);
      }

      // 5. 类型转换
      if (value !== undefined) {
        value = this._coerceType(value, type);
      }

      // 6. 记录结果
      if (value !== undefined) {
        resolved[name] = value;
      } else if (required && !options.allowMissing) {
        unresolved.push(name);
      }
    }

    if (unresolved.length > 0 && !options.ignoreMissing) {
      const err = new Error(`缺少必填字段: ${unresolved.join(', ')}`);
      err.missingFields = unresolved;
      err.resolved = resolved;
      throw err;
    }

    return { resolved, unresolved, complete: unresolved.length === 0 };
  }

  /**
   * 注册自定义转换器
   */
  registerTransformer(fieldName, transformerFn) {
    this.transformers[fieldName] = transformerFn;
  }

  /**
   * 注册字段别名
   */
  registerAlias(fieldName, aliasPaths) {
    if (!this.aliases[fieldName]) {
      this.aliases[fieldName] = [];
    }
    this.aliases[fieldName].push(...aliasPaths);
  }

  // ========== 内部方法 ==========

  _getValue(obj, path) {
    if (!path) return undefined;
    if (path.indexOf('.') === -1) return obj[path];

    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  _setValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  _createAliases(context, output, stageId) {
    // 自动创建常见别名
    if (output.cameraPlan?.shots && !context.shots) {
      context.shots = output.cameraPlan.shots;
    }
    if (output.storyboard?.shots && !context.shots) {
      context.shots = output.storyboard.shots;
    }
    if (output.adStructure && !context.adStructure) {
      context.adStructure = output.adStructure;
    }
  }

  _deriveValue(context, deriveRule) {
    if (typeof deriveRule === 'function') {
      return deriveRule(context);
    }
    if (deriveRule.from && deriveRule.fn) {
      const inputs = deriveRule.from.map(f => this._getValue(context, f));
      if (inputs.every(v => v !== undefined)) {
        return deriveRule.fn(...inputs);
      }
    }
    return undefined;
  }

  _coerceType(value, type) {
    if (!type || value === null || value === undefined) return value;

    switch (type) {
      case 'string':
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'array':
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(s => s.trim());
        return [value];
      case 'object':
        if (typeof value === 'object' && !Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch {
          return { value };
        }
      default:
        return value;
    }
  }
}

/**
 * 预设的商业广告链路别名配置
 */
const CommercialContextPresets = {
  // 字段别名映射：当 Skill 需要 "shots" 时，可以从这些路径查找
  aliases: {
    'shots': ['cameraPlan.shots', 'storyboard.shots', 'timelineData.shots', 'scenePlan.shots'],
    'scene': ['sceneDescription', 'sceneName', 'scenePlan.scene'],
    'product': ['adStructure.product', 'commercialRequirements.product'],
    'brand': ['adStructure.brand', 'commercialRequirements.brand'],
    'characters': ['storyboard.characters', 'scenePlan.characters', 'characterProfiles'],
    'prompts': ['cameraPlan.prompts', 'storyboard.prompts', 'generatedPrompts'],
    'duration': ['adDuration', 'scenePlan.duration', 'timelineData.duration'],
    'video': ['renderOutput', 'outputPath', 'pipelineOutput.video'],
    'payload': ['renderOutput', 'outputPath', 'pipelinePayload']
  },

  // 动态推导规则
  deriveRules: {
    // 从 shots 推导 sceneDescription
    'sceneDescription': {
      from: ['shots'],
      fn: (shots) => {
        if (!Array.isArray(shots) || shots.length === 0) return undefined;
        return shots.map(s => s.prompt || s.description || '').filter(Boolean).join('；');
      }
    },
    // 从 product + brand 推导 sellingPoints
    'sellingPoints': {
      from: ['product', 'brand'],
      fn: (product, brand) => {
        if (!product) return undefined;
        return product.features || product.sellingPoints || [product.name || '核心卖点'];
      }
    }
  }
};

module.exports = {
  ContextAccumulationStrategy,
  CommercialContextPresets
};
