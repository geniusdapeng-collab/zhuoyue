/**
 * Logger Utility
 * 统一日志管理 - 支持日志级别控制
 * 
 * 使用方式:
 * const { logger } = require('../utils/logger');
 * logger.info('消息');
 * logger.warn('警告');
 * logger.error('错误');
 * 
 * 环境变量控制:
 * LOG_LEVEL=debug|info|warn|error (默认: info)
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] >= currentLevel;
  }

  _format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `${this.prefix} ` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${prefix}${message}`;
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.debug(this._format('debug', message, meta), meta);
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.log(this._format('info', message, meta), meta);
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._format('warn', message, meta), meta);
    }
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._format('error', message, meta), meta);
    }
  }
}

// 默认logger实例
const defaultLogger = new Logger();

// 带前缀的logger工厂
function createLogger(prefix) {
  return new Logger(prefix);
}

module.exports = {
  Logger,
  logger: defaultLogger,
  createLogger,
  LOG_LEVELS,
  currentLevel
};
