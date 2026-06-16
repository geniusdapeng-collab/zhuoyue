/**
 * Creative Intensity Recommender v1.0
 * 基于历史完播率数据自动推荐最优创意指数
 * 
 * 核心逻辑：
 * 1. 按视频类型分组收集反馈数据
 * 2. 计算不同 intensity 区间的平均完播率
 * 3. 推荐最优 intensity 值（带置信度）
 * 4. 支持反馈闭环：记录实际效果，持续优化
 */

class CreativeIntensityRecommender {
  constructor(options = {}) {
    this.dataPath = options.dataPath || './data/creative-intensity-feedback.json';
    this.minSamples = options.minSamples || 3; // 最少样本数才给出推荐
    this.confidenceThreshold = options.confidenceThreshold || 0.6; // 置信度阈值
    this.defaultRecommendations = {
      'health_edu': { intensity: 0.4, reason: '医疗科普需要专业可信感，过高创意指数可能降低权威感' },
      'drama': { intensity: 0.7, reason: '剧情短片需要较强影视表现力来吸引观众' },
      'commercial': { intensity: 0.8, reason: '商业广告需要突出产品，高创意指数增强视觉冲击力' },
      'documentary': { intensity: 0.5, reason: '纪录片需要真实感与适度艺术性的平衡' },
      'nirath': { intensity: 0.7, reason: 'Nirath系列需要电影级视觉呈现' }
    };
    this.data = this._loadData();
  }

