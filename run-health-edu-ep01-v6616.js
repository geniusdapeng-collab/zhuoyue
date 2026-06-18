#!/usr/bin/env node
/**
 * v6.6.9.4-patch16 预生产 - 横纹肌溶解科普视频第一集
 * 全链路验证：专家二轮方案落地后首次端到端测试
 */
const path = require('path');
const { NirathMasterPipeline } = require('./core/nirath-master-pipeline');

(async () => {
  console.log('[ConfigCenter] v6.6.9.4-patch16 加载完成 | prompt.maxLength=1500 | duration=62s');

  const pipeline = new NirathMasterPipeline({
    mode: 'generic',
    projectDir: path.join(__dirname, 'projects', 'health-edu-ep01-v6616'),
    outputDir: path.join(__dirname, 'output', 'health-edu-ep01-v6616'),
    llmModel: 'kimi-k2p6',
    allowReasoningFallback: true,
  });

  const result = await pipeline.execute({
    projectName: 'health-edu-ep01-rhabdo-v6616',
    videoTitle: '横纹肌溶解的症状以及实验室检查',
    videoSubtitle: '健康科普第一集',
    creativeIntensity: 1.0,
    targetDuration: 62,
    durationRange: '59-65秒',
    style: {
      primary: 'realistic',
      secondary: 'documentary',
      visualStyle: '全写实，电影级光影，好莱坞导演质感',
      cinematicQuality: '好莱坞电影质感',
      colorPalette: '自然光，中性色调，专业环境',
      mood: '专业温暖，通俗易懂，生动形象',
    },
    characters: [
      {
        id: 'chen-zhuo',
        name: '陈卓',
        role: '健康科普讲解员',
        description: '穿警服的女士，专业健康科普讲解员，生动形象，带有自然肢体语言',
        outfit: 'police uniform, professional police attire, dark blue police uniform with badge and insignia',
        visualStyle: '写实',
        gender: 'female',
        age: 28,
        isProtagonist: true,
      }
    ],
    content: {
      episode: 1,
      totalEpisodes: 3,
      mainTopic: '横纹肌溶解的症状以及实验室检查',
      subTopic: '什么是横纹肌溶解',
      keyPoints: [
        '横纹肌溶解的定义和概述',
        '三大典型症状：肌肉酸痛、浑身无力、尿液变成浓茶色',
        '实验室检查关键指标：肌酸激酶和肌红蛋白',
        '高危人群提醒：健身新手、节食减肥者、服用降脂药人群',
        '总结：适量运动、及时补水、出现异常立刻就医'
      ],
      noNextEpisodePreview: true,
    },
    opening: {
      enabled: true,
      hasTitle: true,
      hasSubtitle: true,
      mainTitle: '横纹肌溶解',
      subTitle: '症状与实验室检查',
      style: 'documentary',
    },
    platform: ['douyin', 'xiaohongshu', 'shipinhao'],
    presentationStyle: {
      type: 'monologue',
      character: 'chen-zhuo',
      style: '生动形象，带有自然肢体语言，边走边介绍，专业好莱坞导演质感',
      tone: '专业但通俗易懂，像朋友一样亲切',
      energyLevel: 'high',
      performanceStyle: 'vlog-style-interactive',
    },
    constraints: {
      onlyFirstEpisodeHasOpening: true,
      noNextEpisodePreview: true,
      focusOnCurrentEpisodeOnly: true,
      singlePresenter: true,
      noNarration: true,
    },
    primaryCharacterId: 'chen-zhuo',
    policeUniform: true,
  }, {
    skipRequirementConfirmation: true,
  });

  console.log('\n=== 预生产完成 ===');
  console.log('项目:', result.projectName);
  console.log('镜头数:', result.stages?.finalPrompt?.shots?.length || 'N/A');
  console.log('总时长:', result.totalDuration || 'N/A');
  console.log('fallbackSummary:', JSON.stringify(result.fallbackSummary, null, 2));
  console.log('输出目录:', path.join(__dirname, 'output', 'health-edu-ep01-v6616'));
})();
