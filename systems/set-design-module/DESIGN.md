# Nirath 美术布景设计模块 v1.0 架构设计

## 模块定位

**名称**: Set Design Module（美术布景设计模块）  
**版本**: v1.0  
**性质**: 主链路增强模块，非侵入式插入  
**使命**: 为每个镜头设计电影级背景环境，替代AI的"模板化空泛描述"

---

## 插入位置

```
Stage 9: 运镜设计 → Stage 10: 故事板构建 → 【Stage 10.5: 美术布景设计】 → Stage 11: 渲染核心
```

在 `nirath-master-pipeline.js` 的 `STAGE-10` 之后、`STAGE-11`（渲染核心 `buildPromptV3`）之前插入。

**集成点代码**:
```javascript
// Stage 10.5: 美术布景设计（v6.2-patch46新增）
const setDesignResult = await this.modules.setDesignModule.design(shot, {
  nirathAnchor: getNirathAnchor(),
  promptBudget: 980 - (shot.visualPrompt?.length || 0) - 200 // 预留200字符给角色+运镜
});
shot.environmentPrompt = setDesignResult.environmentPrompt;
shot.visualPrompt = setDesignResult.mergedVisualPrompt; // 融合后的visualPrompt
```

---

## 核心Agent架构（5Agent流水线）

### Agent 1: Scene Decoder（场景解码器）
**职责**: 将镜头上下文映射到Nirath布景模板
**输入**: `shot.scene`, `shot.habitat`, `shot.type`, `featuredBeastId`
**输出**: `{ scenicTemplate, templateParams }`
**逻辑**:
1. 根据 `shot.scene` 或异兽栖息地匹配 `scenic-templates.js` 中的模板
2. 注入Nirath环境锚定词（双恒星、磁场、低重力、生态）
3. 根据镜头类型调整模板参数（opening=全景震撼, closeup=局部纹理, action=动态破坏感）

### Agent 2: Stage Art Director（舞台美术师）
**职责**: 设计镜头画面的空间层次与构图
**输入**: `scenicTemplate`, `shot.cameraMovement`, `shot.shotSize`
**输出**: `{ depthLayers: {foreground, midground, background, sky}, compositionNotes }`
**逻辑**:
- 根据景别（extreme_wide/wide/medium/closeup）决定每层的内容密度
- extreme_wide: 远景山脉+中景植被+前景角色+天空双恒星
- closeup: 背景虚化为色彩氛围+中景局部纹理+前景主体
- 确保构图引导视线流向主体

### Agent 3: Texture & Material Engineer（质感工程师）
**职责**: 为每层的关键元素赋予超写实材质描述
**输入**: `depthLayers`, `scenicTemplate.materialPalette`
**输出**: `{ materialSpecs: Map<layerName, materialDescription> }`
**逻辑**:
- 从 `material-library.js` 调用材质描述
- 根据光照条件（Aurelius暖金/Silvana清冷/磁场光晕）调整材质反光属性
- 禁止塑料感/CG感，强调风化侵蚀、层理构造、矿物结晶

### Agent 4: Ecological Set Dresser（生态布景师）
**职责**: 注入"生机勃勃"的生命细节
**输入**: `depthLayers`, `scenicTemplate.ecologyRules`
**输出**: `{ ecologyDetails: Array<string> }`
**逻辑**:
- 在岩石间、水面、空气中添加奇异生物活动痕迹
- 孢子群漂浮、微小六足生物、磁丝藤蔓发光脉动
- 确保"禁止光秃秃"——每个层面都有有机生命覆盖

### Agent 5: Prompt Synthesizer & Compressor（提示词融合器）
**职责**: 将丰富设计压缩为200-220字符的高密度环境提示词，并与现有visualPrompt智能融合
**输入**: 前4个Agent的完整输出, `shot.visualPrompt`, `promptBudget`
**输出**: `{ environmentPrompt: string, mergedVisualPrompt: string, compressionLevel: number }`
**逻辑**:
1. **压缩策略**: 从200字完整版 → 150字标准版 → 80字极简版（三级 fallback）
2. **融合策略**:
   - 若 `visualPrompt` 含通用背景词（"背景是..."/"周围是..."/"场景是..."）→ **替换**为布景设计
   - 若 `visualPrompt` 无背景描述 → **在主体描述后追加** `【场景设定】...`
   - 若总字符超限 → 优先保留主体+角色，裁剪环境提示词的形容词层级

---

## Scenic Templates（Nirath布景模板库）

基于Nirath 10大圣经场景，细化为电影级布景：

| 圣经场景 | 布景模板 | 核心质感 | 生态特征 |
|----------|----------|----------|----------|
| 不周山脉 | `volcanic_ridge` | 风化玄武岩+磁铁矿脉+热液蚀变 | 耐高温孢子蕨、岩浆通道发光 |
| 青丘灵原 | `spore_forest` | 纤维素-木质素复合茎干+半透明表皮 | 漂浮孢子云、荧光苔藓地毯 |
| 归墟之海 | `abyssal_luminara` | 高压水晶质沉积+金属盐水 | 深海生物荧光群、压力气泡 |
| 幽冥地下海 | `magnetic_bog` | 磁化淤泥+液态汞珠+铁矿结核 | 厌氧发光菌群、磁悬浮水滴 |
| 汤谷扶桑 | `eternal_dawn` | 焦木硅化纹理+永恒晨雾 | 耐热藤蔓、光敏孢子爆发 |
| 昆仑悬境 | `floating_archipelago` | 反重力岩石+气生根系+瀑布逆流 | 空游生物群、悬浮植物岛 |
| 涿鹿战场 | `ancient_ruins` | 化石化巨型结构+共生侵蚀纹理 | 侵略性共生植物、尘埃漩涡 |
| 蓬莱迷雾 | `misty_archipelago` | 磁场雾滴+海市蜃楼折射层 | 雾中发光水母状生物 |
| 星门祭坛 | `energy_nexus` | 几何精准远古构造+能量灼烧痕迹 | 能量寄生植物、离子风 |
| 盘古之脊 | `primordial_spine` | 层理超清晰沉积岩+矿物结晶带 | 原始单细胞发光毯、地质活跃区 |

