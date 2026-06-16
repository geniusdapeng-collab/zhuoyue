const { ConfigUnifier } = require('./config-unifier-v1');
const { FieldMapper } = require('./field-mapper-v1');
const { ShotSchemaValidator } = require('./shot-schema-validator-v1');
const { SubsystemOrchestratorV2 } = require('./subsystem-orchestrator-v2');
const { NegativeFieldBuilder } = require('./negative-field-builder-v1');
const { ClosingShotEmotionalBoosterV2 } = require('./closing-shot-emotional-booster-v2');
const { PromptNormalizer } = require('./prompt-normalizer-v1');
const { PromptTrimmer } = require('./prompt-trimmer-v1');
const { PromptValidator } = require('./prompt-validator-v1');
const { ShotDebugRecorder } = require('./shot-debug-recorder-v1');

class FinalPromptBuilderV3 {
  constructor(options = {}) {
    this.config = new ConfigUnifier();
    this.maxLength = options.maxLength || this.config.getPromptMaxLength();
    this.mode = options.mode || 'nirath'; // v6.6.9.4-patch25: 支持模式隔离

    this.mapper = new FieldMapper();
    this.schemaValidator = new ShotSchemaValidator({ strict: false });
    this.orchestrator = new SubsystemOrchestratorV2(options.subsystems || {});
    this.creativeRouter = null; // v6.6.9.4-patch19: 懒加载，避免generic模式加载Nirath模块
    this.negativeBuilder = new NegativeFieldBuilder({ maxLength: 220 });
    this.closingBooster = new ClosingShotEmotionalBoosterV2();
    this.normalizer = new PromptNormalizer({ maxLength: this.maxLength });
    this.trimmer = new PromptTrimmer({ maxLength: this.maxLength });
    this.validator = new PromptValidator({ maxLength: this.maxLength });

    this.debugRecorder = new ShotDebugRecorder({
      enabled: options.debug !== false,
      outputDir: options.debugOutputDir
    });
  }

  _getCreativeRouter() {
    if (!this.creativeRouter) {
      const { CreativeLLMRouter } = require('./nirath/creative-llm-router-v1');
      this.creativeRouter = new CreativeLLMRouter({
        enabled: this.config.llmEnabled !== false,
        model: this.config.llmModel || this.config.getLLMModel('kimi-k2p6'),
        timeoutMs: this.config.getLLMTimeout('creative'),
        maxRetries: this.config.getLLMMaxRetries()
      });
    }
    return this.creativeRouter;
  }

  async build(rawShot, context = {}) {
    const shot = this.mapper.mapShot(rawShot, context);
    const shotId = shot.id || 'unknown';

    // 1. schema 校验
    const schemaCheck = this.schemaValidator.validate(shot);

    // 2. 子系统字段
    const subsystemFields = await this.orchestrator.run(shot, context);

    // 3. LLM 创作字段（优先给 opening / reveal / climax）
    const useLLM = this._shouldUseLLM(shot);
    let llmFields = {};
    if (useLLM) {
      llmFields = await this._getCreativeRouter().decideShotCreative(shot, context);
    }

    // 4. 合并字段
    let merged = this._mergeFields(subsystemFields, llmFields, shot);

    // 5. NEGATIVE 统一构建
    merged.NEGATIVE = this.negativeBuilder.build({
      sceneType: context.sceneType || shot.sceneType || 'nature_epic',
      hasCharacter: (shot.characters || []).length > 0,
      isRealistic: true,
      extraNegatives: context.extraNegatives || []
    });

    // 6. 结尾镜增强
    const boosted = this.closingBooster.boost(merged, shot);
    merged = boosted.fields;

    // 7. normalize
    let normalized = this.normalizer.normalize(merged);

    // 8. trim
    const trimmed = this.trimmer.trim(
      normalized.fields,
      (fields) => this.normalizer.compose(fields)
    );

    // 9. trim 后再 normalize
    normalized = this.normalizer.normalize(trimmed.fields);

    // 10. final validate
    const validation = this.validator.validate(normalized);

    // 11. debug record
    this.debugRecorder.record(shotId, {
      rawShot,
      mappedShot: shot,
      context,
      schemaCheck,
      subsystemFields,
      llmFields,
      mergedFields: merged,
      normalizedFields: normalized.fields,
      finalPrompt: normalized.prompt,
      validation,
      meta: {
        builderVersion: 'v3',
        timestamp: new Date().toISOString()
      }
    });

    return {
      shotId,
      prompt: normalized.prompt,
      fields: normalized.fields,
      validation,
      debug: this.debugRecorder.getRecord(shotId)
    };
  }

  _shouldUseLLM(shot) {
    // v6.6.9.4-patch25: generic模式不调用Nirath专属CreativeLLMRouter
    if (this.mode === 'generic') return false;
    
    const type = (shot.type || shot.shotType || '').toLowerCase();
    return type.includes('opening') || type.includes('reveal') || type.includes('climax');
  }

  _mergeFields(subsystem, llm, shot) {
    const merged = { ...subsystem };
    
    // LLM 字段优先级更高
    if (llm && typeof llm === 'object') {
      Object.keys(llm).forEach(key => {
        if (llm[key] && llm[key].trim && llm[key].trim().length > 0) {
          merged[key] = llm[key];
        }
      });
    }
    
    // 确保必要字段存在
    if (!merged.CHARACTER && shot.characters) {
      merged.CHARACTER = shot.characters.map(c => c.name || c).join(', ');
    }
    
    return merged;
  }
}

module.exports = { FinalPromptBuilderV3 };
