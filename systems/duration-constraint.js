/**
 * Duration Constraint System - 商业广告时长约束系统
 * 
 * v6.8.2: 核心约束模块
 * 确保商业广告片符合总时长和单镜头时长规范
 * 
 * 约束规则:
 * 1. 总时长: 25-35秒 (默认30秒，可配置)
 * 2. 单个镜头: 2-10秒随机 (根据Seedance版本调整最小值)
 * 3. 镜头数量: 根据总时长和单镜头范围自动计算
 * 4. 智能分配: 确保总时长精确匹配，允许±0.5秒误差
 * 
 * Seedance兼容性:
 * - Seedance 2.0: 最小4秒 (当前版本)
 * - Seedance 2.5: 预计支持2秒 (7月初发布)
 * - 系统自适应: 根据seedanceVersion自动调整最小值
 * 
 * @version v1.0
 * @priority P0 - 约束核心
 */

class DurationConstraintSystem {
  constructor(options = {}) {
    // 总时长约束
    this.totalDuration = {
      target: options.totalDuration || 30,      // 目标时长(秒)
      min: options.minTotalDuration || 25,      // 最小总时长
      max: options.maxTotalDuration || 35,      // 最大总时长
      tolerance: 0.5                            // 允许误差(秒)
    };
    
    // 单个镜头约束
    this.shotDuration = {
      min: options.minShotDuration || 2,        // 最小单镜头时长
      max: options.maxShotDuration || 10,       // 最大单镜头时长
      // 根据Seedance版本调整
      seedanceVersion: options.seedanceVersion || '2.5'  // v6.8.2-fix: Seedance 2.5已发布，默认2.5
    };
    
    // 根据Seedance版本调整最小值
    this._adjustForSeedanceVersion();
    
    // 镜头数量约束
    this.shotCount = {
      min: options.minShots || 3,               // 最少镜头数
      max: options.maxShots || 12             // 最多镜头数
    };
    
    // 验证约束合理性
    this._validateConstraints();
  }

  /**
   * 根据Seedance版本调整最小值
   */
  _adjustForSeedanceVersion() {
    const version = this.shotDuration.seedanceVersion;
    
    if (version === '2.0') {
      // Seedance 2.0 最低支持4秒
      this.shotDuration.min = Math.max(this.shotDuration.min, 4);
      this.shotDuration._seedanceNote = 'Seedance 2.0 最低支持4秒，2秒镜头将在2.5版本支持';
    } else if (version === '2.5') {
      // Seedance 2.5 预计支持2秒
      this.shotDuration.min = Math.max(this.shotDuration.min, 2);
      this.shotDuration._seedanceNote = 'Seedance 2.5 支持2秒';
    } else {
      // 未知版本，保守使用4秒
      this.shotDuration.min = Math.max(this.shotDuration.min, 4);
      this.shotDuration._seedanceNote = '未知Seedance版本，保守使用4秒最小值';
    }
  }

  /**
   * 验证约束合理性
   */
  _validateConstraints() {
    const minTotal = this.shotCount.min * this.shotDuration.min;
    const maxTotal = this.shotCount.max * this.shotDuration.max;
    
    if (minTotal > this.totalDuration.max) {
      throw new Error(
        `约束不合理: 最少${this.shotCount.min}个镜头×最小${this.shotDuration.min}秒=` +
        `${minTotal}秒 > 最大总时长${this.totalDuration.max}秒。` +
        `建议: 减少镜头数或增加总时长上限`
      );
    }
    
    if (maxTotal < this.totalDuration.min) {
      throw new Error(
        `约束不合理: 最多${this.shotCount.max}个镜头×最大${this.shotDuration.max}秒=` +
        `${maxTotal}秒 < 最小总时长${this.totalDuration.min}秒。` +
        `建议: 增加镜头数或减少总时长下限`
      );
    }
  }

