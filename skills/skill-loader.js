/**
 * Skill Loader — 动态加载Skill目录下的所有Skill
 * zhuoyue/skills/skill-loader.js
 *
 * 职责：
 * - 扫描skills/目录下的所有Skill目录
 * - 自动加载入口文件（index.js 或 SKILL_NAME.js）
 * - 注册到SkillRegistry
 * - 支持热重载（开发模式）
 *
 * 约定目录结构：
 *   skills/
 *     my-skill/
 *       index.js          ← 优先加载
 *       my-skill.js       ← 备选
 *       config.json       ← 可选配置
 *     another-skill/
 *       index.js
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { SkillBase } = require('./skill-base');
const { SkillRegistry } = require('./skill-registry');

// ============================================================
// Skill Loader
// ============================================================

class SkillLoader {
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || path.join(__dirname);
    this.registry = options.registry || new SkillRegistry();
    this.autoRegister = options.autoRegister !== false;
    this.debug = options.debug || false;
    this.loadedSkills = new Map(); // path -> { skill, mtime }
  }

  /**
   * 扫描目录，发现所有Skill
   */
  scan() {
    const discovered = [];

    try {
      const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // 跳过隐藏目录和特殊目录
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const skillDir = path.join(this.skillsDir, entry.name);
        const entryFile = this._findEntryFile(skillDir, entry.name);

        if (entryFile) {
          discovered.push({
            id: entry.name,
            dir: skillDir,
            entryFile,
            config: this._loadConfig(skillDir)
          });
        } else {
          if (this.debug) {
            console.log(`[SkillLoader] ⚠️ 目录 ${entry.name} 未找到入口文件`);
          }
        }
      }
    } catch (error) {
      console.error(`[SkillLoader] 扫描目录失败: ${error.message}`);
    }

    return discovered;
  }

  /**
   * 查找Skill入口文件
   */
  _findEntryFile(skillDir, dirName) {
    const candidates = [
      path.join(skillDir, 'index.js'),
      path.join(skillDir, `${dirName}.js`),
      path.join(skillDir, 'skill.js'),
      path.join(skillDir, 'main.js')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /**
   * 加载可选配置
   */
  _loadConfig(skillDir) {
    const configPath = path.join(skillDir, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn(`[SkillLoader] 配置加载失败: ${configPath}`);
      }
    }
    return {};
  }

  /**
   * 加载单个Skill
   */
  load(discovery) {
    try {
      // 清除require缓存（开发模式热重载）
      delete require.cache[require.resolve(discovery.entryFile)];

      const module = require(discovery.entryFile);

      // 尝试多种导出方式
      let SkillClass = null;

      if (module.Skill && module.Skill.prototype instanceof SkillBase) {
        SkillClass = module.Skill;
      } else if (module.default && module.default.prototype instanceof SkillBase) {
        SkillClass = module.default;
      } else {
        // 尝试找到第一个继承自SkillBase的类
        for (const key of Object.keys(module)) {
          const exported = module[key];
          if (typeof exported === 'function' && exported.prototype instanceof SkillBase) {
            SkillClass = exported;
            break;
          }
        }
      }

      if (!SkillClass) {
        console.warn(`[SkillLoader] ${discovery.id} 未导出有效的Skill类`);
        return null;
      }

      // 实例化
      const config = { id: discovery.id, ...discovery.config };
      const skill = new SkillClass(config);

      // 记录加载信息
      const stats = fs.statSync(discovery.entryFile);
      this.loadedSkills.set(discovery.id, {
        skill,
        mtime: stats.mtimeMs,
        entryFile: discovery.entryFile
      });

      if (this.debug) {
        console.log(`[SkillLoader] ✅ 加载Skill: ${skill.id} (${skill.name})`);
      }

      // 自动注册
      if (this.autoRegister) {
        this.registry.register(skill);
      }

      return skill;
    } catch (error) {
      console.error(`[SkillLoader] ❌ 加载 ${discovery.id} 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 加载所有Skill
   */
  loadAll() {
    const discovered = this.scan();
    console.log(`[SkillLoader] 📂 发现 ${discovered.length} 个Skill目录`);

    const loaded = [];
    const failed = [];

    for (const discovery of discovered) {
      const skill = this.load(discovery);
      if (skill) {
        loaded.push(skill);
      } else {
        failed.push(discovery.id);
      }
    }

    console.log(`[SkillLoader] ✅ 加载完成 | 成功:${loaded.length} 失败:${failed.length}`);
    if (failed.length > 0) {
      console.log(`[SkillLoader] ❌ 失败: ${failed.join(', ')}`);
    }

    return { loaded, failed, registry: this.registry };
  }

  /**
   * 热重载检测（开发模式）
   */
  checkHotReload() {
    const changed = [];

    for (const [id, info] of this.loadedSkills) {
      try {
        const stats = fs.statSync(info.entryFile);
        if (stats.mtimeMs > info.mtime) {
          changed.push(id);
          console.log(`[SkillLoader] 🔄 检测到变更: ${id}`);

          // 重新加载
          this.registry.unregister(id);
          const discovery = {
            id,
            dir: path.dirname(info.entryFile),
            entryFile: info.entryFile,
            config: this._loadConfig(path.dirname(info.entryFile))
          };
          this.load(discovery);
        }
      } catch (e) {
        console.warn(`[SkillLoader] 检查 ${id} 失败: ${e.message}`);
      }
    }

    return changed;
  }

  /**
   * 获取加载报告
   */
  getReport() {
    return {
      skillsDir: this.skillsDir,
      totalLoaded: this.loadedSkills.size,
      loadedIds: Array.from(this.loadedSkills.keys()),
      registry: this.registry.getReport()
    };
  }
}

// ============================================================
// 便捷函数
// ============================================================

/**
 * 一键加载所有Skill
 */
function loadAllSkills(skillsDir, options = {}) {
  const loader = new SkillLoader({ skillsDir, ...options });
  return loader.loadAll();
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  SkillLoader,
  loadAllSkills
};
