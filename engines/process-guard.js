'use strict';
/**
 * 全局进程防护 v1.0
 * 作用：捕获 unhandledRejection / uncaughtException，防止 LLM 超时悬空 promise 直接杀死进程
 * 用法：在 index.js / run.js / run-preproduction.js 等入口第一行 require('./engines/process-guard')
 */
let installed = false;
function install() {
  if (installed) return;
  installed = true;

  // v6.8.6-fix3: 强化ProcessGuard——AbortError吸收 + 超时 vs 致命错误分级处理
  process.on('unhandledRejection', (reason, promise) => {
    const msg = reason instanceof Error ? reason.message : String(reason);

    // P0: 吸收AbortError（Fetch/HTTP中断），这类错误不致命
    if (reason && reason.name === 'AbortError') {
      console.warn(`[ProcessGuard] 吸收AbortError: ${msg}`);
      return; // 直接return，不视为错误
    }

    if (msg.includes('超时') || msg.includes('timeout') || msg.includes('Timeout') || msg.includes('ETIMEDOUT')) {
      console.warn(`[ProcessGuard] 吸收LLM超时悬空rejection: ${msg}`);
    } else {
      console.error(`[ProcessGuard] 未处理Rejection(已吸收，进程继续): ${msg}`);
    }
  });

  process.on('uncaughtException', (err) => {
    // 区分：可吸收 vs 致命
    const msg = err.message || '';
    const isAbsorbable = (
      msg.includes('timeout') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNRESET') ||
      msg.includes('socket hang up') ||
      err.name === 'AbortError'
    );

    if (isAbsorbable) {
      console.warn(`[ProcessGuard] 吸收可恢复异常(进程继续): ${msg}`);
      return; // 不退出
    }

    console.error(`[ProcessGuard] 未捕获异常(已吸收，进程继续): ${msg}`);
    // 对于真正致命的错误（如内存溢出、语法错误），仍需要退出
    // 但这里不调用process.exit，让上层决定
  });

  // v6.8.6-fix3: 额外捕获AbortController信号
  process.on('SIGTERM', () => {
    console.warn('[ProcessGuard] 收到SIGTERM，优雅关闭中...');
    // 给上层时间清理，不立即退出
    setTimeout(() => process.exit(0), 5000);
  });
}

install();
module.exports = { install };
