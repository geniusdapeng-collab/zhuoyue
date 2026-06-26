/**
 * Stage Loader
 * 动态加载和管理Pipeline Stage模块
 */

const fs = require('fs');
const path = require('path');
const { StageBase } = require('./stage-base');

class StageLoader {
  constructor(stagesDir = __dirname) {
    this.stagesDir = stagesDir;
    this.stages = new Map();
    this.cache = new Map();
  }

  /**
   * 加载单个Stage
   */
  load(stageName) {
    if (this.cache.has(stageName)) {
      return this.cache.get(stageName);
    }

    const fileName = this._resolveFileName(stageName);
    const filePath = path.join(this.stagesDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Stage模块不存在: ${stageName} (查找: ${filePath})`);
    }

    delete require.cache[require.resolve(filePath)];
    const module = require(filePath);
    
    // 查找导出的Stage类 - 支持多种命名方式
    let StageClass = module[stageName];
    
    // 如果没找到，尝试驼峰命名转换
    if (!StageClass) {
      const camelName = stageName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      StageClass = module[camelName];
    }
    
    // 还是没找到，遍历所有导出查找继承StageBase的类
    if (!StageClass) {
      StageClass = Object.values(module).find(v => 
        typeof v === 'function' && v.prototype instanceof StageBase
      );
    }

    if (!StageClass) {
      throw new Error(`Stage模块 ${stageName} 未导出有效的Stage类`);
    }

    this.cache.set(stageName, StageClass);
    return StageClass;
  }

  /**
   * 加载所有Stage
   */
  loadAll() {
    const files = fs.readdirSync(this.stagesDir)
      .filter(f => f.endsWith('.js') && f !== 'stage-base.js' && f !== 'stage-loader.js');

    for (const file of files) {
      const stageName = path.basename(file, '.js');
      try {
        this.load(stageName);
        console.log(`✅ Stage已加载: ${stageName}`);
      } catch (error) {
        console.warn(`⚠️ Stage加载失败: ${stageName} - ${error.message}`);
      }
    }

    return this.cache;
  }

  /**
   * 解析Stage文件名
   */
  _resolveFileName(stageName) {
    // 支持多种命名格式
    const formats = [
      `${stageName}.js`,
      `stage-${stageName}.js`,
      `${stageName.replace(/^stage/i, '')}.js`,
    ];

    for (const format of formats) {
      const filePath = path.join(this.stagesDir, format);
      if (fs.existsSync(filePath)) {
        return format;
      }
    }

    return `${stageName}.js`;
  }

  /**
   * 获取已加载的Stage列表
   */
  list() {
    return Array.from(this.cache.keys());
  }

  /**
   * 清除缓存
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = { StageLoader };
