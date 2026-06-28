/**
 * Skill Base Class — 统一Skill接口定义
 * zhuoyue/skills/skill-base.js
 *
 * 设计原则：
 * - 所有Skill必须继承此类
 * - 提供统一生命周期：initialize → execute → validate → shutdown
 * - 支持元数据描述（name, version, description, inputs, outputs）
 * - 兼容现有模块：可通过适配器将老模块封装为Skill
 *
 * @version v1.0
 * @author 协同进化引擎
 * @priority P0
 */

'use strict';

// ============================================================
// Skill 状态枚举
// ============================================================

const SKILL_STATUS = {
  PENDING: 'PENDING',       // 待初始化
  INITIALIZING: 'INITIALIZING', // 初始化中
  READY: 'READY',           // 就绪
  EXECUTING: 'EXECUTING',   // 执行中
  SUCCESS: 'SUCCESS',       // 执行成功
  FAILED: 'FAILED',         // 执行失败
  SHUTDOWN: 'SHUTDOWN'      // 已关闭
};

// ============================================================
// Skill 基类
// ============================================================

class SkillBase {
  /**
   * @param {Object} config - Skill配置
   * @param {string} config.name - Skill名称
   * @param {string} config.version - 版本号
   * @param {string} config.description - 描述
   * @param {string[]} config.dependencies - 依赖的其他Skill ID列表
   * @param {string} config.category - 分类（pre_production | production | post_production | shared）
   */
  constructor(config = {}) {
    this.id = config.id || this._generateId();
    this.name = config.name || this.constructor.name;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.dependencies = config.dependencies || [];
    this.category = config.category || 'shared';
    this.status = SKILL_STATUS.PENDING;
    this.lastError = null;
    this.executionCount = 0;
    this.totalExecutionTimeMs = 0;
    this.createdAt = Date.now();
    this.initializedAt = null;
    this.config = config; // 保存完整配置（含IO契约）

    // 上下文引用（由Registry注入）
    this.context = null;
    this.eventBus = null;
  }

