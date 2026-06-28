/**
 * Skill Registry — Skill注册表与执行管理
 * zhuoyue/skills/skill-registry.js
 *
 * 职责：
 * - Skill注册与注销
 * - 依赖解析（拓扑排序）
 * - 按依赖顺序批量执行
 * - 健康检查与状态监控
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

const { SkillBase, SKILL_STATUS } = require('./skill-base');

// ============================================================
// 拓扑排序 —— 解决Skill依赖执行顺序
// ============================================================

function topologicalSort(skills) {
  const graph = new Map();
  const inDegree = new Map();

  // 初始化
  for (const [id, skill] of skills) {
    graph.set(id, []);
    inDegree.set(id, 0);
  }

  // 构建图
  for (const [id, skill] of skills) {
    for (const depId of skill.dependencies) {
      if (skills.has(depId)) {
        graph.get(depId).push(id);
        inDegree.set(id, inDegree.get(id) + 1);
      } else {
        console.warn(`[SkillRegistry] Skill ${id} 依赖 ${depId} 未注册`);
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

  // 检测循环依赖
  if (sorted.length !== skills.size) {
    const unprocessed = [...skills.keys()].filter(id => !sorted.includes(id));
    throw new Error(`检测到循环依赖: ${unprocessed.join(', ')}`);
  }

  return sorted;
}

// ============================================================
// Skill Registry
// ============================================================

class SkillRegistry {
  constructor(options = {}) {
    this.skills = new Map();          // id -> Skill实例
    this.name = options.name || 'skill-registry';
    this.autoInitialize = options.autoInitialize !== false;
    this.context = options.context || {};
    this.eventBus = options.eventBus || null;
    this.executionHistory = [];
  }

  /**
   * 注册Skill
   */
  register(skill) {
    if (!(skill instanceof SkillBase)) {
      throw new Error('只能注册SkillBase子类的实例');
    }

    if (this.skills.has(skill.id)) {
      console.warn(`[SkillRegistry] Skill ${skill.id} 已存在，覆盖注册`);
    }

    // 注入上下文和EventBus
    skill.setContext(this.context);
    if (this.eventBus) {
      skill.setEventBus(this.eventBus);
    }

    this.skills.set(skill.id, skill);
    console.log(`[SkillRegistry] ✅ 注册Skill: ${skill.id} (${skill.name})`);
    return this;
  }

  /**
   * 注销Skill
   */
  unregister(skillId) {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.shutdown().catch(() => {});
      this.skills.delete(skillId);
      console.log(`[SkillRegistry] 🗑️ 注销Skill: ${skillId}`);
    }
    return this;
  }

  /**
   * 获取Skill
   */
  get(skillId) {
    return this.skills.get(skillId);
  }

  /**
   * 检查所有Skill是否已注册
   */
  hasAll(skillIds) {
    return skillIds.every(id => this.skills.has(id));
  }

  /**
   * 初始化所有Skill（按依赖顺序）
   */
  async initializeAll(options = {}) {
    const sorted = topologicalSort(this.skills);
    console.log(`[SkillRegistry] 🚀 按依赖顺序初始化 ${sorted.length} 个Skill`);

    const results = [];
    for (const id of sorted) {
      const skill = this.skills.get(id);
      try {
        await skill.initialize(options);
        results.push({ id, success: true, status: skill.status });
      } catch (error) {
        results.push({ id, success: false, error: error.message, status: skill.status });
        // 可选：失败时中断
        if (options.failFast) {
          throw error;
        }
      }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.warn(`[SkillRegistry] ⚠️ ${failed.length} 个Skill初始化失败: ${failed.map(f => f.id).join(', ')}`);
    }

    console.log(`[SkillRegistry] ✅ 初始化完成 | 成功:${results.length - failed.length}/${results.length}`);
    return results;
  }

  /**
   * 执行单个Skill
   */
  async execute(skillId, input, context = {}) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} 未注册`);
    }

    const mergedContext = { ...this.context, ...context };
    const startMs = Date.now();

    try {
      const result = await skill.execute(input, mergedContext);
      this.executionHistory.push({
        skillId,
        status: 'success',
        durationMs: Date.now() - startMs,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      this.executionHistory.push({
        skillId,
        status: 'failed',
        error: error.message,
        durationMs: Date.now() - startMs,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * 按依赖顺序批量执行多个Skill
   */
  async executeBatch(skillIds, input, context = {}) {
    // 只包含已注册的Skill
    const registeredIds = skillIds.filter(id => this.skills.has(id));
    const missing = skillIds.filter(id => !this.skills.has(id));
    if (missing.length > 0) {
      console.warn(`[SkillRegistry] 以下Skill未注册，跳过: ${missing.join(', ')}`);
    }

    // 构建子图进行拓扑排序
    const subMap = new Map();
    for (const id of registeredIds) {
      subMap.set(id, this.skills.get(id));
    }
    const sorted = topologicalSort(subMap);

    const results = new Map();
    let currentInput = input;

    for (const id of sorted) {
      console.log(`[SkillRegistry] ▶️ 执行 ${id}`);
      const result = await this.execute(id, currentInput, context);
      results.set(id, result);

      // 将输出作为下一个Skill的输入（合并模式）
      if (result.success && result.data) {
        currentInput = { ...currentInput, ...result.data };
      }
    }

    return {
      results: Object.fromEntries(results),
      finalOutput: currentInput,
      executedCount: sorted.length
    };
  }

  /**
   * 关闭所有Skill
   */
  async shutdownAll() {
    const sorted = topologicalSort(this.skills).reverse();
    console.log(`[SkillRegistry] 🛑 按依赖逆序关闭 ${sorted.length} 个Skill`);

    for (const id of sorted) {
      const skill = this.skills.get(id);
      try {
        await skill.shutdown();
      } catch (e) {
        console.warn(`[SkillRegistry] Skill ${id} 关闭失败: ${e.message}`);
      }
    }
  }

  /**
   * 健康检查 —— 所有Skill自检
   */
  validateAll() {
    const reports = [];
    let healthyCount = 0;

    for (const [id, skill] of this.skills) {
      const report = skill.validateSelf();
      reports.push(report);
      if (report.healthy) healthyCount++;
    }

    return {
      total: this.skills.size,
      healthy: healthyCount,
      unhealthy: this.skills.size - healthyCount,
      reports
    };
  }

  /**
   * 获取注册表状态报告
   */
  getReport() {
    const skills = Array.from(this.skills.values()).map(s => s.getMetadata());
    const statusCounts = {};
    for (const s of skills) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }

    return {
      name: this.name,
      totalSkills: this.skills.size,
      statusCounts,
      skills: skills.map(s => ({
        id: s.id,
        name: s.name,
        version: s.version,
        status: s.status,
        category: s.category,
        dependencies: s.dependencies
      })),
      executionHistory: this.executionHistory.slice(-20) // 最近20条
    };
  }

  /**
   * 列出某个分类的所有Skill
   */
  listByCategory(category) {
    return Array.from(this.skills.values()).filter(s => s.category === category);
  }

  /**
   * 获取按依赖排序的Skill列表
   */
  getExecutionOrder() {
    const sortedIds = topologicalSort(this.skills);
    return sortedIds.map(id => this.skills.get(id));
  }

  /**
   * 按名称搜索Skill
   */
  findByName(name) {
    return Array.from(this.skills.values()).find(s => s.name === name);
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  SkillRegistry,
  topologicalSort
};
