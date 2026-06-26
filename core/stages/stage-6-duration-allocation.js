/**
 * STAGE-6: Shot Duration Allocation
 * 镜头时长分配 - ShotDurationAllocatorV2 + DurationCalculator双保险
 * 自动提取自 nirath-master-pipeline.js
 */

const { StageBase } = require('./stage-base');

class StageDurationAllocation extends StageBase {
  constructor(pipeline) {
    super(pipeline);
    this.modules = pipeline.modules || {};
  }

  async execute(script, input = {}) {
    this.log('info', 'STAGE-6: 镜头时长分配(ShotDurationAllocatorV2 + DurationCalculator双保险)');

    const allocations = [];
    const totalDuration = script.narrative?.totalDuration || input.targetDuration || 15;

    // P0修复#3 + P1修复#14-22:集成ShotDurationAllocatorV2
    let v2Allocations = null;
    let optimizationLevel = 'L0';
    try {
      if (typeof this.modules.shotDurationAllocator?.allocate === 'function') {
        const baseDuration = totalDuration;
        const relaxedDuration = Math.round(baseDuration * 1.05);
        const finalDuration = Math.max(baseDuration, Math.min(relaxedDuration, 90));

        if (finalDuration > baseDuration) {
          this.log('info', `📏 时长放宽: ${baseDuration}s → ${finalDuration}s (+${Math.round((finalDuration/baseDuration - 1) * 100)}%)`);
        }

        const safeScenes = Array.isArray(script.scenes) ? script.scenes : [];
        if (safeScenes.length === 0) {
          throw new Error('script.scenes为空数组,无法进行时长分配');
        }

        const v2Narrations = safeScenes.map((s, idx) => {
          const text = (s.dialogue || s.narration || '').toString();
          const type = s.type || s.beatName || 'explanation';
          if (!text || text.length === 0) {
            this.log('warn', `  ⚠️ 场景${s.id || idx} dialogue为空,使用默认文本`);
          }
          
          // 🔥 v6.8.3: 商业广告模式 - 提取卖点信息
          const narration = {
            id: s.id || `S${String(idx + 1).padStart(2, '0')}`,
            text: text || '[无文本]',
            type: type,
            priority: s.importance || 5,
            importance: s.importance || 5,
            visualComplexity: s.visualComplexity || 5,
            characters: s.characters || []
          };
          
          // 如果场景有卖点信息，注入到时长分配器
          if (s._sellingPoint) {
            narration.sellingPointType = s._sellingPoint.type;
            narration.sellingPointPriority = s._sellingPoint.priority;
          }
          
          return narration;
        });

        // 🔥 v6.8.3: 商业广告模式 - 选择节奏曲线
        let rhythmCurve = script.narrative?.pace || 'classic';
        const isCommercial = input.videoType === 'commercial' || input._enrichedSellingPoints;
        if (isCommercial && rhythmCurve === 'classic') {
          // 商业广告默认使用肾上腺素式节奏
          rhythmCurve = 'commercial_adrenaline';
          this.log('info', `🎬 商业广告模式: 使用肾上腺素式节奏曲线`);
        }

        // 🔥 v6.8.3: 与时长约束系统联动
        let finalDuration = baseDuration;
        if (this.modules.durationConstraint && isCommercial) {
          // 使用时长约束系统生成合规的总时长
          const durationPlan = this.modules.durationConstraint.generateDurationPlan(
            v2Narrations.length,
            input._enrichedSellingPoints || []
          );
          finalDuration = durationPlan.totalDuration;
          this.log('info', `⏱️ 时长约束系统: 总时长${finalDuration}秒`);
        } else {
          const relaxedDuration = Math.round(baseDuration * 1.05);
          finalDuration = Math.max(baseDuration, Math.min(relaxedDuration, 90));
        }

        if (finalDuration > baseDuration) {
          this.log('info', `📏 时长放宽: ${baseDuration}s → ${finalDuration}s (+${Math.round((finalDuration/baseDuration - 1) * 100)}%)`);
        }

        const v2Input = {
          totalDuration: finalDuration,
          rhythmCurve: rhythmCurve,
          narrations: v2Narrations
        };

        this.log('info', `📤 ShotDurationAllocatorV2输入: ${v2Narrations.length}句dialogue | 总预算${finalDuration}s`);
        v2Allocations = this.modules.shotDurationAllocator.allocate(v2Input);
        optimizationLevel = v2Allocations?.optimizationLevel || 'L0';

        if (!v2Allocations || !Array.isArray(v2Allocations.shots)) {
          throw new Error('ShotDurationAllocatorV2返回结果无效: shots数组缺失');
        }

        this.log('info', `✅ ShotDurationAllocatorV2已调用 | 优化级别: ${optimizationLevel} | 返回${v2Allocations.shots.length}镜`);
      }
    } catch (e) {
      this.log('warn', `⚠️ ShotDurationAllocatorV2调用失败: ${e.message}`);
    }

    // L2/L3降级处理
    if (optimizationLevel === 'L2' || optimizationLevel === 'L3') {
      this.log('warn', `⚠️ 时长分配触发降级: ${optimizationLevel} | 内容超载,建议精简narration或增加预算`);
    }

    // 逐场景分配时长
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const narration = scene.narration || '';
      const charCount = narration.length;

      let duration;
      const prdDuration = scene.duration;

      if (v2Allocations?.shots?.[i]) {
        const v2Duration = v2Allocations.shots[i].duration;
        if (prdDuration && prdDuration >= 3 && prdDuration <= 30) {
          const ratio = v2Duration / prdDuration;
          if (ratio >= 0.9 && ratio <= 1.1) {
            duration = prdDuration;
          } else if (v2Duration > prdDuration && v2Duration <= 15) {
            duration = v2Duration;
          } else if (v2Duration > 15) {
            duration = 15;
            this.log('warn', `  ⚠️ V2超限(15s硬约束): ${scene.id} | 强制15s`);
          } else {
            duration = prdDuration;
          }
        } else {
          duration = v2Duration;
        }
      } else {
        // Fallback: DurationCalculator
        try {
          duration = this.modules.durationCalculator?.calculate({
            text: narration,
            type: scene.type || 'default'
          }) || Math.ceil(charCount / 4.5 + 0.5);
        } catch (e) {
          duration = Math.min(Math.max(Math.ceil(charCount / 4.5 + 0.5), 3), 12);
        }
      }

      // 节奏增强
      if (scene.shotType === 'climax') {
        duration += Math.round(duration * 0.25);
      } else if (scene.shotType === 'setup' || scene.shotType === 'transition') {
        duration = Math.max(duration - Math.round(duration * 0.15), 5);
      }

      const clampedDuration = Math.min(Math.max(duration, 3), prdDuration && prdDuration >= 3 ? Math.min(prdDuration, 15) : 15);
      const capacity = Math.floor(clampedDuration * 5.0);
      const isOverCapacity = charCount > capacity;
      const emotionPhase = scene.emotionPhase || 'neutral';

      // 🔥 v6.8.3: 注入时长回场景，供Stage-11使用
      scene.duration = clampedDuration;
      scene._durationAllocated = true;
      
      allocations.push({
        sceneId: scene.id,
        narration,
        charCount,
        duration: clampedDuration,
        type: scene.type,
        importance: scene.importance || 5,
        visualComplexity: scene.visualComplexity || 5,
        emotionPhase,
        v2Allocated: !!v2Allocations,
        optimizationLevel,
        isOverCapacity,
        capacity,
        // 🔥 v6.8.3: 商业广告信息
        sellingPointType: scene._sellingPoint?.type,
        adPhase: scene._adPhase
      });

      if (isOverCapacity) {
        this.log('warn', `  ⚠️ narration超长: ${scene.id} | ${charCount}字 > ${capacity}字容量`);
      }
    }

