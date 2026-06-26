/**
 * Quality Gate Pro - 商业大片质量管控系统
 * 
 * 4K画质检查 + 品牌合规 + 广告法合规 + 平台适配
 * 
 * @version v1.0
 * @priority P0 - 质量核心
 */

class QualityGatePro {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.strictMode = options.strictMode !== false; // 严格模式（商业广告必须开启）
    
    // 4K画质检查标准
    this.qualityStandards = {
      resolution: {
        min: '2560x1440', // 最低2K
        recommended: '3840x2160', // 推荐4K
        check: (prompt) => {
          return prompt.includes('4K') || prompt.includes('3840x2160') || 
                 prompt.includes('2K') || prompt.includes('2560x1440');
        }
      },
      frameRate: {
        min: 30,
        recommended: 60,
        check: (prompt) => prompt.includes('60fps') || prompt.includes('30fps')
      },
      colorDepth: {
        min: 8,
        recommended: 10,
        check: (prompt) => prompt.includes('10bit') || prompt.includes('8bit')
      },
      hdr: {
        required: true,
        check: (prompt) => prompt.includes('HDR') || prompt.includes('HDR10')
      },
      sharpness: {
        check: (prompt) => {
          return prompt.includes('锐利') || prompt.includes('清晰') || 
                 prompt.includes('sharp') || prompt.includes('detail');
        }
      },
      dynamicRange: {
        check: (prompt) => {
          return prompt.includes('动态范围') || prompt.includes('高光') || 
                 prompt.includes('暗部') || prompt.includes('dynamic range');
        }
      }
    };
    
    // 品牌合规检查
    this.brandCompliance = {
      // 必须包含品牌元素
      logoRequired: true,
      // 品牌色调占比
      brandColorRatio: { min: 10, max: 50 }, // 10%-50%
      // 品牌信息清晰度
      brandClarity: true,
      // 禁止竞品
      noCompetitor: true,
      // 品牌调性一致性
      brandToneConsistency: true
    };
    
    // 广告法合规检查（中国）
    this.adLawCompliance = {
      // 禁止绝对化用语
      forbiddenWords: [
        '最佳', '最好', '第一', '顶级', '最高级', '国家级', '世界级',
        '最佳', '第一', '唯一', '绝对', '完美', '永不', '100%'
      ],
      // 需要免责声明的内容
      disclaimerRequired: [
        '效果因人而异', '数据来源于实验室', '实际效果可能有差异'
      ],
      // 禁止的内容
      forbiddenContent: [
        '虚假宣传', '夸大效果', '医疗承诺', '投资回报承诺'
      ],
      // 特殊行业要求
      specialIndustries: {
        medical: '医疗广告需标注批准文号',
        food: '食品广告不得涉及疾病预防',
        cosmetics: '化妆品广告不得承诺效果',
        finance: '金融广告需标注风险提示'
      }
    };
    
