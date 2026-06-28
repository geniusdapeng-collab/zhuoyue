/**
 * Skill Orchestrator Adapter v1.1
 * zhuoyue/infrastructure/skill-orchestrator-adapter.js
 *
 * 职责：连接 SkillRegistry ↔ SagaOrchestrator
 * - 自动将已注册的Skill映射为Saga Stage
 * - 管理Skill生命周期（initialize → execute → shutdown）
 * - 处理Skill间数据传递和IO契约校验
 * - 上下文累积与动态输入解析 (P3)
 *
 * @version v1.1
 * @author 协同进化引擎
 */

'use strict';

const { CommercialSagaOrchestrator, SagaStage } = require('./saga-orchestrator');
const { IOContractValidator } = require('./io-contract-validator');
const { ContextAccumulationStrategy, CommercialContextPresets } = require('./context-accumulation-strategy');

// ============================================================
// Skill Stage 定义生成器
// ============================================================

class SkillStageFactory {
  /**
   * 从Skill实例生成Saga Stage配置
   */
  static createStageConfig(skill) {
    const metadata = skill.getMetadata ? skill.getMetadata() : {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      dependencies: skill.dependencies || [],
      description: skill.description || ''
    };

    return {
      id: `STAGE-${metadata.id.toUpperCase().replace(/-/g, '_')}`,
      name: metadata.name || metadata.id,
      phase: metadata.category || 'unknown',
      blocking: true,
      required: true,
      timeoutMs: 120000,
      retryPolicy: { maxAttempts: 2, backoffMs: 2000 },
      fallback: { strategy: 'skip' },
      // 补偿：调用Skill的shutdown清理资源
      compensate: async (result, context) => {
        try {
          if (skill.shutdown) {
            await skill.shutdown();
          }
        } catch (e) {
          console.warn(`[SkillStageFactory] 补偿失败 ${metadata.id}: ${e.message}`);
        }
      },
      _skillId: metadata.id, // 内部标记，用于调试
      _skillRef: skill // 内部引用，执行时使用
    };
  }

  /**
   * 生成Stage执行函数（包装Skill.execute）
   * 支持上下文累积策略（P3）
   */
  static createExecuteFn(skill, options = {}) {
    const strategy = options.contextStrategy || null;

    return async (input, context) => {
      const traceId = context.traceId || `skill_${Date.now()}`;

      // 1. 初始化（如果未初始化）
      if (skill.status === 'PENDING' || !skill.status) {
        try {
          await skill.initialize({ eventBus: context.eventBus, traceId });
        } catch (e) {
          console.warn(`[SkillStageFactory] Skill ${skill.id} 初始化失败: ${e.message}`);
        }
      }

      // 2. 构建Skill输入（从上下文中提取该Skill需要的字段，支持别名映射）
      const skillInput = SkillStageFactory._buildSkillInput(skill, input, context, strategy);

      // 3. 执行前校验（如果Skill支持validate）
      if (skill.validate && options.validateInput !== false) {
        const validation = skill.validate(skillInput, 'input');
        const isValid = validation.valid !== undefined ? validation.valid : validation.healthy;
        const errors = validation.errors || validation.failedChecks || [];
        if (!isValid) {
          throw new Error(`输入校验失败: ${errors.join(', ')}`);
        }
      }

      // 4. 执行Skill
      const result = await skill.execute(skillInput, { traceId, eventBus: context.eventBus });

      // 5. 输出校验
      if (skill.validate && options.validateOutput !== false) {
        const validation = skill.validate(result.data || result, 'output');
        const isValid = validation.valid !== undefined ? validation.valid : validation.healthy;
        const errors = validation.errors || validation.failedChecks || [];
        if (!isValid) {
          throw new Error(`输出校验失败: ${errors.join(', ')}`);
        }
      }

      // 6. 返回结果（合并到上下文）
      return result.data || result;
    };
  }

  /**
   * 从上下文中提取Skill需要的输入字段（P3: 支持别名映射和动态推导）
   */
  static _buildSkillInput(skill, input, context, strategy = null) {
    // 如果有IO契约声明，按契约提取
    const ioContract = skill.config?.io || skill._config?.io || null;

    if (ioContract && ioContract.input) {
      // 使用上下文累积策略解析输入
      const resolver = strategy || new ContextAccumulationStrategy({
        aliases: CommercialContextPresets.aliases
      });

      try {
        const { resolved, unresolved, complete } = resolver.resolveInput(
          { ...input, ...context },
          ioContract.input,
          { allowMissing: true, ignoreMissing: true }
        );

        // 如果没解析到任何字段，回退到完整输入
        if (Object.keys(resolved).length === 0) {
          return { ...input, ...context };
        }

        // 如果有未解析的必填字段，记录警告
        if (unresolved.length > 0) {
          console.warn(`[SkillStageFactory] Skill ${skill.id} 缺少字段: ${unresolved.join(', ')}`);
        }

        return resolved;
      } catch (e) {
        console.warn(`[SkillStageFactory] 输入解析失败 ${skill.id}: ${e.message}`);
        return { ...input, ...context };
      }
    }

    // 默认：传递整个上下文 + input
    return { ...input, ...context };
  }
}

// ============================================================
// Skill 编排器适配器
// ============================================================

