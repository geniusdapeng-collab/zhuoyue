'use strict';

class FallbackMonitor {
  constructor() {
    this.records = [];
  }

  record(stage, context = {}) {
    this.records.push({
      stage,
      context,
      timestamp: new Date().toISOString()
    });
  }

  summarize() {
    const byStage = {};
    for (const item of this.records) {
      byStage[item.stage] = (byStage[item.stage] || 0) + 1;
    }
    return {
      totalFallbacks: this.records.length,
      byStage,
      records: this.records
    };
  }

  hasCriticalFallback() {
    const criticalStages = ['STAGE-5', 'STAGE-9', 'STAGE-11', 'PROMPTFORGE'];
    return this.records.some(r => criticalStages.includes(r.stage));
  }
}

module.exports = {
  FallbackMonitor
};