  _loadData() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[CreativeIntensityRecommender] 数据加载失败: ${e.message}`);
    }
    return this._createEmptyData();
  }

  _createEmptyData() {
    return {
      schema: 'creative-intensity-feedback-v1',
      entries: [],
      aggregated: {}
    };
  }

  _saveData() {
    try {
      const fs = require('fs');
      const dir = require('path').dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[CreativeIntensityRecommender] 数据保存失败: ${e.message}`);
    }
  }

  /**
   * 记录一次预生产结果（用于后续分析）
   * @param {Object} entry - { videoType, intensity, completionRate, engagementRate, videoId, timestamp }
   */
  record(entry) {
    const record = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoType: entry.videoType || 'unknown',
      intensity: entry.intensity || 0.2,
      completionRate: entry.completionRate || 0, // 0-100
      engagementRate: entry.engagementRate || 0, // 0-100 (点赞+评论+分享综合)
      videoId: entry.videoId || '',
      timestamp: entry.timestamp || new Date().toISOString(),
      metadata: entry.metadata || {}
    };

    this.data.entries.push(record);
    
    // 更新聚合数据
    this._updateAggregation(record);
    
    // 保存数据
    this._saveData();

    console.log(`[CreativeIntensityRecommender] 记录已保存 | ${record.videoType} | intensity=${record.intensity} | 完播率=${record.completionRate}%`);
    return record;
  }

  _updateAggregation(record) {
    const type = record.videoType;
    if (!this.data.aggregated[type]) {
      this.data.aggregated[type] = {
        type: this._getTypeName(type),
        samples: 0,
        intensity_distribution: {},
        recommended: this.defaultRecommendations[type]?.intensity || 0.5,
        confidence: 0
      };
    }

    const agg = this.data.aggregated[type];
    agg.samples++;

    // 按 intensity 区间聚合（0.1为步长）
    const intensityKey = Math.round(record.intensity * 10) / 10; // 0.1, 0.2, 0.3...
    if (!agg.intensity_distribution[intensityKey]) {
      agg.intensity_distribution[intensityKey] = {
        count: 0,
        avg_completion: 0,
        avg_engagement: 0,
        total_completion: 0,
        total_engagement: 0
      };
    }

    const dist = agg.intensity_distribution[intensityKey];
    dist.count++;
    dist.total_completion += record.completionRate;
    dist.total_engagement += record.engagementRate;
    dist.avg_completion = Math.round(dist.total_completion / dist.count * 10) / 10;
    dist.avg_engagement = Math.round(dist.total_engagement / dist.count * 10) / 10;

    // 重新计算推荐值
    this._recalculateRecommendation(type);
  }

  _recalculateRecommendation(videoType) {
    const agg = this.data.aggregated[videoType];
    if (!agg || agg.samples < this.minSamples) {
      return; // 样本不足，使用默认值
    }

    // 找出平均完播率最高的 intensity 区间
    let bestIntensity = 0.2;
    let bestCompletion = 0;
    let totalWeight = 0;

    for (const [intensity, data] of Object.entries(agg.intensity_distribution)) {
      if (data.count >= 1) {
        const intensityValue = parseFloat(intensity);
        // 加权：完播率占70%，互动率占30%
        const score = data.avg_completion * 0.7 + data.avg_engagement * 0.3;
        
        if (score > bestCompletion) {
          bestCompletion = score;
          bestIntensity = intensityValue;
        }
        
        totalWeight += data.count;
      }
    }

    // 计算置信度（基于样本数量）
    const confidence = Math.min(agg.samples / (this.minSamples * 3), 1.0); // 9个样本达到100%置信度
    
    agg.recommended = bestIntensity;
    agg.confidence = Math.round(confidence * 100) / 100;
    agg.bestScore = Math.round(bestCompletion * 10) / 10;
  }

  _getTypeName(videoType) {
    const names = {
      'health_edu': '医疗科普',
      'drama': '剧情短片',
      'commercial': '商业广告',
      'documentary': '纪录片',
      'nirath': 'Nirath系列'
    };
    return names[videoType] || videoType;
  }

  /**
   * 获取最优 intensity 推荐
   * @param {string} videoType - 视频类型
   * @param {Object} options - { useCache, allowOverride }
   * @returns {Object} - { intensity, confidence, reason, isDefault, distribution }
   */
  recommend(videoType, options = {}) {
    const agg = this.data.aggregated[videoType];
    
    // 如果有足够数据，使用数据驱动推荐
    if (agg && agg.samples >= this.minSamples && agg.confidence >= this.confidenceThreshold) {
      return {
        intensity: agg.recommended,
        confidence: agg.confidence,
        reason: `基于 ${agg.samples} 个样本的数据分析，intensity=${agg.recommended} 时平均完播率最高（加权得分 ${agg.bestScore}）`,
        isDefault: false,
        distribution: agg.intensity_distribution,
        samples: agg.samples
      };
    }

    // 样本不足，使用默认值
    const defaultRec = this.defaultRecommendations[videoType] || { intensity: 0.5, reason: '通用默认值' };
    return {
      intensity: defaultRec.intensity,
      confidence: 0,
      reason: defaultRec.reason + `（当前样本不足 ${this.minSamples} 个，使用类型默认值）`,
      isDefault: true,
      distribution: agg?.intensity_distribution || {},
      samples: agg?.samples || 0
    };
  }

  /**
   * 获取所有类型的推荐汇总
   */
  getAllRecommendations() {
    const result = {};
    for (const type of Object.keys(this.defaultRecommendations)) {
      result[type] = this.recommend(type);
    }
    return result;
  }

  /**
   * 生成推荐报告
   */
  generateReport() {
    const recs = this.getAllRecommendations();
    let report = '# 创意指数推荐报告\n\n';
    report += `| 视频类型 | 推荐指数 | 置信度 | 样本数 | 数据来源 |\n`;
    report += `|---------|---------|--------|--------|----------|\n`;
    
    for (const [type, rec] of Object.entries(recs)) {
      const typeName = this._getTypeName(type);
      const source = rec.isDefault ? '默认值' : '数据驱动';
      report += `| ${typeName} | ${rec.intensity} | ${rec.confidence * 100}% | ${rec.samples} | ${source} |\n`;
    }

    report += '\n## 详细说明\n\n';
    for (const [type, rec] of Object.entries(recs)) {
      const typeName = this._getTypeName(type);
      report += `### ${typeName}\n`;
      report += `- 推荐指数: **${rec.intensity}**\n`;
      report += `- 置信度: ${rec.confidence * 100}%\n`;
      report += `- 样本数: ${rec.samples}\n`;
      report += `- 原因: ${rec.reason}\n`;
      
      if (Object.keys(rec.distribution).length > 0) {
        report += `- 分布数据:\n`;
        for (const [intensity, data] of Object.entries(rec.distribution)) {
          report += `  - intensity=${intensity}: 样本${data.count}个, 平均完播率${data.avg_completion}%, 平均互动率${data.avg_engagement}%\n`;
        }
      }
      report += '\n';
    }

    return report;
  }

  /**
   * 获取数据摘要（用于调试）
   */
  getSummary() {
    return {
      totalEntries: this.data.entries.length,
      totalTypes: Object.keys(this.data.aggregated).length,
      aggregated: this.data.aggregated,
      defaultRecommendations: this.defaultRecommendations
    };
  }
}

module.exports = { CreativeIntensityRecommender };