  /**
   * 生成符合约束的总时长
   * 在25-35秒之间随机，但偏向30秒（正态分布）
   */
  generateTotalDuration() {
    const { min, max, target } = this.totalDuration;
    
    // 使用正态分布，以target为中心
    // 简单实现：在[min, max]范围内随机，但target附近的概率更高
    const range = max - min;
    const centerOffset = target - min;
    
    // 生成0-1之间的随机数，偏向centerOffset/range
    let randomValue = Math.random();
    // 使用幂函数偏向中心
    randomValue = Math.pow(randomValue, 0.7); // 0.7 < 1，偏向左侧（需要调整）
    
    // 更简单的方案：两次随机取平均，偏向中心
    const r1 = Math.random();
    const r2 = Math.random();
    const avg = (r1 + r2) / 2;
    
    const duration = Math.round(min + avg * range);
    
    // 确保在范围内
    return Math.max(min, Math.min(max, duration));
  }

  /**
   * 为镜头分配时长
   * 确保每个镜头在2-10秒之间，且总和等于总时长
   * 
   * @param {number} totalDuration - 总时长(秒)
   * @param {number} shotCount - 镜头数量
   * @param {Array} sellingPoints - 卖点列表（可选，用于优先级调整）
   * @returns {Array} 每个镜头的时长数组
   */
  allocateShotDurations(totalDuration, shotCount, sellingPoints = []) {
    const { min, max } = this.shotDuration;
    
    // 验证可行性
    if (shotCount * min > totalDuration) {
      throw new Error(
        `无法分配: ${shotCount}个镜头×最小${min}秒=${shotCount * min}秒 > 总时长${totalDuration}秒。` +
        `建议减少镜头数至${Math.floor(totalDuration / min)}个或增加总时长`
      );
    }
    
    if (shotCount * max < totalDuration) {
      throw new Error(
        `无法分配: ${shotCount}个镜头×最大${max}秒=${shotCount * max}秒 < 总时长${totalDuration}秒。` +
        `建议增加镜头数至${Math.ceil(totalDuration / max)}个或减少总时长`
      );
    }
    
    // 初始化：每个镜头先分配最小值
    const durations = new Array(shotCount).fill(min);
    let remaining = totalDuration - shotCount * min; // 剩余可分配时长
    
    // 根据卖点优先级调整权重
    const weights = sellingPoints.length > 0 
      ? sellingPoints.map(sp => {
          // 优先级越高，权重越大（获得更多时长）
          const priorityWeight = 4 - (sp.priority || 3); // priority 1->3, 2->2, 3->1
          // 类型权重：功能/USP > 视觉/价格 > 社交证明
          const typeWeight = {
            'function': 3, 'usp': 3, 'tech': 3,
            'visual': 2, 'price': 2, 'rational': 2,
            'social_proof': 1, 'emotion': 1
          }[sp.type] || 1;
          return priorityWeight * typeWeight;
        })
      : new Array(shotCount).fill(1); // 无卖点时均等权重
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    // 按比例分配剩余时长
    const maxAdditional = max - min; // 每个镜头最多可额外获得的时长
    
    for (let i = 0; i < shotCount && remaining > 0; i++) {
      // 该镜头按权重分配的额外时长
      const weightRatio = weights[i] / totalWeight;
      const allocatedAdditional = Math.min(
        Math.round(remaining * weightRatio),
        maxAdditional
      );
      
      durations[i] += allocatedAdditional;
      remaining -= allocatedAdditional;
    }
    
    // 处理剩余时长（由于四舍五入可能还有剩余）
    let idx = 0;
    while (remaining > 0 && idx < shotCount * 3) { // 防止无限循环
      const i = idx % shotCount;
      if (durations[i] < max) {
        durations[i]++;
        remaining--;
      }
      idx++;
    }
    
    // 验证总时长
    const actualTotal = durations.reduce((a, b) => a + b, 0);
    if (Math.abs(actualTotal - totalDuration) > this.totalDuration.tolerance) {
      console.warn(`[DurationConstraint] 总时长偏差: ${actualTotal} vs ${totalDuration}`);
      // 微调最后一个镜头
      const diff = totalDuration - actualTotal;
      durations[shotCount - 1] += diff;
    }
    
    return durations;
  }

