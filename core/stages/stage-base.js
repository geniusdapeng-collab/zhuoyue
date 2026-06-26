/**
 * Stage Base Class
 * Pipeline Stage基类 - 所有Stage模块的父类
 * 
 * 设计目标:
 * 1. 统一Stage接口
 * 2. 提供通用工具方法
 * 3. 支持错误处理和日志
 */

class StageBase {
  constructor(pipeline, options = {}) {
    this.pipeline = pipeline;
    this.logger = options.logger || console;
    this.config = options.config || {};
  }

  /**
   * Stage主入口 - 子类必须实现
   */
  async execute(...args) {
    throw new Error('子类必须实现execute方法');
  }

  /**
   * 日志输出
   */
  log(level, message, meta = {}) {
    const prefix = `[${this.constructor.name}]`;
    if (this.logger[level]) {
      this.logger[level](`${prefix} ${message}`, meta);
    } else {
      console.log(`${prefix} ${message}`, meta);
    }
  }

  /**
   * 错误处理
   */
  handleError(error, context = {}) {
    this.log('error', `Stage执行失败: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      ...context
    });
    throw error;
  }

  /**
   * 性能计时
   */
  async measureExecution(fn, ...args) {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      this.log('info', `执行完成 | 耗时: ${duration}ms`);
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - start;
      this.log('error', `执行失败 | 耗时: ${duration}ms | 错误: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { StageBase };
