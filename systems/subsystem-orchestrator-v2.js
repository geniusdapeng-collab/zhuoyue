const { AmbientSoundDesignerBridge } = require('./ambient-sound-designer.bridge');
const { CameraMovementSystemV3Bridge } = require('./camera-movement-system-v3.bridge');

class SubsystemOrchestratorV2 {
  constructor(options = {}) {
    this.options = options;
    this.adventure = null; // v6.6.9.4-patch19: 懒加载，避免generic模式加载Nirath模块
    this.soundBridge = new AmbientSoundDesignerBridge(options.sound || {});
    this.cameraBridge = new CameraMovementSystemV3Bridge(options.camera || {});
    this.beastBridge = null; // 懒加载
    this.openingLineAgent = null; // 懒加载
    this.voiceEngine = null; // 懒加载
  }

  _getAdventureSystem() {
    if (!this.adventure) {
      const { AdventureCinematographySystem } = require('./nirath/adventure-cinematography-system');
      this.adventure = new AdventureCinematographySystem(this.options.adventure || {});
    }
    return this.adventure;
  }

  _getBeastBridge() {
    if (!this.beastBridge) {
      const { BeastEntranceAgentBridge } = require('./nirath/beast-entrance-agent.bridge');
      this.beastBridge = new BeastEntranceAgentBridge(this.options.beast || {});
    }
    return this.beastBridge;
  }

  _getOpeningLineAgent() {
    if (!this.openingLineAgent) {
      const { BeastOpeningLineAgent } = require('./nirath/beast-opening-line-agent');
      this.openingLineAgent = new BeastOpeningLineAgent(this.options.openingLine || {});
    }
    return this.openingLineAgent;
  }

  _getVoiceEngine() {
    if (!this.voiceEngine) {
      const { BeastVoiceSignatureEngine } = require('./nirath/beast-voice-signature-engine');
      this.voiceEngine = new BeastVoiceSignatureEngine();
    }
    return this.voiceEngine;
  }

  async run(shot, context = {}) {
    const shotType = (shot.type || shot.shotType || '').toLowerCase();
    const isOpening = shotType.includes('opening') || shot.id === 'S00' || shot.id === 'S01' || shot.isOpening;
    const isClimax = shotType.includes('climax') || (shot.tension || 0) > 80;
    const isClosing = shotType.includes('closing') || shot.isClosing || shot.isEnding;
    const hasBeast = !!(context.beastId || shot.beastId || context.beastName || shot.beastName);

    const baseFields = {
      CHARACTER: this._buildCharacterField(shot, context),
      ACTION: '',
      SCENE: this._buildSceneField(shot, context),
      MOOD: this._buildMoodField(shot, context, { isOpening, isClimax, isClosing }),
      CAMERA: '',
      LIGHTING: '',
      NEGATIVE: '',
      AUDIO: '',
      RENDER: shot.renderStyle || '电影级、超写实、细节丰富',
      DIRECTOR: '',
      DIALOGUE: shot.dialogue || shot.narration || '' // v6.6.9.4-patch24: 添加DIALOGUE字段支持
    };

    const activatedSubsystems = [];

    // 1. 冒险运镜补充（只作为辅助）
    let adventureFields = {};
    try {
      const adventureCamera = this.adventure.generateAdventureCamera(
        shot,
        context.index || 0,
        context.totalShots || 1,
        {
          protagonistName: context.protagonistName || '主讲人',
          beastName: context.beastName || '',
          habitat: context.habitat || shot.scene || '',
          ability: context.ability || ''
        }
      );

      if (adventureCamera) {
        adventureFields = {
          CAMERA: adventureCamera.primary || '',
          MOOD: adventureCamera.emotion || ''
        };
        activatedSubsystems.push('AdventureCinematographySystem');
      }
    } catch (e) {}

    // 2. 运镜/光影 bridge
    let cameraFields = {};
    try {
      cameraFields = this.cameraBridge.generateFields(shot, context);
      activatedSubsystems.push('CameraMovementSystemV3Bridge');
    } catch (e) {}

    // 3. 环境音 bridge
    let soundFields = {};
    try {
      soundFields = this.soundBridge.generateFields(shot, context);
      activatedSubsystems.push('AmbientSoundDesignerBridge');
    } catch (e) {}

    // 4. 异兽出场 bridge (仅Nirath模式且有beast时)
    let beastFields = {};
    if (hasBeast && (isOpening || shotType.includes('reveal') || shotType.includes('entrance') || isClimax)) {
      try {
        beastFields = this._getBeastBridge().generateFields(shot, context);
        activatedSubsystems.push('BeastEntranceAgentBridge');
      } catch (e) {}
    }

    // 5. 神兽开场白（仅Nirath模式且有beast的opening）
    let openingFields = {};
    if (hasBeast && isOpening) {
      try {
        const openingLine = await this._getOpeningLineAgent().generate(
          {
            name: context.beastName || shot.beastName || '',
            coreTrait: context.beastTrait || '',
            habitat: context.habitat || shot.scene || '',
            age: context.beastAge || ''
          },
          {
            theme: context.episodeTheme || '',
            reversal: context.reversal || ''
          }
        );

        if (openingLine?.line) {
          openingFields.DIRECTOR = `开场神兽台词：「${openingLine.line}」`;
          activatedSubsystems.push('BeastOpeningLineAgent');
        }
      } catch (e) {}
    }

    // 6. 神兽声音签名（仅Nirath模式且有beast的opening）
    let voiceFields = {};
    if (hasBeast && isOpening) {
      try {
        const voice = this._getVoiceEngine().generate(
          context.beastId || shot.beastId,
          context.beastName || shot.beastName || '',
          { episodeHook: context.episodeHook || '' }
        );

        if (voice?.voiceMoment) {
          voiceFields.AUDIO = voice.voiceMoment;
          activatedSubsystems.push('BeastVoiceSignatureEngine');
        }
      } catch (e) {}
    }

    const merged = this._mergeFieldObjects(
      baseFields,
      adventureFields,
      cameraFields,
      soundFields,
      beastFields,
      openingFields,
      voiceFields
    );

    return {
      ...merged,
      _meta: {
        activatedSubsystems,
        hasBeast,
        isOpening,
        isClimax
      }
    };
  }

  _buildCharacterField(shot, context) {
    const chars = [];
    if (shot.characters && Array.isArray(shot.characters)) {
      chars.push(...shot.characters);
    }
    if (context.characters && Array.isArray(context.characters)) {
      chars.push(...context.characters);
    }
    return chars.join('，') || '';
  }

  _buildSceneField(shot, context) {
    return shot.scene || context.scene || shot.description || '';
  }

  _buildMoodField(shot, context, flags) {
    if (flags.isOpening) return 'establishing';
    if (flags.isClimax) return 'climax';
    if (flags.isClosing) return 'resolution';
    return shot.emotionPhase || context.emotionPhase || 'neutral';
  }

  _mergeFieldObjects(...objects) {
    const result = {};
    for (const obj of objects) {
      if (!obj) continue;
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_meta') continue;
        if (value && value.toString().trim()) {
          result[key] = value;
        }
      }
    }
    return result;
  }
}

module.exports = { SubsystemOrchestratorV2 };