---

## Material Library（材质库核心条目）

```javascript
const MATERIAL_LIBRARY = {
  rock: {
    base: '风化玄武岩表面，层理构造清晰',
    detail: '磁铁矿脉呈淡蓝紫色可见纹路，矿物结晶点缀',
    light_reaction: 'Aurelius暖金光下呈玫瑰金反光，Silvana清冷光下呈银灰高光',
    banned: '禁止塑料质感、禁止CG平滑、禁止均匀着色'
  },
  vegetation: {
    base: '纤维素-木质素复合茎干，抗拉强度超越碳纤维',
    detail: '半透明表皮下可见叶绿磁脉，孢子囊呈几何排列',
    light_reaction: '双恒星光照下产生虹彩干涉，磁场脉冲触发荧光释放',
    banned: '禁止地球标准绿叶、禁止均匀绿色、禁止卡通植物'
  },
  water: {
    base: '高密度金属盐液，低表面张力',
    detail: '0.82G低重力下形成缓慢悬浮球体，折射双星光呈分色光谱',
    light_reaction: '磁场作用下液面产生规则波纹图案',
    banned: '禁止地球标准蓝色水面、禁止无来源反光'
  },
  atmosphere: {
    base: '1200/cm³以太孢子缓慢漂浮',
    detail: '大气折射率1.00045产生微弱光晕，孢子群随磁场线漂移',
    light_reaction: 'Aurelius光束穿透时形成丁达尔效应，呈金色通路',
    banned: '禁止均匀雾、禁止无介质发光'
  }
};
```

---

## 输出示例

### 输入
- shot: S02「钩子」节拍
- scene: 钩吾废墟入口
- shotSize: extreme_wide
- type: opening
- characters: [xiaoG, taotie]

### Agent流水线输出
1. **Scene Decoder**: `scenicTemplate = ancient_ruins`, `templateParams = { scale: massive, era: prehistoric_war, energy_state: dormant }`
2. **Stage Art Director**:
   - foreground: 风化基岩断层，磁丝藤蔓垂挂
   - midground: 钩吾废墟巨型几何门柱，共生植物侵蚀
   - background: 双恒星低垂地平线，远处山脉剪影
   - sky: 磁场极光呈淡蓝紫双螺旋
3. **Texture Engineer**: 岩石=风化玄武岩+磁铁矿脉；废墟表面=化石化几何构造+能量灼烧硅化纹理
4. **Ecological Dresser**: 微小六足生物在磁性尘埃中觅食，孢子释放事件触发金银闪光云团
5. **Prompt Synthesizer**:
   - 完整版(220字): `钩吾废墟巨型几何门柱风化表面，磁铁矿脉呈淡蓝紫色可见纹路，共生侵蚀纹理清晰。0.82G低重力下以太孢子缓慢漂浮，微小六足生物群在磁性尘埃中觅食。远处双恒星Aurelius金色5800K低垂地平线，磁场极光呈双螺旋淡蓝紫。超写实地质纹理，层理构造，矿物结晶点缀，禁止塑料/CG质感。`
   - 融合后: 替换visualPrompt中"背景是废墟"为完整版

---

## 与主链路集成方式

**Step 1**: `nirath-master-pipeline.js` 在 Stage 10.5 调用
**Step 2**: 输出 `shot.environmentPrompt` 注入 `buildPromptV3` 的 `script` 参数
**Step 3**: `buildPromptV3` 将环境描述作为 `visualAnchor` 的一部分前置
**Step 4**: 最终Prompt字数校验在 `smartTrim` 中优先保留环境描述（因其为队长新增核心需求）

---

## 预算控制

| 场景 | 环境Prompt预算 | 保留策略 |
|------|---------------|----------|
| 理想情况 | 220字符 | 完整5Agent输出 |
| 标准压缩 | 150字符 | 压缩生态细节+合并材质词 |
| 极限压缩 | 80字符 | 仅保留核心材质锚定词 |

**优先级**: 主体角色 > 布景环境 > 运镜 > 口播动作 > 其他

---

## 待队长确认事项

1. **模板覆盖范围**: 10大圣经场景模板是否足够？是否需要新增"室内/洞穴/空中"等特殊模板？
2. **输出长度偏好**: 环境描述你希望多长？建议220字符（约110汉字），是否接受更短？
3. **生态密度**: 每镜头背景中你希望看到多少种生物活动痕迹？1-2种还是3-5种？
4. **材质词风格**: 目前的材质描述偏地质写实（层理构造、矿物结晶），是否需要增加"奇幻感"词汇？

设计完成，等待队长拍板后立即实现全部Agent代码！🔥
