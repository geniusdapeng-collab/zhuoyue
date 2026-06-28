#!/usr/bin/env node
'use strict';

/**
 * Pipeline 执行指标收集器
 * deploy/metrics-collector.js
 *
 * 职责：
 * - 收集 Pipeline 执行耗时、Stage 成功率、内存占用
 * - 输出 Prometheus 格式指标（/metrics 端点）
 * - 内存中保留最近 N 小时的数据
 *
 * @version 1.0
 * @author 协同进化引擎
 */

const http = require('http');
const url = require('url');

class MetricsCollector {
  constructor(options = {}) {
    this.retentionHours = options.retentionHours || parseInt(process.env.METRICS_RETENTION_HOURS, 10) || 24;
    this.enabled = options.enabled !== false && process.env.ENABLE_METRICS !== 'false';

    // 指标存储
    this.pipelineExecutions = [];      // { timestamp, traceId, duration, stagesTotal, stagesSuccess }
    this.stageExecutions = [];         // { timestamp, stageId, skillId, duration, status, attempt }
    this.memorySamples = [];           // { timestamp, rss, heapUsed, heapTotal }
    this.errors = [];                  // { timestamp, traceId, stageId, errorType, message }

    // 聚合统计
    this.counters = {
      pipelineTotal: 0,
      pipelineSuccess: 0,
      pipelineFailed: 0,
      stageTotal: 0,
      stageSuccess: 0,
      stageSkipped: 0,
      stageFailed: 0,
      compensationTriggered: 0
    };

    // 启动内存采样
    if (this.enabled) {
      this._startMemorySampling();
    }
  }

  /**
   * 记录 Pipeline 执行完成
   */
  recordPipeline(result) {
    if (!this.enabled) return;

    const entry = {
      timestamp: Date.now(),
      traceId: result.traceId,
      duration: result.duration || 0,
      stagesTotal: result.executedStages?.length || 0,
      stagesSuccess: result.executedStages?.filter(s => s.status === 'success').length || 0
    };

    this.pipelineExecutions.push(entry);
    this.counters.pipelineTotal++;
    this.counters.pipelineSuccess++;

    this._cleanupOldData();
  }

  /**
   * 记录 Pipeline 失败
   */
  recordPipelineFailure(traceId, error, stagesExecuted = []) {
    if (!this.enabled) return;

    this.pipelineExecutions.push({
      timestamp: Date.now(),
      traceId,
      duration: 0,
      stagesTotal: stagesExecuted.length,
      stagesSuccess: stagesExecuted.filter(s => s.status === 'success').length
    });

    this.counters.pipelineTotal++;
    this.counters.pipelineFailed++;
    this.errors.push({
      timestamp: Date.now(),
      traceId,
      stageId: error.stageId || 'unknown',
      errorType: error.type || 'pipeline_failure',
      message: error.message || String(error)
    });

    this._cleanupOldData();
  }

  /**
   * 记录 Stage 执行
   */
  recordStage(stageId, skillId, duration, status, attempt = 1) {
    if (!this.enabled) return;

    this.stageExecutions.push({
      timestamp: Date.now(),
      stageId,
      skillId,
      duration,
      status,
      attempt
    });

    this.counters.stageTotal++;
    if (status === 'success') this.counters.stageSuccess++;
    else if (status === 'skipped') this.counters.stageSkipped++;
    else if (status === 'failed') this.counters.stageFailed++;

    this._cleanupOldData();
  }

  /**
   * 记录补偿触发
   */
  recordCompensation(traceId, stageId) {
    if (!this.enabled) return;
    this.counters.compensationTriggered++;
  }

  /**
   * 内存采样
   */
  _sampleMemory() {
    const mem = process.memoryUsage();
    this.memorySamples.push({
      timestamp: Date.now(),
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal
    });
    this._cleanupOldData();
  }

  _startMemorySampling() {
    // 每 60 秒采样一次内存
    setInterval(() => this._sampleMemory(), 60000);
    this._sampleMemory(); // 立即采样一次
  }

  /**
   * 清理过期数据
   */
  _cleanupOldData() {
    const cutoff = Date.now() - (this.retentionHours * 60 * 60 * 1000);

    this.pipelineExecutions = this.pipelineExecutions.filter(e => e.timestamp > cutoff);
    this.stageExecutions = this.stageExecutions.filter(e => e.timestamp > cutoff);
    this.memorySamples = this.memorySamples.filter(e => e.timestamp > cutoff);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
  }

