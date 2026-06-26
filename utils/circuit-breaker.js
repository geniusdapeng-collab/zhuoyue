/**
 * Circuit Breaker - 断路器模式
 * 防止LLM服务故障时级联失败
 * 
 * 状态转换:
 * CLOSED → 正常放行请求
 * OPEN → 快速失败（熔断）
 * HALF_OPEN → 试探性放行
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;    // 触发熔断的失败次数
    this.timeoutMs = options.timeoutMs || 60000;              // 熔断后冷却时间
    this.halfOpenRequests = options.halfOpenRequests || 3;    // HALF_OPEN状态允许通过的最大请求数
    
    this.state = 'CLOSED';           // CLOSED/OPEN/HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenRequestCount = 0;
    
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      stateChanges: []
    };
  }

  async execute(fn, context = '') {
    this.stats.totalCalls++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this._transitionTo('HALF_OPEN');
      } else {
        this.stats.rejectedCalls++;
        throw new Error(`[CircuitBreaker] 熔断器打开，快速失败 | 上下文: ${context}`);
      }
    }
    
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenRequestCount >= this.halfOpenRequests) {
        this.stats.rejectedCalls++;
        throw new Error(`[CircuitBreaker] HALF_OPEN限流，请求被拒绝 | 上下文: ${context}`);
      }
      this.halfOpenRequestCount++;
    }

    try {
      const result = await fn();
      this._onSuccess();
      this.stats.successCalls++;
      return result;
    } catch (error) {
      this._onFailure(error);
      this.stats.failedCalls++;
      throw error;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenRequests) {
        this._transitionTo('CLOSED');
      }
    }
  }

  _onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this._transitionTo('OPEN');
    } else if (this.failureCount >= this.failureThreshold) {
      this._transitionTo('OPEN');
    }
  }

  _transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stats.stateChanges.push({
      from: oldState,
      to: newState,
      time: new Date().toISOString()
    });
    
    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenRequestCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenRequestCount = 0;
      this.successCount = 0;
    }
    
    console.log(`[CircuitBreaker] 状态变更: ${oldState} → ${newState}`);
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      stats: this.stats,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = { CircuitBreaker };
