const { NirathMasterPipeline } = require('./core/nirath-master-pipeline.js');

async function test() {
  console.log('🧪 卓越系统 v6.37 测试验证\n');

  // 创建 mock stages 数据
  const mockStages = {
    prd: { title: '测试短片', style: { description: 'cinematic' } },
    script: { title: '测试脚本' },
    storyboard: { shots: [], totalDuration: 60 },
    duration: { totalDuration: 60 },
    opening: { duration: 10 },
    style: [
      {
        shotId: 'S00',
        duration: 10,
        prompt: '测试片头prompt',
        length: 1200,
        mouthAction: '嘴部自然闭合',
        utilization: 80,
        utilizationStatus: '✅达标',
        qualityScore: { totalScore: 90 },
        // v6.37 字段
        scene: 'Nirath异世界入口，双恒星照耀，岩石地表覆盖发光植物',
        mood: 'mysterious, anticipation, wonder',
        camera: { shotSize: 'extreme wide', movement: 'dolly in', lens: '24mm', speed: 0.3 },
        cameraString: 'extreme wide shot, dolly in, 24mm lens, speed 0.3',
        lighting: { keyLight: { direction: 'backlight', colorTemp: 3200, effect: 'golden hour rim' }, fillLight: { direction: 'ambient', colorTemp: 6500, effect: 'cool fill' }, special: 'volumetric god rays' },
        lightingString: 'backlight 3200K, golden hour rim, ambient fill',
        characterRef: 'NONE',
        character: 'NONE',
        action: '镜头推进，揭示Nirath异世界全景',
        dialogue: 'NONE',
        timeline: { start: 'T00:00', end: 'T00:10', duration: 10, type: 'opening', mood: 'mysterious' },
        timelineString: 'T00:00-T00:10 / duration: 10s / type: opening / mood: mysterious',
        backgroundSound: { ambient: '异世界环境音，风声，远处生物低鸣', spatial: 'ambient stereo field', intensity: { steady: '0-100%', variations: 'subtle' } },
        backgroundSoundString: 'AMBIENT: 异世界环境音，风声，远处生物低鸣 | SPATIAL: ambient stereo field | INTENSITY: steady 0-100%, variations subtle',
        audioLayer: { segments: [{ time: '0-3s', sound: 'sub-bass earth rumble' }, { time: '3-5s', sound: 'distant wind' }, { time: '5-8s', sound: 'string section' }, { time: '8-10s', sound: 'timpani strike' }] },
        audioLayerString: 'sub-bass earth rumble at 0-3s, distant wind at 3-5s, string section at 5-8s, timpani strike at 8-10s',
        titleOverlay: { mainTitle: '测试短片', subtitle: 'Nirath', producer: 'by Genius', titleAnim: 'light-vein carving growth 3.0-5.0s' },
        titleOverlayString: 'MAIN_TITLE: "测试短片" | SUBTITLE: "Nirath" | PRODUCER: "by Genius" | TITLE_ANIM: light-vein carving growth 3.0-5.0s',
        promptCharCount: 1200,
        physicsLayer: { gravity: 0.82, magneticField: 3.2, dualStarTemp: [5800, 6500] },
        colorScience: 'nirath_golden_hour',
        negativePrompt: 'no text, no watermark, no anime, no cartoon',
        renderStyle: 'hyperrealistic, film grain, 35mm texture',
        directorStyle: 'Nirath signature style, epic scale',
        priorities: { characterRef: 'P0-never', dialogue: 'P0-keep_core', camera: 'P1-keep_core_movement' }
      },
      {
        shotId: 'S01',
        duration: 15,
        prompt: '测试正片prompt',
        length: 1350,
        mouthAction: '嘴部微张，准备发声',
        utilization: 90,
        utilizationStatus: '🔥理想',
        qualityScore: { totalScore: 85 },
        // v6.37 字段
        scene: 'Nirath森林深处，双恒星透过树冠，地面发光苔藓',
        mood: 'tension, curiosity, awe',
        camera: { shotSize: 'medium', movement: 'orbit', lens: '35mm', speed: 0.5 },
        cameraString: 'medium shot, orbit, 35mm lens, speed 0.5',
        lighting: { keyLight: { direction: 'side', colorTemp: 4500, effect: 'dramatic contrast' }, fillLight: { direction: 'ambient', colorTemp: 5500, effect: 'soft fill' }, special: 'volumetric light shafts' },
        lightingString: 'side 4500K, dramatic contrast, ambient fill',
        characterRef: 'xiaoG: image://characters/xiaoG-front.png',
        character: '小G: 人类, 银灰装甲, 东亚面孔短发, 年轻男性',
        action: '小G缓缓转身，发现异兽踪迹',
        dialogue: '小G|对白|惊讶|这是...什么生物？|LIP_SYNC:YES',
        timeline: { start: 'T00:10', end: 'T00:25', duration: 15, type: 'establishing', mood: 'tension' },
        timelineString: 'T00:10-T00:25 / duration: 15s / type: establishing / mood: tension',
        backgroundSound: { ambient: '森林环境音，树叶沙沙，远处水声', spatial: 'stereo field with depth', intensity: { steady: '20-80%', variations: 'moderate' } },
        backgroundSoundString: 'AMBIENT: 森林环境音，树叶沙沙，远处水声 | SPATIAL: stereo field with depth | INTENSITY: steady 20-80%, variations moderate',
        audioLayer: null,
        audioLayerString: null,
        titleOverlay: null,
        titleOverlayString: null,
        promptCharCount: 1350,
        physicsLayer: { gravity: 0.82, magneticField: 3.2, dualStarTemp: [5800, 6500] },
        colorScience: 'nirath_golden_hour',
        negativePrompt: 'no text, no watermark, no anime, no cartoon',
        renderStyle: 'hyperrealistic, film grain, 35mm texture',
        directorStyle: 'Nirath signature style, epic scale',
        priorities: { characterRef: 'P0-never', dialogue: 'P0-keep_core', camera: 'P1-keep_core_movement' }
      }
    ]
  };

  // 创建 Pipeline 实例
  const pipeline = new NirathMasterPipeline({ mode: 'nirath' });

  // Mock PipelineIntegrityValidator
  const mockIntegrityResult = {
    valid: true,
    summary: { errorCount: 0, warningCount: 0, totalChecks: 10 },
    checks: []
  };
  
  // 调用 stageFinalOutput
  const output = await pipeline.stageFinalOutput(mockStages);

  console.log('✅ 测试输出格式验证');
  console.log('  meta 存在:', !!output.meta);
  console.log('  shots 存在:', !!output.shots);
  console.log('  shots 数量:', output.shots?.length);
  console.log('  _legacy 存在:', !!output._legacy);

  if (output.meta) {
    console.log('\n📋 Meta 字段验证');
    console.log('  title:', output.meta.title);
    console.log('  worldview:', output.meta.worldview);
    console.log('  totalDuration:', output.meta.totalDuration);
    console.log('  openingDuration:', output.meta.openingDuration);
    console.log('  fps:', output.meta.fps);
    console.log('  resolution:', output.meta.resolution);
    console.log('  styleNotes:', output.meta.styleNotes);
  }

  if (output.shots && output.shots.length > 0) {
    const s00 = output.shots.find(s => s.shotId === 'S00');
    const s01 = output.shots.find(s => s.shotId === 'S01');

    if (s00) {
      console.log('\n🎬 S00 片头字段验证（应为18字段）');
      const s00Fields = Object.keys(s00).filter(k => !k.startsWith('_') && k !== 'utilization' && k !== 'utilizationStatus' && k !== 'qualityScore' && k !== 'referenceImages' && k !== 'length' && k !== 'mouthAction' && k !== 'enhanced');
      console.log('  字段数量:', s00Fields.length);
      console.log('  字段列表:', s00Fields.join(', '));
      console.log('  scene:', s00.scene?.substring(0, 30), '...');
      console.log('  cameraString:', s00.cameraString);
      console.log('  audioLayer:', !!s00.audioLayer);
      console.log('  titleOverlay:', !!s00.titleOverlay);
    }

    if (s01) {
      console.log('\n🎬 S01 正片字段验证（应为17字段）');
      const s01Fields = Object.keys(s01).filter(k => !k.startsWith('_') && k !== 'utilization' && k !== 'utilizationStatus' && k !== 'qualityScore' && k !== 'referenceImages' && k !== 'length' && k !== 'mouthAction' && k !== 'enhanced');
      console.log('  字段数量:', s01Fields.length);
      console.log('  字段列表:', s01Fields.join(', '));
      console.log('  character:', s01.character);
      console.log('  dialogue:', s01.dialogue);
      console.log('  audioLayer:', s01.audioLayer); // 应该为 null
      console.log('  titleOverlay:', s01.titleOverlay); // 应该为 null
    }
  }

  console.log('\n✅ 测试完成！');
}

test().catch(e => {
  console.error('❌ 测试失败:', e.message);
  console.error(e.stack);
  process.exit(1);
});