  // ============================================================
  // 指标查询 API
  // ============================================================

  /**
   * 获取聚合摘要
   */
  getSummary() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    const recentPipelines = this.pipelineExecutions.filter(e => e.timestamp > hourAgo);
    const recentStages = this.stageExecutions.filter(e => e.timestamp > hourAgo);
    const recentErrors = this.errors.filter(e => e.timestamp > hourAgo);

    const avgDuration = recentPipelines.length > 0
      ? recentPipelines.reduce((sum, e) => sum + e.duration, 0) / recentPipelines.length
      : 0;

    const latestMem = this.memorySamples[this.memorySamples.length - 1];

    return {
      uptime: process.uptime(),
      counters: { ...this.counters },
      lastHour: {
        pipelines: recentPipelines.length,
        stages: recentStages.length,
        errors: recentErrors.length,
        avgPipelineDuration: Math.round(avgDuration)
      },
      memory: latestMem ? {
        rssMB: (latestMem.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (latestMem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (latestMem.heapTotal / 1024 / 1024).toFixed(2)
      } : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 输出 Prometheus 格式指标
   */
  toPrometheus() {
    const summary = this.getSummary();
    const lines = [];

    lines.push('# HELP skill_pipeline_total Total pipeline executions');
    lines.push('# TYPE skill_pipeline_total counter');
    lines.push(`skill_pipeline_total{status="success"} ${summary.counters.pipelineSuccess}`);
    lines.push(`skill_pipeline_total{status="failed"} ${summary.counters.pipelineFailed}`);

    lines.push('# HELP skill_stage_total Total stage executions');
    lines.push('# TYPE skill_stage_total counter');
    lines.push(`skill_stage_total{status="success"} ${summary.counters.stageSuccess}`);
    lines.push(`skill_stage_total{status="skipped"} ${summary.counters.stageSkipped}`);
    lines.push(`skill_stage_total{status="failed"} ${summary.counters.stageFailed}`);

    lines.push('# HELP skill_compensation_total Total compensations triggered');
    lines.push('# TYPE skill_compensation_total counter');
    lines.push(`skill_compensation_total ${summary.counters.compensationTriggered}`);

    if (summary.memory) {
      lines.push('# HELP skill_memory_rss_bytes Process RSS memory');
      lines.push('# TYPE skill_memory_rss_bytes gauge');
      lines.push(`skill_memory_rss_bytes ${Math.round(parseFloat(summary.memory.rssMB) * 1024 * 1024)}`);

      lines.push('# HELP skill_memory_heap_used_bytes Heap used memory');
      lines.push('# TYPE skill_memory_heap_used_bytes gauge');
      lines.push(`skill_memory_heap_used_bytes ${Math.round(parseFloat(summary.memory.heapUsedMB) * 1024 * 1024)}`);
    }

    lines.push('# HELP skill_uptime_seconds Process uptime');
    lines.push('# TYPE skill_uptime_seconds gauge');
    lines.push(`skill_uptime_seconds ${Math.round(summary.uptime)}`);

    return lines.join('\n') + '\n';
  }

  // ============================================================
  // HTTP 服务
  // ============================================================

  startHttpServer(port = process.env.EVENT_BUS_PORT || 3000) {
    if (!this.enabled) {
      console.log('[Metrics] 指标收集已禁用');
      return;
    }

    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);

      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      switch (parsed.pathname) {
        case '/health':
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
          break;

        case '/metrics':
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(this.toPrometheus());
          break;

        case '/summary':
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.getSummary(), null, 2));
          break;

        default:
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found', path: parsed.pathname }));
      }
    });

    server.listen(port, () => {
      console.log(`[Metrics] HTTP 指标服务已启动 | http://0.0.0.0:${port}`);
      console.log(`[Metrics] 端点: /health, /metrics, /summary`);
    });

    return server;
  }
}

module.exports = { MetricsCollector };

// 直接运行：启动指标 HTTP 服务
if (require.main === module) {
  const collector = new MetricsCollector();
  collector.startHttpServer();
}