    // 🔥 v6.8.3: 与时长约束系统联动验证
    if (this.modules.durationConstraint && input._enrichedSellingPoints) {
      const shotDurations = allocations.map(a => a.duration);
      const validation = this.modules.durationConstraint.validatePlan({
        totalDuration: allocations.reduce((sum, a) => sum + a.duration, 0),
        shotCount: allocations.length,
        shotDurations
      });
      
      if (!validation.valid) {
        this.log('warn', `⚠️ 时长约束验证失败: ${validation.issues.join(', ')}`);
      } else {
        this.log('info', `✅ 时长约束验证通过: ${validation.totalDuration}秒`);
      }
    }

    this.log('info', `✅ 时长分配 | 镜头数: ${allocations.length} | V2分配: ${allocations.filter(a => a.v2Allocated).length}/${allocations.length} | 超长: ${allocations.filter(a => a.isOverCapacity).length}/${allocations.length}`);
    
    // 🔥 v6.8.3: 商业广告模式额外日志
    if (input._enrichedSellingPoints) {
      const phaseBreakdown = {};
      allocations.forEach(a => {
        const phase = a.adPhase || 'unknown';
        phaseBreakdown[phase] = (phaseBreakdown[phase] || 0) + a.duration;
      });
      this.log('info', `📊 广告阶段时长分布: ${Object.entries(phaseBreakdown).map(([k,v]) => `${k}:${v}s`).join(' | ')}`);
    }
    
    return allocations;
  }
}

module.exports = { StageDurationAllocation };
