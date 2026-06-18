#!/usr/bin/env node
'use strict';

const path = require('path');
const { runPreproduction } = require('./systems/preproduction-service');
const { createLogger } = require('./systems/logger');

const logger = createLogger('runner');

async function main() {
  const input = {
    projectName: '横纹肌溶解科普-第一集',
    task: 'health-education-video-preproduction',
    videoInfo: {
      type: 'health-education',
      title: '什么是横纹肌溶解——横纹肌溶解的症状以及实验室检查',
      seriesTitle: '全民健康科普',
      episode: 1,
      protagonistName: '陈卓',
      protagonistDescription: '穿警服的女性健康科普讲解员，专业可信，亲切温和',
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
      noNextEpisodePreview: true
    },
    requirements: {
      professionalTone: true,
      accessibleLanguage: true,
      naturalBodyLanguage: true,
      highProductionValue: true,
      openingWithTitle: true,
      noEpisodePreview: true
    }
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const result = await runPreproduction(input, {
    outputDir: path.join(process.cwd(), 'output'),
    outputKeyword: 'chenzhuo-health-ep01',
    resultPrefix: 'chenzhuo-health-ep01-preproduction',
    reportPrefix: 'chenzhuo-health-ep01-report',
    mode: 'generic',
    projectConfig: {
      requiredCharacters: ['chen-zhuo'],
      isPreProduction: true,
      ownerApproved: true,
      genericMode: true
    }
  });

  logger.info('预生产完成', {
    jsonPath: result.jsonPath,
    mdPath: result.mdPath
  });

  console.log('\n========================================');
  console.log('✅ 预生产完成!');
  console.log('📄 JSON:', result.jsonPath);
  console.log('📄 MD:', result.mdPath);
  console.log('========================================\n');
}

main().catch(err => {
  console.error('❌ 预生产失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});
