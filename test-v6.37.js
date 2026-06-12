const { NirathMasterPipeline } = require('./core/nirath-master-pipeline.js');

async function test() {
  console.log('🧪 卓越系统 v6.37 测试验证');
  console.log('');
  
  const pipeline = new NirathMasterPipeline({ mode: 'nirath', quiet: true });
  
  // 模拟一个简单的 test data
  const stages = {
    prd: { title: '测试短片', style: { description: 'cinematic' } },
    script: { title: '测试', scenes: [{ id: 'S01', narration: '测试场景', dialogue: '', characters: ['xiaoG'] }] },
    characters: { xiaoG: { baseIdentity: { name: '小G', species: 'Nirathian' }, profile: { name: '小G' }, portraits: { frontal: 'test.jpg' } } },
    storyboard: { shots: [{ id: 'S01', scene: '森林', narration: '测试', type: 'establishing', emotionPhase: 'mysterious', duration: 10, visualPrompt: '森林场景', characters: ['xiaoG'], mouthAction: '嘴部自然闭合' }] },
    duration: { totalDuration: 60 },
    camera: [{ shotId: 'S01', movement: 'static', description: '静态镜头' }],
    style: [{
      shotId: 'S01', prompt: '测试Prompt', duration: 10, scene: '森林', mood: 'mysterious',
      camera: { shotSize: 'wide', movement: 'static', lens: '35mm', speed: 1 }, cameraString: 'wide shot, static, 35mm lens',
      lighting: { keyLight: { direction: 'front', colorTemp: 4500, effect: 'neutral' }, fillLight: { direction: 'ambient', colorTemp: 4500, effect: 'soft fill' }, special: '' }, lightingString: 'front 4500K, neutral',
      characterRef: '小G: image://test.jpg', character: '小G: Nirathian, 战士, 勇敢', action: '探索森林', dialogue: 'NONE',
      timeline: { start: 'T00:00', end: 'T00:10', duration: 10, type: 'establishing', mood: 'neutral' }, timelineString: 'T00:00-T00:10 / duration: 10s',
      backgroundSound: { ambient: '森林环境音', spatial: 'ambient stereo', intensity: { crescendo: { start: 0, end: 3 }, peak: { start: 3, end: 7 }, decay: { start: 7, end: 10 } } }, backgroundSoundString: 'AMBIENT: 森林环境音 | SPATIAL: ambient stereo | INTENSITY: crescendo 0-3s, peak 3-7s, decay 7-10s',
      audioLayer: null, audioLayerString: null, titleOverlay: null, titleOverlayString: null,
      promptCharCount: 100, mouthAction: '嘴部自然闭合', physicsLayer: '', colorScience: '', negativePrompt: 'no text', renderStyle: 'hyperrealistic', directorStyle: 'cinematic',
      priorities: { characterRef: 'P0-never' }, qualityScore: {}, referenceImages: [], utilization: 80, utilizationStatus: 'optimal'
    }],
    postProduction: { titleCheck: { valid: true } },
    alignment: { passed: true },
    schema: { passed: true },
    storyboardValidation: { passed: true },
    compliance: { passed: true },
    preRender: { passed: true }
  };
  
  try {
    const output = await pipeline.stageFinalOutput(stages);
    
    console.log('✅ 阶段4测试：STAGE-16 最终输出');
    console.log('');
    console.log('=== meta 结构 ===');
    console.log(JSON.stringify(output.meta, null, 2));
    console.log('');
    console.log('=== shots[0] 结构 ===');
    console.log(JSON.stringify(output.shots[0], null, 2));
    console.log('');
    
    // 检查关键字段
    const shot = output.shots[0];
    const checks = [
      ['shotId', shot.shotId === 'S01'],
      ['meta.title', output.meta.title === '测试短片'],
      ['meta.worldview', output.meta.worldview === 'nirath'],
      ['scene', typeof shot.scene === 'string'],
      ['mood', typeof shot.mood === 'string'],
      ['camera (object)', typeof shot.camera === 'object'],
      ['cameraString', typeof shot.cameraString === 'string'],
      ['lighting (object)', typeof shot.lighting === 'object'],
      ['lightingString', typeof shot.lightingString === 'string'],
      ['characterRef', shot.characterRef.includes('image://')],
      ['character', typeof shot.character === 'string'],
      ['action', typeof shot.action === 'string'],
      ['dialogue', shot.dialogue === 'NONE' || shot.dialogue.includes('|')],
      ['timeline (object)', typeof shot.timeline === 'object'],
      ['timelineString', typeof shot.timelineString === 'string'],
      ['backgroundSound (object)', typeof shot.backgroundSound === 'object'],
      ['backgroundSoundString', typeof shot.backgroundSoundString === 'string'],
      ['backgroundSound.intensity', shot.backgroundSound?.intensity?.crescendo !== undefined],
      ['prompt', typeof shot.prompt === 'string'],
      ['promptCharCount', typeof shot.promptCharCount === 'number'],
      ['priorities (object)', typeof shot.priorities === 'object'],
      ['_legacy', output._legacy !== undefined],
      ['_legacy.prd', output._legacy.prd !== undefined]
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const [name, result] of checks) {
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    }
    
    console.log('');
    console.log(`测试结果: ${passed}/${checks.length} 通过, ${failed} 失败`);
    
    if (failed === 0) {
      console.log('🎉 全部测试通过！v6.37 格式验证成功！');
    }
    
  } catch (e) {
    console.error('❌ 测试失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

test();