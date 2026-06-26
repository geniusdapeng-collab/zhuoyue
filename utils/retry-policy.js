/**
 * Retry Policy - 智能重试策略
 * 支持：指数退避 + 抖动 + 错误分类 + 熔断器集成
 */

class RetryPolicy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.jitter = options.jitter !== false; // 默认启用抖动
    this.retryableErrors = options.retryableErrors || [
      'ETIMEDOUT',      // 连接超时
      'ECONNRESET',     // 连接重置
      'ENOTFOUND',      // DNS解析失败
      'ECONNREFUSED',   // 连接被拒绝
      '429',            // 限流
      '503',            // 服务不可用
      '504',            // 网关超时
      'timeout',
      'aborted',
      'network',
    ];
    this.nonRetryableErrors = options.nonRetryableErrors || [
      '401',            // 未授权
      '403',            // 禁止访问
      '400',            // 请求错误
      '404',            // 未找到
    ];
  }

  /**
   * 执行带重试的函数
   */
  async execute(fn, context = '') {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 判断是否应该重试
        if (!this._shouldRetry(error, attempt)) {
          throw error;
        }
        
        // 计算退避时间
        const delay = this._calculateDelay(attempt);
        console.log(`[RetryPolicy] 第${attempt}次失败，${delay}ms后重试 | ${context} | 错误: ${error.message}`);
        await this._sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * 判断是否应该重试
   */
  _shouldRetry(error, attempt) {
    if (attempt > this.maxRetries) return false;
    
    const errorMessage = error.message || String(error);
    
    // 不可重试错误：立即失败
    if (this.nonRetryableErrors.some(e => errorMessage.includes(e))) {
      return false;
    }
    
    // 可重试错误
    if (this.retryableErrors.some(e => errorMessage.includes(e))) {
      return true;
    }
    
    // 默认：未知错误不重试（保守策略）
    return false;
  }

  /**
   * 计算退避时间
   */
  _calculateDelay(attempt) {
    // 指数退避：2^attempt * baseDelay
    let delay = this.baseDelayMs * Math.pow(2, attempt - 1);
    
    // 上限
    delay = Math.min(delay, this.maxDelayMs);
    
    // 抖动：增加随机性防止惊群效应
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // 50%-100%
    }
    
    return Math.round(delay);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RetryPolicy };
