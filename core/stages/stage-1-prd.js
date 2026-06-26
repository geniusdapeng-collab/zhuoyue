/**
 * STAGE-1: PRD Central Calibration Document Generation
 * 自动提取自 nirath-master-pipeline.js
 */

const { StageBase } = require('./stage-base');

class StagePRD extends StageBase {
  constructor(pipeline) {
    super(pipeline);
    this.mode = pipeline.mode || 'generic';
  }

  async execute(input) {
    this.log('info', 'STAGE-1: PRD中央校准文档生成');

    // v6.2-patch55-fix: 将characters数组转换为对象格式,确保Schema校验通过
    let characters = input.characters || {};
    if (Array.isArray(characters)) {
      const charObj = {};
      for (const char of characters) {
        if (char.id) charObj[char.id] = char;
      }
      characters = charObj;
    }

    const prd = {
      meta: {
        title: input.projectName,
        version: 'v1.0',
        mode: this.mode,
        createdAt: new Date().toISOString()
      },
      core: input.core || {},
      world: input.world || {},
      characters: characters,
      scenes: input.scenes || [],
      style: input.style || {},
      constraints: input.constraints || {}
    };

    // Nirath模式:注入Nirath世界观
    if (this.mode === 'nirath') {
      prd.world.nirathWorld = {
        planet: 'Nirath',
        era: 'Post-Convergence Era',
        dualStar: true,
        bioluminescentEcosystem: true
      };
      this.log('info', '✅ Nirath世界观已注入PRD');
    }

    return prd;
  }
}

module.exports = { StagePRD };