class SkillOrchestratorAdapter {
  constructor(options = {}) {
    this.registry = options.registry || null;
    this.orchestrator = new CommercialSagaOrchestrator({
      eventBus: options.eventBus,
      enableCompensation: options.enableCompensation !== false,
      publishEvents: options.publishEvents !== false
    });
    this.ioValidator = new IOContractValidator({
      strictMode: options.strictIO !== false
    });
    this.contextStrategy = options.contextStrategy || new ContextAccumulationStrategy({
      aliases: CommercialContextPresets.aliases
    });
    this.options = {
      validateInput: options.validateInput !== false,
      validateOutput: options.validateOutput !== false,
      validateCompatibility: options.validateCompatibility !== false,
      autoInitialize: options.autoInitialize !== false,
      contextStrategy: this.contextStrategy,
      ...options
    };
    this.skillStageMap = new Map(); // skillId -> stageId
    this.compatibilityReport = []; // Skill间兼容性报告
  }

  /**
   * 从SkillRegistry自动注册所有Skill为Stage
   * 支持上下文累积策略（P3）
   */
  registerFromRegistry(registry) {
    this.registry = registry;
    const skills = Array.from(registry.skills.values());

    // 按依赖顺序排序
    const sortedIds = this._topologicalSort(skills);

    // 检查Skill间IO兼容性
    if (this.options.validateCompatibility) {
      this._checkIOCompatibility(sortedIds);
    }

    for (const skillId of sortedIds) {
      const skill = registry.get(skillId);
      if (!skill) continue;

      const stageConfig = SkillStageFactory.createStageConfig(skill);
      const executeFn = SkillStageFactory.createExecuteFn(skill, this.options);

      this.orchestrator.registerStage(stageConfig, executeFn);
      this.skillStageMap.set(skillId, stageConfig.id);

      console.log(`[SkillOrchestratorAdapter] ✅ 注册Skill→Stage: ${skillId} → ${stageConfig.id}`);
    }

    return this;
  }

  /**
   * 检查Skill间IO兼容性
   */
  _checkIOCompatibility(sortedIds) {
    this.compatibilityReport = [];

    for (let i = 0; i < sortedIds.length - 1; i++) {
      const currentId = sortedIds[i];
      const nextId = sortedIds[i + 1];
      const currentSkill = this.registry.get(currentId);
      const nextSkill = this.registry.get(nextId);

      if (!currentSkill || !nextSkill) continue;

      const currentIO = this._getSkillIO(currentSkill);
      const nextIO = this._getSkillIO(nextSkill);

      const result = this.ioValidator.checkCompatibility(
        currentIO?.output,
        nextIO?.input
      );

      this.compatibilityReport.push({
        from: currentId,
        to: nextId,
        ...result
      });

      if (!result.compatible) {
        console.warn(`[SkillOrchestratorAdapter] ⚠️ IO不兼容: ${currentId} → ${nextId}`);
        result.mismatches.forEach(m => console.warn(`  - ${m}`));
        result.suggestions.forEach(s => console.warn(`  💡 ${s}`));
      }
    }
  }

  /**
   * 获取Skill的IO契约
   */
  _getSkillIO(skill) {
    // 从config加载（如果Skill有config属性）
    if (skill.config && skill.config.io) {
      return skill.config.io;
    }
    // 尝试从skill-loader的加载信息获取
    const loadedInfo = skill._loadedInfo;
    if (loadedInfo && loadedInfo.config && loadedInfo.config.io) {
      return loadedInfo.config.io;
    }
    return null;
  }

  /**
   * 执行完整链路
   */
  async execute(input, options = {}) {
    if (!this.registry || this.orchestrator.stages.size === 0) {
      throw new Error('未注册任何Skill，请先调用registerFromRegistry()');
    }

    const stageOrder = Array.from(this.orchestrator.stages.keys());
    return this.orchestrator.execute(input, { ...options, stageOrder });
  }

  /**
   * 获取Skill到Stage的映射
   */
  getSkillStageMap() {
    return new Map(this.skillStageMap);
  }

  /**
   * 获取执行报告
   */
  getReport() {
    return this.orchestrator.getExecutionReport();
  }

  /**
   * 自检
   */
  validate() {
    const checks = [
      { name: 'Registry已绑定', pass: !!this.registry },
      { name: '至少注册了1个Stage', pass: this.orchestrator.stages.size > 0 },
      { name: '所有Stage有Skill引用', pass: Array.from(this.orchestrator.stages.values()).every(s => s._skillRef) },
      { name: 'IO兼容性检查通过', pass: this.compatibilityReport.every(r => r.compatible) }
    ];

    const failed = checks.filter(c => !c.pass);
    return {
      healthy: failed.length === 0,
      component: 'SkillOrchestratorAdapter',
      checks,
      failedChecks: failed.map(c => c.name),
      skillCount: this.registry ? this.registry.skills.size : 0,
      stageCount: this.orchestrator.stages.size,
      compatibilityReport: this.compatibilityReport
    };
  }

  /**
   * 拓扑排序（基于Skill依赖）
   */
  _topologicalSort(skills) {
    const graph = new Map();
    const inDegree = new Map();

    // 初始化
    for (const skill of skills) {
      graph.set(skill.id, []);
      inDegree.set(skill.id, 0);
    }

    // 构建图
    for (const skill of skills) {
      for (const depId of (skill.dependencies || [])) {
        if (graph.has(depId)) {
          graph.get(depId).push(skill.id);
          inDegree.set(skill.id, inDegree.get(skill.id) + 1);
        }
      }
    }

    // Kahn算法
    const queue = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted = [];
    while (queue.length > 0) {
      const id = queue.shift();
      sorted.push(id);
      for (const neighbor of graph.get(id)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  SkillOrchestratorAdapter,
  SkillStageFactory
};
