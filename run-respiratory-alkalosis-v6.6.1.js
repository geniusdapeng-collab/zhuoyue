const path = require('path');
const { NirathMasterPipeline } = require('./core/nirath-master-pipeline.js');

async function run() {
  console.log('🚀 启动陈卓健康科普预生产 | 主题: 呼吸性碱中毒 | v6.6.1');

  const input = {
    // v6.6.0: 结构化输入（Stage -1 会验证补全）
    videoType: 'EDU',
    title: '呼吸性碱中毒的预防识别和紧急情况下的处理',
    projectName: 'health-edu-respiratory-alkalosis',
    
    // 角色配置
    characters: {
      'chen-nurse': {
        id: 'chen-nurse',
        name: '陈卓',
        role: 'nurse',
        avatar: '陈卓（护士）',
        description: '35岁南昌护士，穿着警服风格制服，专业严谨又亲和力强'
      }
    },
    
    // 场景配置（呼吸性碱中毒科普）
    scenes: [
      {
        id: 'S01',
        name: '开场引入',
        type: 'establishing',
        duration: 10,
        description: '陈卓穿着警服风格制服，站在医院走廊/科普演播室，面对镜头介绍本期主题',
        characters: ['chen-nurse']
      },
      {
        id: 'S02',
        name: '什么是呼吸性碱中毒',
        type: 'explanation',
        duration: 15,
        description: '讲解呼吸性碱中毒的定义、发生机制、常见症状（手脚麻木、头晕、胸闷、呼吸急促）',
        characters: ['chen-nurse']
      },
      {
        id: 'S03',
        name: '预防识别',
        type: 'explanation',
        duration: 15,
        description: '讲解高危人群、预防方法、早期识别信号（情绪激动、过度呼吸时）',
        characters: ['chen-nurse']
      },
      {
        id: 'S04',
        name: '紧急情况处理',
        type: 'demonstration',
        duration: 15,
        description: '演示急救方法：纸袋呼吸法、情绪安抚、体位调整、何时就医',
        characters: ['chen-nurse']
      },
      {
        id: 'S05',
        name: '总结收尾',
        type: 'closing',
        duration: 5,
        description: '总结核心要点，呼吁关注呼吸健康',
        characters: ['chen-nurse']
      }
    ],
    
    // 制作规格
    targetDuration: 60,
    style: 'REAL',
    creativeIntensity: 0.6,
    
    // v6.6.0 新增字段
    platform: '视频号/抖音',
    narrativeMode: 'dialogue',
    endingStyle: 'summary',
    
    // 世界观/设定
    world: {
      name: '真实医疗科普',
      setting: '超写实纪录片风格'
    },
    
    // 核心内容
    core: {
      theme: '呼吸性碱中毒的预防识别和紧急情况下的处理',
      focus: '健康科普，专业严谨，通俗易懂',
      narrative: {
        focus: '医学知识科普'
      }
    }
  };

  const pipeline = new NirathMasterPipeline({
    mode: 'generic',
    useLLM: true,
    outputDir: path.join(__dirname, '../output/health-edu-respiratory-alkalosis')
  });

  try {
    const result = await pipeline.execute(input);
    
    console.log('\n========================================');
    console.log('✅ 预生产完成！');
    console.log('========================================');
    console.log(`镜头数: ${result.stages?.render?.length || 0}`);
    console.log(`总时长: ${result.stages?.duration?.totalDuration || 'N/A'}秒`);
    console.log(`创意指数: ${result.creativeIntensity || 'N/A'}`);
    console.log(`质量评分: ${result.stages?.promptQualityGate?.score || 'N/A'}`);
    console.log(`合规状态: ${result.stages?.compliance?.passed ? '通过' : '未通过'}`);
    
    if (result.stages?.render) {
      console.log('\n📋 镜头详情:');
      result.stages.render.forEach((shot, idx) => {
        console.log(`\n  [${shot.id || `S${idx+1}`}] ${shot.scene || '未命名'}`);
        console.log(`  时长: ${shot.duration || 'N/A'}秒`);
        console.log(`  Prompt长度: ${(shot.prompt || shot.visualPrompt || '').length}字符`);
        console.log(`  前100字符: ${(shot.prompt || shot.visualPrompt || '').substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ 预生产失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