  /**
   * 生成唯一ID
   */
  _generateId() {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * 设置上下文
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * 设置EventBus
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 发布Skill生命周期事件
   */
  _publishEvent(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, {
        skillId: this.id,
        skillName: this.name,
        ...payload
      }, { source: 'skill-base' });
    }
  }

  // ============================================================
  // 生命周期方法 —— 子类可覆盖
  // ============================================================

  /**
   * 初始化Skill
   * 子类覆盖此方法进行资源准备（加载模型、初始化配置等）
   * @param {Object} options - 初始化选项
   * @returns {Promise<boolean>}
   */
  async initialize(options = {}) {
    // 允许从 PENDING/SHUTDOWN/FAILED 状态初始化
    const allowedStates = [SKILL_STATUS.PENDING, SKILL_STATUS.SHUTDOWN, SKILL_STATUS.FAILED];
    if (!allowedStates.includes(this.status)) {
      // 如果已经是 READY/SUCCESS，直接返回
      if (this.status === SKILL_STATUS.READY || this.status === SKILL_STATUS.SUCCESS) {
        return true;
      }
      throw new Error(`Skill ${this.id} 当前状态 ${this.status} 不允许初始化`);
    }

    this.status = SKILL_STATUS.INITIALIZING;
    this._publishEvent('skill.initializing', { status: this.status });

    // 子类实现初始化逻辑
    const success = await this.onInitialize(options);

    if (success) {
      this.status = SKILL_STATUS.READY;
      this.initializedAt = Date.now();
      this._publishEvent('skill.initialized', { status: this.status });
    } else {
      this.status = SKILL_STATUS.FAILED;
      this.lastError = new Error(`Skill ${this.id} 初始化失败`);
      this._publishEvent('skill.failed', { status: this.status, error: this.lastError.message });
      throw this.lastError;
    }

    return true;
  }

  /**
   * 子类覆盖：自定义初始化逻辑
   */
  async onInitialize(options) {
    // 默认实现：直接返回true
    return true;
  }

  /**
   * 执行Skill核心逻辑
   * @param {Object} input - 输入数据
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} 执行结果
   */
  async execute(input, context = {}) {
    if (this.status !== SKILL_STATUS.READY && this.status !== SKILL_STATUS.SUCCESS && this.status !== SKILL_STATUS.FAILED) {
      throw new Error(`Skill ${this.id} 未就绪（状态: ${this.status}），请先调用initialize()`);
    }

    const startMs = Date.now();
    this.status = SKILL_STATUS.EXECUTING;
    this.executionCount++;

    this._publishEvent('skill.executing', { inputKeys: Object.keys(input), status: this.status });

    try {
      const result = await this.onExecute(input, context);
      const durationMs = Date.now() - startMs;
      this.totalExecutionTimeMs += durationMs;

      this.status = SKILL_STATUS.SUCCESS;
      this._publishEvent('skill.completed', { status: this.status, durationMs });

      return {
        success: true,
        data: result,
        skillId: this.id,
        skillName: this.name,
        durationMs,
        executionCount: this.executionCount
      };
    } catch (error) {
      const durationMs = Date.now() - startMs;
      this.totalExecutionTimeMs += durationMs;
      this.status = SKILL_STATUS.FAILED;
      this.lastError = error;

      this._publishEvent('skill.failed', {
        status: this.status,
        error: error.message,
        durationMs
      });

      throw error;
    }
  }

  /**
   * 子类必须覆盖：核心执行逻辑
   */
  async onExecute(input, context) {
    throw new Error(`Skill ${this.id} 未实现onExecute方法`);
  }

  /**
   * 验证输入/输出数据
   * 子类可覆盖以实现自定义验证
   * @param {Object} data - 待验证数据
   * @param {string} type - 'input' | 'output'
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(data, type = 'output') {
    const result = this.onValidate(data, type);

    this._publishEvent('skill.validated', {
      type,
      valid: result.valid,
      errorCount: result.errors?.length || 0
    });

    return result;
  }

  /**
   * 子类覆盖：自定义验证逻辑
   */
  onValidate(data, type) {
    // 默认实现：基础类型检查
    const errors = [];
    if (data === null || data === undefined) {
      errors.push(`${type}数据不能为空`);
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * 关闭Skill，释放资源
   */
  async shutdown() {
    this._publishEvent('skill.shutting_down', { status: this.status });

    try {
      await this.onShutdown();
    } catch (e) {
      console.warn(`[Skill:${this.id}] shutdown警告: ${e.message}`);
    }

    this.status = SKILL_STATUS.SHUTDOWN;
    this._publishEvent('skill.shutdown', { status: this.status });
  }

  /**
   * 子类覆盖：自定义关闭逻辑
   */
  async onShutdown() {
    // 默认实现：无操作
  }

  // ============================================================
  // 元数据
  // ============================================================

  /**
   * 获取Skill元数据
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      dependencies: this.dependencies,
      category: this.category,
      status: this.status,
      executionCount: this.executionCount,
      totalExecutionTimeMs: this.totalExecutionTimeMs,
      avgExecutionTimeMs: this.executionCount > 0
        ? Math.round(this.totalExecutionTimeMs / this.executionCount)
        : 0,
      createdAt: this.createdAt,
      initializedAt: this.initializedAt,
      lastError: this.lastError?.message || null
    };
  }

  /**
   * 自检方法 —— 启动时调用
   * @returns {Object} { healthy: boolean, checks: Array }
   */
  validateSelf() {
    const checks = [
      { name: 'id存在', pass: !!this.id && typeof this.id === 'string' },
      { name: 'name存在', pass: !!this.name && typeof this.name === 'string' },
      { name: 'version格式', pass: /^\d+\.\d+\.\d+$/.test(this.version) },
      { name: 'dependencies是数组', pass: Array.isArray(this.dependencies) },
      { name: 'category有效', pass: ['pre_production', 'production', 'post_production', 'shared'].includes(this.category) }
    ];

    const failed = checks.filter(c => !c.pass);
    const healthy = failed.length === 0;

    return {
      healthy,
      skillId: this.id,
      checks,
      failedChecks: failed.map(c => c.name)
    };
  }
}

// ============================================================
// 兼容适配器 —— 将现有模块包装为Skill
// ============================================================

class ModuleToSkillAdapter extends SkillBase {
  /**
   * @param {Object} module - 现有模块（如prompt-standard-v3.js）
   * @param {Object} config - 适配配置
   * @param {string} config.executeMethod - 模块的执行方法名（默认 'run' 或 'execute'）
   */
  constructor(module, config = {}) {
    super({
      name: config.name || module.constructor?.name || 'adapted-module',
      version: config.version || '1.0.0',
      description: config.description || '通过适配器包装的现有模块',
      dependencies: config.dependencies || [],
      category: config.category || 'shared'
    });
    this.module = module;
    this.executeMethod = config.executeMethod || (typeof module.run === 'function' ? 'run' : 'execute');
  }

  async onInitialize(options) {
    if (typeof this.module.initialize === 'function') {
      await this.module.initialize(options);
    }
    return true;
  }

  async onExecute(input, context) {
    const method = this.module[this.executeMethod];
    if (typeof method !== 'function') {
      throw new Error(`模块 ${this.name} 没有方法 ${this.executeMethod}`);
    }
    return await method.call(this.module, input, context);
  }

  async onShutdown() {
    if (typeof this.module.shutdown === 'function') {
      await this.module.shutdown();
    }
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  SkillBase,
  ModuleToSkillAdapter,
  SKILL_STATUS
};