  /**
   * 生成完整的时长方案
   * 一步到位：生成总时长 + 分配镜头时长
   */
  generateDurationPlan(shotCount, sellingPoints = []) {
    const totalDuration = this.generateTotalDuration();
    const shotDurations = this.allocateShotDurations(totalDuration, shotCount, sellingPoints);
    
    return {
      totalDuration,
      shotCount,
      shotDurations,
      minShotDuration: this.shotDuration.min,
      maxShotDuration: this.shotDuration.max,
      seedanceVersion: this.shotDuration.seedanceVersion,
      seedanceNote: this.shotDuration._seedanceNote,
      // 生成时间轴
      timeline: this._generateTimeline(shotDurations)
    };
  }

  /**
   * 生成时间轴
   */
  _generateTimeline(shotDurations) {
    let currentTime = 0;
    return shotDurations.map((duration, idx) => {
      const start = currentTime;
      const end = currentTime + duration;
      currentTime = end;
      return {
        shotIndex: idx + 1,
        startTime: start,
        endTime: end,
        duration: duration
      };
    });
  }

  /**
   * 验证时长方案是否合规
   */
  validatePlan(plan) {
    const issues = [];
    
    // 检查总时长
    const actualTotal = plan.shotDurations.reduce((a, b) => a + b, 0);
    if (actualTotal < this.totalDuration.min || actualTotal > this.totalDuration.max) {
      issues.push(`总时长${actualTotal}秒超出范围[${this.totalDuration.min}-${this.totalDuration.max}]`);
    }
    
    // 检查单个镜头
    plan.shotDurations.forEach((duration, idx) => {
      if (duration < this.shotDuration.min) {
        issues.push(`Shot ${idx + 1}时长${duration}秒 < 最小值${this.shotDuration.min}秒`);
      }
      if (duration > this.shotDuration.max) {
        issues.push(`Shot ${idx + 1}时长${duration}秒 > 最大值${this.shotDuration.max}秒`);
      }
    });
    
    // 检查镜头数量
    if (plan.shotCount < this.shotCount.min) {
      issues.push(`镜头数${plan.shotCount} < 最小值${this.shotCount.min}`);
    }
    if (plan.shotCount > this.shotCount.max) {
      issues.push(`镜头数${plan.shotCount} > 最大值${this.shotCount.max}`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      totalDuration: actualTotal,
      averageShotDuration: actualTotal / plan.shotCount
    };
  }

  /**
   * 获取Seedance兼容性信息
   */
  getSeedanceCompatibility() {
    return {
      version: this.shotDuration.seedanceVersion,
      minShotDuration: this.shotDuration.min,
      maxShotDuration: this.shotDuration.max,
      note: this.shotDuration._seedanceNote,
      recommendations: [
        'Seedance 2.0: 单个镜头4-15秒',
        'Seedance 2.5: 单个镜头2-15秒(预计7月支持)',
        '当前系统使用' + this.shotDuration.min + '秒作为最小值'
      ]
    };
  }

  /**
   * 生成时长报告
   */
  generateReport(plan) {
    const validation = this.validatePlan(plan);
    const timeline = plan.timeline || this._generateTimeline(plan.shotDurations);
    
    const lines = [
      '═══════════════════════════════════════',
      '  商业广告时长约束报告',
      '═══════════════════════════════════════',
      '',
      `总时长: ${plan.totalDuration}秒 (目标: ${this.totalDuration.target}秒)`,
      `范围: [${this.totalDuration.min}-${this.totalDuration.max}]秒`,
      `镜头数: ${plan.shotCount}个`,
      `单镜头范围: [${plan.minShotDuration}-${plan.maxShotDuration}]秒`,
      `Seedance版本: ${plan.seedanceVersion}`,
      `Seedance备注: ${plan.seedanceNote}`,
      '',
      '镜头时长分配:',
      ...timeline.map(t => 
        `  Shot ${t.shotIndex}: ${t.startTime}-${t.endTime}s (${t.duration}s)`
      ),
      '',
      `平均镜头时长: ${validation.averageShotDuration.toFixed(1)}秒`,
      `验证状态: ${validation.valid ? '✅ 通过' : '❌ 未通过'}`,
      ...validation.issues.map(i => `  ⚠️ ${i}`),
      '',
      '═══════════════════════════════════════'
    ];
    
    return lines.join('\n');
  }
}

module.exports = { DurationConstraintSystem };
