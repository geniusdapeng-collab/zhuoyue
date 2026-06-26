/**
 * Version Manager
 * 统一版本号管理
 * 
 * 所有模块从此文件读取版本号，避免硬编码
 * 修改版本号只需修改此文件和 .current-version
 */

const fs = require('fs');
const path = require('path');

// 主版本号（从.current-version读取）
function getCurrentVersion() {
  try {
    const versionFile = path.join(__dirname, '..', '.current-version');
    return fs.readFileSync(versionFile, 'utf8').trim();
  } catch (err) {
    return 'v6.6.13';
  }
}

// 各子系统版本号
const VERSIONS = {
  // 主系统
  pipeline: getCurrentVersion(),
  
  // 核心模块
  promptBuilder: 'v3.0',
  fieldQuality: 'v1.0',
  stageSystem: 'v2.0',
  
  // 子系统
  openingSystem: 'v3.0-patch3-v2.2-fix',
  renderEngine: 'v2.0',
  scriptEngine: 'v2.0',
  
  // 工具
  logger: 'v1.0',
  charCounter: 'v2.0',
};

// 版本号工具函数
function getVersion(component) {
  return VERSIONS[component] || getCurrentVersion();
}

function getAllVersions() {
  return {
    ...VERSIONS,
    current: getCurrentVersion(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getCurrentVersion,
  getVersion,
  getAllVersions,
  VERSIONS
};
