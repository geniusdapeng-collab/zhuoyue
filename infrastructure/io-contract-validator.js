/**
 * IO Contract Validator v1.0
 * zhuoyue/infrastructure/io-contract-validator.js
 *
 * 职责：校验Skill间数据传递的合法性
 * - 检查必填字段是否存在
 * - 检查字段类型是否匹配
 * - 提供字段转换建议
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

// ============================================================
// IO 契约校验器
// ============================================================

class IOContractValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== false; // 默认严格模式
    this.allowTypeCoercion = options.allowTypeCoercion || false; // 是否允许类型强制转换
  }

  /**
   * 校验输入数据是否符合契约
   * @param {Object} data - 实际数据
   * @param {Array} contract - IO契约定义 (config.json中的io.input/output)
   * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
   */
  validate(data, contract) {
    if (!contract || !Array.isArray(contract)) {
      return { valid: true, errors: [], warnings: ['无契约定义，跳过校验'] };
    }

    const errors = [];
    const warnings = [];

    for (const field of contract) {
      const value = data ? data[field.name] : undefined;
      const exists = value !== undefined && value !== null;

      // 1. 必填检查
      if (field.required && !exists) {
        errors.push(`必填字段缺失: ${field.name} (${field.description || '无描述'})`);
        continue;
      }

      // 2. 类型检查（如果字段存在）
      if (exists && field.type) {
        const typeValid = this._checkType(value, field.type);
        if (!typeValid) {
          if (this.strictMode) {
            errors.push(`类型不匹配: ${field.name} 期望 ${field.type}，实际 ${this._getActualType(value)}`);
          } else {
            warnings.push(`类型警告: ${field.name} 期望 ${field.type}，实际 ${this._getActualType(value)}`);
          }
        }
      }

      // 3. 枚举检查
      if (exists && field.enum && !field.enum.includes(value)) {
        errors.push(`值不在允许范围内: ${field.name}=${value}，允许: ${field.enum.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 校验两个Skill之间的数据传递
   * @param {Array} outputContract - 上游Skill的输出契约
   * @param {Array} inputContract - 下游Skill的输入契约
   * @returns {Object} { compatible: boolean, mismatches: string[], suggestions: string[] }
   */
  checkCompatibility(outputContract, inputContract) {
    if (!outputContract || !inputContract) {
      return { compatible: true, mismatches: [], suggestions: ['契约缺失，跳过兼容性检查'] };
    }

    const mismatches = [];
    const suggestions = [];

    // 构建输出字段Map
    const outputMap = new Map();
    for (const field of outputContract) {
      outputMap.set(field.name, field);
    }

    for (const inputField of inputContract) {
      if (!inputField.required) continue; // 只检查必填字段

      const outputField = outputMap.get(inputField.name);

      if (!outputField) {
        mismatches.push(`下游必填字段 "${inputField.name}" 不在上游输出中`);
        suggestions.push(`建议上游Skill输出字段 "${inputField.name}"，或在下游将其设为可选`);
      } else if (outputField.type !== inputField.type) {
        mismatches.push(`字段 "${inputField.name}" 类型不匹配: 上游输出${outputField.type} → 下游输入${inputField.type}`);
        suggestions.push(`检查类型转换是否安全，或统一契约定义`);
      }
    }

    return {
      compatible: mismatches.length === 0,
      mismatches,
      suggestions
    };
  }

  /**
   * 从数据中提取符合契约的字段
   * @param {Object} data - 原始数据
   * @param {Array} contract - 输入契约
   * @returns {Object} 提取后的数据
   */
  extract(data, contract) {
    if (!contract || !Array.isArray(contract) || !data) {
      return data;
    }

    const extracted = {};
    for (const field of contract) {
      if (data[field.name] !== undefined) {
        extracted[field.name] = data[field.name];
      }
    }

    return extracted;
  }

  /**
   * 检查类型
   */
  _checkType(value, expectedType) {
    const actualType = this._getActualType(value);

    // 处理联合类型 (如 "string|string[]")
    const allowedTypes = expectedType.split('|').map(t => t.trim());

    for (const type of allowedTypes) {
      if (this._matchType(actualType, type)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 匹配类型
   */
  _matchType(actual, expected) {
    const typeMap = {
      'string': v => typeof v === 'string',
      'number': v => typeof v === 'number' && !isNaN(v),
      'boolean': v => typeof v === 'boolean',
      'array': v => Array.isArray(v),
      'object': v => typeof v === 'object' && v !== null && !Array.isArray(v),
      'function': v => typeof v === 'function',
      'null': v => v === null,
      'undefined': v => v === undefined
    };

    if (expected.endsWith('[]')) {
      // 数组类型 (如 "string[]")
      const itemType = expected.slice(0, -2);
      return Array.isArray(value) && value.every(item => this._matchType(this._getActualType(item), itemType));
    }

    const checker = typeMap[expected];
    if (checker) {
      return checker(value);
    }

    return true; // 未知类型，放行
  }

  /**
   * 获取实际类型
   */
  _getActualType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  IOContractValidator
};
