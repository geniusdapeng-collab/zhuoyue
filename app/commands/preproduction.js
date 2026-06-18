'use strict';

const path = require('path');
const { runPreproduction } = require('../../systems/preproduction-service');
const { createLogger } = require('../../systems/logger');

const logger = createLogger('command-preproduction');

async function run(args = {}) {
  const inputPath = args.inputPath || path.join(process.cwd(), 'stories', 'taotie-ep01-input.json');
  const input = require(inputPath);

  const result = await runPreproduction(input, {
    outputDir: path.join(process.cwd(), 'output'),
    outputKeyword: 'taotie-ep01-preproduction',
    resultPrefix: 'taotie-ep01-preproduction',
    reportPrefix: 'taotie-ep01-preproduction-report',
    mode: 'nirath',
    projectConfig: {
      requiredCharacters: ['xiaoG', 'tao-tie'],
      isPreProduction: true,
      ownerApproved: true
    }
  });

  logger.info('命令执行完成', {
    jsonPath: result.jsonPath,
    mdPath: result.mdPath
  });

  // v6.6.9.4-patch21: 温和退出，给异步操作完成时间(外部专家方案 - 子进程活性收口器)
  setTimeout(() => process.exit(0), 2000);

  return result;
}

module.exports = { run };
