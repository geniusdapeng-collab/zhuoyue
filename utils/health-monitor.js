/**
 * Health Monitor - 系统健康监控器
 * 监控指标：内存、事件循环、连接池、文件描述符、未处理异常
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

class HealthMonitor {
  constructor(options = {}) {
    this.checkIntervalMs = options.checkIntervalMs || 30000;
    this.memoryThreshold = options.memoryThreshold || 1024; // MB
    this.eventLoopThreshold = options.eventLoopThreshold || 100; // ms
    this.checks = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
    this.isRunning = false;
    this.timer = null;
  }

  /**
   * 注册健康检查项
   */
  register(name, checkFn) {
    this.checks.set(name, {
      name,
      checkFn,
      lastResult: null,
      lastCheck: null
    });
  }

  /**
   * 启动监控
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // 执行所有检查
    this.runAllChecks();
    
    // 定时执行
    this.timer = setInterval(() => {
      this.runAllChecks();
    }, this.checkIntervalMs);
    
    console.log('[HealthMonitor] ✅ 健康监控已启动');
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[HealthMonitor] ⏹️ 健康监控已停止');
  }

  /**
   * 执行所有检查
   */
  async runAllChecks() {
    const results = {
      timestamp: Date.now(),
      healthy: true,
      checks: {}
    };

    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const result = await check.checkFn();
        const duration = Date.now() - start;
        
        check.lastResult = result;
        check.lastCheck = Date.now();
        
        results.checks[name] = {
          ...result,
          duration,
          checkedAt: Date.now()
        };
        
        if (!result.healthy) {
          results.healthy = false;
        }
      } catch (error) {
        results.checks[name] = {
          healthy: false,
          error: error.message,
          checkedAt: Date.now()
        };
        results.healthy = false;
      }
    }

    this.history.push(results);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return results;
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    const latest = this.history[this.history.length - 1];
    if (!latest) return { healthy: true, checks: {} };
    
    return {
      healthy: latest.healthy,
      timestamp: latest.timestamp,
      checks: latest.checks
    };
  }

  /**
   * 获取历史趋势
   */
  getTrend(metricName, durationMs = 300000) {
    const cutoff = Date.now() - durationMs;
    return this.history
      .filter(h => h.timestamp > cutoff)
      .map(h => ({
        timestamp: h.timestamp,
        value: h.checks[metricName]?.value
      }));
  }
}

// ============================================================
// 内置检查项
// ============================================================

/**
 * 内存检查
 */
function createMemoryCheck(thresholdMB = 1024) {
  return async () => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    return {
      healthy: heapUsedMB < thresholdMB,
      value: heapUsedMB,
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        rss: `${rssMB}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`
      }
    };
  };
}

/**
 * 事件循环延迟检查
 */
function createEventLoopCheck(thresholdMs = 100) {
  return async () => {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delay = Number(process.hrtime.bigint() - start) / 1000000; // ns → ms
        resolve({
          healthy: delay < thresholdMs,
          value: Math.round(delay * 100) / 100,
          details: { threshold: `${thresholdMs}ms` }
        });
      });
    });
  };
}

/**
 * 文件描述符检查
 */
function createFileDescriptorCheck() {
  return async () => {
    try {
      const fdDir = `/proc/${process.pid}/fd`;
      const fds = fs.readdirSync(fdDir);
      const fdCount = fds.length;
      const limit = 1024; // 默认ulimit
      
      return {
        healthy: fdCount < limit * 0.8,
        value: fdCount,
        details: {
          openFiles: fdCount,
          limit,
          usage: `${(fdCount / limit * 100).toFixed(1)}%`
        }
      };
    } catch (error) {
      return {
        healthy: true,
        value: 0,
        details: { note: '无法获取文件描述符信息', error: error.message }
      };
    }
  };
}

/**
 * CPU负载检查
 */
function createCPULoadCheck(threshold = 0.8) {
  return async () => {
    const loadAvg = os.loadavg()[0] / os.cpus().length;
    
    return {
      healthy: loadAvg < threshold,
      value: Math.round(loadAvg * 100) / 100,
      details: {
        loadAverage: loadAvg.toFixed(2),
        cpuCount: os.cpus().length,
        threshold
      }
    };
  };
}

/**
 * 未处理异常检查
 */
function createUnhandledExceptionCheck() {
  let count = 0;
  
  process.on('unhandledRejection', () => count++);
  process.on('uncaughtException', () => count++);
  
  return async () => {
    return {
      healthy: count === 0,
      value: count,
      details: {
        unhandledRejections: count,
        note: '自启动以来的未处理异常总数'
      }
    };
  };
}

module.exports = {
  HealthMonitor,
  createMemoryCheck,
  createEventLoopCheck,
  createFileDescriptorCheck,
  createCPULoadCheck,
  createUnhandledExceptionCheck
};
