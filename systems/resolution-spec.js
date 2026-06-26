/**
 * Resolution Spec - 画质规格系统
 * 统一管理4K/2K/1080p等画质参数，自动注入Prompt
 * 
 * @version v1.0
 * @priority P0 - 画质基础
 */

class ResolutionSpec {
  constructor(spec = '4K') {
    this.specs = {
      '4K-UHD': {
        name: '4K超高清',
        resolution: '3840x2160',
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
        frameRate: 60,
        bitRate: '50Mbps',
        colorSpace: 'Rec.2020',
        colorGamut: '广色域',
        hdr: true,
        hdrFormat: 'HDR10+',
        chromaSubsampling: '4:2:2',
        bitDepth: 10,
        pixelDensity: '超精细',
        prompt: '4K超高清画质,3840x2160分辨率,60fps流畅帧率,Rec.2020广色域,HDR10+高动态范围,10bit色深,像素级精细,画面通透锐利',
        keywords: ['4K', 'UHD', '超高清', '3840x2160', '60fps', 'HDR', '广色域']
      },
      '2K-QHD': {
        name: '2K高清',
        resolution: '2560x1440',
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        frameRate: 60,
        bitRate: '25Mbps',
        colorSpace: 'Rec.709',
        colorGamut: '标准色域',
        hdr: false,
        hdrFormat: null,
        chromaSubsampling: '4:2:0',
        bitDepth: 8,
        pixelDensity: '精细',
        prompt: '2K高清画质,2560x1440分辨率,60fps流畅帧率,Rec.709标准色域,8bit色深,画面清晰细腻',
        keywords: ['2K', 'QHD', '高清', '2560x1440', '60fps']
      },
      '1080p-FHD': {
        name: '1080p全高清',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        frameRate: 30,
        bitRate: '15Mbps',
        colorSpace: 'Rec.709',
        colorGamut: '标准色域',
        hdr: false,
        hdrFormat: null,
        chromaSubsampling: '4:2:0',
        bitDepth: 8,
        pixelDensity: '标准',
        prompt: '1080p全高清,1920x1080分辨率,30fps标准帧率,Rec.709色域,画面清晰',
        keywords: ['1080p', 'FHD', '全高清', '1920x1080']
      }
    };
    
    this.current = this.specs[spec] || this.specs['4K-UHD'];
  }

  /**
   * 注入画质规格到Prompt
   */
  injectToPrompt(prompt) {
    if (!prompt) return this.current.prompt;
    return `${this.current.prompt} | ${prompt}`;
  }

  /**
   * 获取当前规格信息
   */
  getSpec() {
    return { ...this.current };
  }

  /**
   * 根据投放平台推荐规格
   */
  static recommendForPlatform(platform) {
    const platformMap = {
      'cinema': '4K-UHD',      // 影院级
      'tv': '4K-UHD',          // 电视广告
      'youtube': '4K-UHD',     // YouTube
      'bilibili': '4K-UHD',    // B站
      'douyin': '1080p-FHD',   // 抖音
      'xiaohongshu': '2K-QHD', // 小红书
      'wechat': '1080p-FHD',   // 微信
      'instagram': '1080p-FHD', // Instagram
      'tiktok': '1080p-FHD'    // TikTok
    };
    return platformMap[platform] || '4K-UHD';
  }

  /**
   * 获取画质增强关键词
   */
  getQualityKeywords() {
    return {
      sharpness: '画面锐利清晰,边缘分明,细节丰富',
      clarity: '通透感强,空气感,层次分明',
      color: '色彩饱满,色准精确,过渡自然',
      dynamic: '动态范围广,高光不过曝,暗部有细节',
      noise: '纯净无噪点,画面干净,颗粒感细腻'
    };
  }
}

module.exports = { ResolutionSpec };
