#!/usr/bin/env node
'use strict';

const path = require('path');
const { NirathMasterPipeline } = require('./systems/nirath-master-pipeline.js');
const { StatusReporter } = require('./systems/status-reporter.js');
const { createLogger } = require('./systems/logger');

const logger = createLogger('runner');

async function main() {
  const reporter = new StatusReporter({ projectName: '横纹肌溶解科普-第一集' });
  reporter.init();

  const input = {
    projectName: '横纹肌溶解科普-第一集',
    videoType: 'health-education',
    title: '横纹肌溶解的症状以及实验室检查',
    seriesTitle: '全民健康科普',
    episode: 1,
    totalEpisodes: 3,
    protagonistName: '陈卓',
    protagonistDescription: '穿警服的女性健康科普讲解员，专业可信，亲切温和',
    targetDuration: 62,
    duration: { target: 62, min: 59, max: 65 },
    style: 'full-realism',
    styleNotes: '全写实风格，好莱坞导演质感，人物和背景环境要求超写实',
    platform: 'video-platform',
    aspectRatio: '16:9',
    creativeIntensity: 0.9,
    mode: 'generic',
    presenterOnly: true,
    openingRequired: true,
    mainTitle: '横纹肌溶解的症状以及实验室检查',
    subTitle: '全民健康科普',
    contentScope: '第一集：横纹肌溶解的症状 + 实验室检查',
    noNextEpisodePreview: true,
    description: '穿警服的陈卓女士，讲解居民健康护理知识，进行全民健康科普。这是第一集【什么是横纹肌溶解——横纹肌溶解的症状以及实验室检查】。',
    characters: [{
      id: 'chen-zhuo',
      name: '陈卓',
      role: 'presenter',
      description: '穿警服的女性健康科普讲解员，专业可信，亲切温和',
      gender: 'female',
      age: '35-40',
      outfit: '警服',
      isRealPerson: true
    }],
    isSeries: true,
    _rawInput: '穿警服的陈卓女士，讲解居民健康护理知识，进行全民健康科普，现在是第一集【什么是横纹肌溶解——横纹肌溶解的症状以及实验室检查】。'
  };

  const outputDir = path.join(process.cwd(), 'output');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 清理旧输出
  const { cleanOutputFiles } = require('./systems/output-cleaner');
  cleanOutputFiles(outputDir, { keyword: 'chenzhuo-health-ep01' });

  const pipeline = new NirathMasterPipeline({
    mode: 'generic',
    useLLM: true,
    skipDirectorReview: false,
    skipScreenwriterOptimization: false,
    projectConfig: {
      requiredCharacters: ['chen-zhuo'],
      isPreProduction: true,
      ownerApproved: true,
      genericMode: true
    },
    statusReporter: reporter
  });

  reporter.message('🚀 启动全链路预生产 | v6.6.9.4-patch21 | 已确认需求', true);

  try {
    const result = await pipeline.execute(input, {
      skipRequirementConfirmation: true
    });

    // 写入报告
    const { writeJsonReport, writeMarkdownReport } = require('./systems/report-writer');
    const jsonPath = writeJsonReport(outputDir, 'chenzhuo-health-ep01-preproduction', result);
    const mdPath = writeMarkdownReport(outputDir, 'chenzhuo-health-ep01-report', '# 横纹肌溶解科普-第一集 预生产报告\n\nTODO');

    console.log('\n========================================');
    console.log('✅ 预生产完成!');
    console.log('📄 JSON:', jsonPath);
    console.log('📄 MD:', mdPath);
    console.log('========================================\n');

    // 温和退出
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    reporter.fail('预生产失败', error);
    console.error('❌ 预生产失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ 运行失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});
