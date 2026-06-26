/**
 * STAGE-5: Script Generation
 * 剧本生成与分析 - 剧本生成Agent驱动
 * 自动提取自 nirath-master-pipeline.js
 */

const { StageBase } = require('./stage-base');

class StageScriptGeneration extends StageBase {
  constructor(pipeline) {
    super(pipeline);
    this.mode = pipeline.mode || 'generic';
  }

  async execute(input, prd) {
    this.log('info', 'STAGE-5: 剧本生成与分析(剧本生成Agent驱动)');

    // 防硬编码:调用剧本生成Agent进行分析和创作
    let script;
    try {
      if (input.scriptAgent && typeof input.scriptAgent.generate === 'function') {
        script = await input.scriptAgent.generate({
          prd,
          core: input.core,
          world: input.world,
          mode: this.mode
        });
        this.log('info', `✅ 剧本Agent生成 | 场景数: ${script.scenes?.length || 0}`);
      } else {
        // Fallback: 结构化生成
        script = this._fallbackScriptGeneration(input, prd);
      }
    } catch (e) {
      this.log('warn', `⚠️ 剧本Agent调用失败: ${e.message}，使用fallback`);
      script = this._fallbackScriptGeneration(input, prd);
    }

    // 确保基本结构
    if (!script.scenes || !Array.isArray(script.scenes)) {
      script.scenes = [];
    }

    // 为每个场景补充默认字段
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      scene.id = scene.id || `S${String(i + 1).padStart(2, '0')}`;
      scene.type = scene.type || 'explanation';
      scene.importance = scene.importance || 5;
      scene.visualComplexity = scene.visualComplexity || 5;
      scene.duration = scene.duration || 5;
      scene.dialogue = scene.dialogue || scene.narration || '';
      scene.narration = scene.narration || scene.dialogue || '';
    }

    this.log('info', `✅ 剧本生成完成 | 场景数: ${script.scenes.length}`);
    return script;
  }

  /**
   * Fallback剧本生成
   */
  _fallbackScriptGeneration(input, prd) {
    this.log('info', '使用fallback剧本生成');
    
    const scenes = [];
    const coreScenes = prd.scenes || input.scenes || [];
    
    for (let i = 0; i < coreScenes.length; i++) {
      const s = coreScenes[i];
      scenes.push({
        id: s.id || `S${String(i + 1).padStart(2, '0')}`,
        name: s.name || `场景${i + 1}`,
        type: s.type || 'explanation',
        narration: s.narration || s.dialogue || '',
        dialogue: s.dialogue || s.narration || '',
        importance: s.importance || 5,
        visualComplexity: s.visualComplexity || 5,
        duration: s.duration || 5,
        characters: s.characters || [],
        setting: s.setting || {},
        props: s.props || []
      });
    }

    return {
      mainTitle: prd.meta?.title || input.projectName || '未命名项目',
      seriesTitle: input.seriesTitle || '',
      episode: input.episode || 1,
      totalEpisodes: input.totalEpisodes || 1,
      mode: this.mode,
      aspectRatio: input.aspectRatio || '16:9',
      style: input.style || '',
      creativeIntensity: input.creativeIntensity || 0.5,
      narrativeMode: input.narrativeMode || 'third_person',
      contentScope: input.contentScope || '',
      protagonistName: input.protagonistName || '',
      protagonistDescription: input.protagonistDescription || '',
      scenes,
      narrative: {
        totalDuration: input.targetDuration || 15,
        pace: input.pace || 'classic'
      }
    };
  }
}

module.exports = { StageScriptGeneration };
