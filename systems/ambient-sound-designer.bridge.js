const { generateAmbientSoundField } = require('./ambient-sound-designer');

class AmbientSoundDesignerBridge {
  constructor(options = {}) {
    this.maxChars = options.maxChars || 80;
    this.mode = options.mode || 'generic'; // v6.6.9.4-patch21: 支持模式切换
  }

  /**
   * 输出标准字段
   */
  generateFields(shot = {}, context = {}) {
    let text = '';
    try {
      text = generateAmbientSoundField(shot, { 
        maxChars: this.maxChars,
        mode: this.mode
      }) || '';
    } catch (e) {
      text = '';
    }

    text = String(text)
      .replace(/[【】]/g, '')
      .trim();

    return {
      AUDIO: text ? `【环境音效】${text}` : ''
    };
  }

  /**
   * 子系统编排器 v2 标准接口
   */
  async run(shot = {}, context = {}) {
    return this.generateFields(shot, context);
  }
}

module.exports = { AmbientSoundDesignerBridge };