    // 平台投放适配检查
    this.platformCompatibility = {
      tv: {
        maxDuration: 60,
        aspectRatio: '16:9',
        resolution: '1920x1080',
        colorSpace: 'Rec.709',
        audio: '立体声',
        requirements: ['无黑边', '安全区域', '字幕可读']
      },
      youtube: {
        maxDuration: 180,
        aspectRatio: '16:9',
        resolution: '3840x2160',
        colorSpace: 'Rec.2020',
        audio: '立体声',
        requirements: ['前5秒吸引', '缩略图友好', '品牌水印']
      },
      douyin: {
        maxDuration: 60,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        colorSpace: 'Rec.709',
        audio: '立体声',
        requirements: ['前3秒吸引', '竖屏构图', '字幕大字', '节奏快']
      },
      bilibili: {
        maxDuration: 300,
        aspectRatio: '16:9',
        resolution: '1920x1080',
        colorSpace: 'Rec.709',
        audio: '立体声',
        requirements: ['弹幕友好', '字幕清晰', '节奏适中']
      }
    };
  }

  /**
   * 执行完整质量检查
   */
  check(prompts, options = {}) {
    if (!this.enabled) return { passed: true, issues: [] };
    
    const results = {
      passed: true,
      issues: [],
      warnings: [],
      score: 100,
      checks: {
        quality: this.checkQuality(prompts),
        brand: this.checkBrandCompliance(prompts, options),
        adLaw: this.checkAdLawCompliance(prompts),
        platform: this.checkPlatformCompatibility(prompts, options)
      }
    };
    
    // 汇总问题
    Object.values(results.checks).forEach(check => {
      if (!check.passed) {
        results.passed = false;
        results.issues.push(...check.issues);
        results.warnings.push(...check.warnings);
        results.score -= check.deduction || 0;
      }
    });
    
    results.score = Math.max(0, results.score);
    
    return results;
  }

  /**
   * 检查4K画质
   */
  checkQuality(prompts) {
    const result = {
      passed: true,
      issues: [],
      warnings: [],
      deduction: 0
    };
    
    prompts.forEach((shot, index) => {
      const prompt = shot.prompt || '';
      
      // 检查分辨率
      if (!this.qualityStandards.resolution.check(prompt)) {
        result.warnings.push(`镜头${index + 1}: 未明确标注分辨率(建议4K/2K)`);
        result.deduction += 5;
      }
      
      // 检查帧率
      if (!this.qualityStandards.frameRate.check(prompt)) {
        result.warnings.push(`镜头${index + 1}: 未明确标注帧率(建议60fps)`);
        result.deduction += 3;
      }
      
      // 检查HDR
      if (this.qualityStandards.hdr.required && !this.qualityStandards.hdr.check(prompt)) {
        result.warnings.push(`镜头${index + 1}: 未标注HDR(建议HDR10+)`);
        result.deduction += 2;
      }
      
      // 检查锐度
      if (!this.qualityStandards.sharpness.check(prompt)) {
        result.warnings.push(`镜头${index + 1}: 缺少锐度/清晰度描述`);
        result.deduction += 2;
      }
    });
    
    if (result.deduction > 20) {
      result.passed = false;
      result.issues.push('画质标准未达标，建议增强4K/画质描述');
    }
    
    return result;
  }

  /**
   * 检查品牌合规
   */
  checkBrandCompliance(prompts, options = {}) {
    const result = {
      passed: true,
      issues: [],
      warnings: [],
      deduction: 0
    };
    
    const brandName = options.brandName || '';
    const brandColor = options.brandColor || '';
    
    if (!brandName) {
      result.warnings.push('未设置品牌名称，无法检查品牌合规');
      return result;
    }
    
    // 检查品牌是否出现
    const brandMentioned = prompts.some(s => 
      (s.prompt || '').includes(brandName)
    );
    
    if (!brandMentioned) {
      result.issues.push(`品牌"${brandName}"未在Prompt中出现`);
      result.deduction += 15;
    }
    
    // 检查品牌色调
    if (brandColor && !prompts.some(s => (s.prompt || '').includes(brandColor))) {
      result.warnings.push(`品牌色调${brandColor}未在Prompt中体现`);
      result.deduction += 5;
    }
    
    if (result.deduction > 10) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * 检查广告法合规
   */
  checkAdLawCompliance(prompts) {
    const result = {
      passed: true,
      issues: [],
      warnings: [],
      deduction: 0
    };
    
    prompts.forEach((shot, index) => {
      const prompt = shot.prompt || '';
      
      // 检查禁用词
      this.adLawCompliance.forbiddenWords.forEach(word => {
        if (prompt.includes(word)) {
          result.issues.push(`镜头${index + 1}: 包含广告法禁用词"${word}"`);
          result.deduction += 10;
        }
      });
      
      // 检查禁止内容
      this.adLawCompliance.forbiddenContent.forEach(content => {
        if (prompt.includes(content)) {
          result.issues.push(`镜头${index + 1}: 包含禁止内容"${content}"`);
          result.deduction += 15;
        }
      });
    });
    
    if (result.deduction > 0) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * 检查平台适配
   */
  checkPlatformCompatibility(prompts, options = {}) {
    const result = {
      passed: true,
      issues: [],
      warnings: [],
      deduction: 0
    };
    
    const platform = options.platform || 'tv';
    const standard = this.platformCompatibility[platform];
    
    if (!standard) {
      result.warnings.push(`未知平台"${platform}"，使用默认标准`);
      return result;
    }
    
    // 检查时长
    const totalDuration = prompts.reduce((s, x) => s + (x.duration || 0), 0);
    if (totalDuration > standard.maxDuration) {
      result.issues.push(`总时长${totalDuration}秒超过${platform}平台限制${standard.maxDuration}秒`);
      result.deduction += 20;
    }
    
    // 检查画幅
    const aspectRatio = options.aspectRatio || '16:9';
    if (aspectRatio !== standard.aspectRatio) {
      result.warnings.push(`画幅${aspectRatio}与${platform}推荐${standard.aspectRatio}不一致`);
      result.deduction += 5;
    }
    
    if (result.deduction > 10) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * 生成质量报告
   */
  generateReport(results) {
    const lines = [
      '═══════════════════════════════════════',
      '  商业大片质量管控报告',
      '═══════════════════════════════════════',
      '',
      `综合评分: ${results.score}/100`,
      `检查状态: ${results.passed ? '✅ 通过' : '❌ 未通过'}`,
      '',
      '详细检查:',
      `  4K画质: ${results.checks.quality.passed ? '✅' : '❌'} (${results.checks.quality.warnings.length}项警告)`,
      `  品牌合规: ${results.checks.brand.passed ? '✅' : '❌'} (${results.checks.brand.issues.length}项问题)`,
      `  广告法合规: ${results.checks.adLaw.passed ? '✅' : '❌'} (${results.checks.adLaw.issues.length}项问题)`,
      `  平台适配: ${results.checks.platform.passed ? '✅' : '❌'} (${results.checks.platform.warnings.length}项警告)`,
      ''
    ];
    
    if (results.issues.length > 0) {
      lines.push('严重问题:');
      results.issues.forEach((issue, i) => lines.push(`  ${i + 1}. ${issue}`));
      lines.push('');
    }
    
    if (results.warnings.length > 0) {
      lines.push('改进建议:');
      results.warnings.forEach((warning, i) => lines.push(`  ${i + 1}. ${warning}`));
      lines.push('');
    }
    
    lines.push('═══════════════════════════════════════');
    
    return lines.join('\n');
  }
}

module.exports = { QualityGatePro };
