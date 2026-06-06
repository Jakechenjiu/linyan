// 题材深度 prompt — 针对不同网文类型的专业写作指导

interface GenrePromptConfig {
  genre: string;
  label: string;
  writingRules: string[];
  forbiddenPatterns: string[];
  pacingGuidance: string;
  dialogueGuidance: string;
  worldBuildingNotes: string;
}

const GENRE_PROMPTS: Record<string, GenrePromptConfig> = {
  xuanhuan: {
    genre: "xuanhuan",
    label: "玄幻",
    writingRules: [
      "战力体系必须前后一致，低阶角色不能突然秒杀高阶",
      "修炼突破需要铺垫（机缘、苦修、顿悟），不能凭空升级",
      "宝物、丹药、功法要有具体效果描述，不能只说'威力巨大'",
      "势力格局要有利益纠葛，不能只是简单的正邪对立",
      "主角的金手指要有代价或限制，不能无限开挂",
    ],
    forbiddenPatterns: [
      "禁止：主角无理由碾压所有对手",
      "禁止：反派智商突然下线",
      "禁止：修炼速度违背世界观设定",
      "禁止：宝物效果前后矛盾",
    ],
    pacingGuidance: "玄幻节奏：蓄压（被欺辱/困境）→ 爆发（突破/反转）→ 后效（地位提升/新仇敌）。每个小目标周期 3-5 章，大目标 10-15 章。连续 3 章无爽点标记为节奏停滞。",
    dialogueGuidance: "玄幻对话特点：强者惜字如金、弱者废话多、反派嚣张但有底气、主角前期隐忍后期霸道。避免所有角色说话风格一样。",
    worldBuildingNotes: "力量等级、势力分布、天材地宝、禁忌之地、远古秘辛——这些需要在前 10 章内建立基本框架，后续逐步展开。",
  },
  xianxia: {
    genre: "xianxia",
    label: "仙侠",
    writingRules: [
      "境界体系要清晰（炼气→筑基→金丹→元婴→...），每个境界有明确特征",
      "渡劫突破要有仪式感，不能一笔带过",
      "仙凡之别要体现，不能让凡人随意使用仙术",
      "因果、天道、劫数要有逻辑，不能成为万能解释",
      "法宝、神通、阵法要有具体描写，不能只说'强大'",
    ],
    forbiddenPatterns: [
      "禁止：境界突破如喝水",
      "禁止：天劫变成儿戏",
      "禁止：仙人行为像凡人",
      "禁止：因果报应太随意",
    ],
    pacingGuidance: "仙侠节奏：修行（积累）→ 历练（冒险）→ 顿悟（突破）→ 渡劫（考验）。修炼周期要长，不能 3 章就从凡人飞升。",
    dialogueGuidance: "仙侠对话特点：老祖说话云淡风轻、弟子恭敬、散修市侩、魔道狂傲。不同境界的用词和气度要有明显差异。",
    worldBuildingNotes: "宗门体系、灵脉分布、丹药市场、妖兽等级、天道规则——仙侠世界观要厚重，不能只有打斗。",
  },
  urban: {
    genre: "urban",
    label: "都市",
    writingRules: [
      "现代科技和社会规则要真实，不能出现明显 bug",
      "金钱、权力、人际关系要有现实逻辑",
      "主角的特殊能力要有合理来源和限制",
      "商业竞争、职场斗争要有专业性",
      "感情线要自然，不能强行配对",
    ],
    forbiddenPatterns: [
      "禁止：主角无理由成为商业天才",
      "禁止：反派全是蠢货",
      "禁止：打脸情节太刻意",
      "禁止：感情发展太快太假",
    ],
    pacingGuidance: "都市节奏：日常（生活）→ 矛盾（冲突）→ 解决（打脸/逆袭）→ 新日常（地位提升）。每 2-3 章一个小事件，每 10 章一个大事件。",
    dialogueGuidance: "都市对话要自然口语化，避免文绉绉。不同身份的人说话风格不同：老板沉稳、小弟圆滑、女主独立、配角有辨识度。",
    worldBuildingNotes: "城市设定、公司架构、黑道势力、官场关系——都市文的世界观是社会关系网，不是修炼体系。",
  },
  scifi: {
    genre: "scifi",
    label: "科幻",
    writingRules: [
      "科技设定要有内在逻辑，不能只堆砌术语",
      "硬科幻要尊重物理定律，软科幻要有社会学深度",
      "未来社会的制度、文化、伦理要有推演",
      "外星文明要有独特性，不能只是换皮人类",
      "科技对社会的影响要有深度思考",
    ],
    forbiddenPatterns: [
      "禁止：科技万能论",
      "禁止：外星人像地球人",
      "禁止：物理定律随意违反",
      "禁止：术语堆砌无解释",
    ],
    pacingGuidance: "科幻节奏：探索（发现）→ 理解（学习）→ 危机（冲突）→ 突破（解决）。科幻文需要'惊奇感'，每 5 章要有一个让人'哇'的设定展开。",
    dialogueGuidance: "科幻对话要有专业感，但不能全是术语。科学家说话要有逻辑、军人说话要简洁、政治家说话要圆滑。",
    worldBuildingNotes: "科技树、星际政治、能源体系、AI 伦理、基因改造——科幻文的世界观要有'如果这样，会怎样'的推演深度。",
  },
  romance: {
    genre: "romance",
    label: "言情",
    writingRules: [
      "感情线要有层次：相识→了解→心动→误会→和好→在一起",
      "男女主要有独立人格，不能只是对方的附属",
      "虐要虐得有道理，不能为虐而虐",
      "配角要有自己的故事线，不能只是工具人",
      "HE/BE 要有铺垫，不能突兀",
    ],
    forbiddenPatterns: [
      "禁止：一见钟情无铺垫",
      "禁止：误会太刻意",
      "禁止：配角全员工具人",
      "禁止：感情线无逻辑跳跃",
    ],
    pacingGuidance: "言情节奏：相遇（缘分）→ 接近（了解）→ 心动（暧昧）→ 误会（虐）→ 和好（甜）→ 在一起（HE）。每个阶段 5-8 章。",
    dialogueGuidance: "言情对话要有'暧昧感'：说一半留一半、话里有话、欲言又止。避免直白到尴尬的表白。",
    worldBuildingNotes: "言情文的世界观服务于感情线：家族背景、社会地位、职业设定——都是为了制造冲突和甜蜜。",
  },
  game: {
    genre: "game",
    label: "游戏",
    writingRules: [
      "游戏系统要有数值逻辑，不能随意膨胀",
      "技能、装备、等级要有明确的效果描述",
      "NPC 要有行为逻辑，不能只是发布任务的工具",
      "游戏世界的规则要一致，不能因为主角而改变",
      "现实和游戏的切换要有意义",
    ],
    forbiddenPatterns: [
      "禁止：数值无脑膨胀",
      "禁止：主角独享隐藏奖励",
      "禁止：NPC 智商为零",
      "禁止：游戏规则为主角服务",
    ],
    pacingGuidance: "游戏节奏：升级（打怪）→ 探索（发现）→ 挑战（副本/PVP）→ 奖励（装备/技能）。每 3 章一个小循环，每 10 章一个大版本更新。",
    dialogueGuidance: "游戏文对话可以轻松幽默，NPC 可以有现代梗。但重要 NPC（BOSS、关键角色）要有严肃感。",
    worldBuildingNotes: "游戏系统、职业体系、地图设计、公会势力、版本更新——游戏文的世界观要像一个真正的游戏。",
  },
};

/**
 * 获取题材专属 prompt
 */
export function getGenrePromptConfig(genre: string): GenrePromptConfig | null {
  return GENRE_PROMPTS[genre] ?? null;
}

/**
 * 构建题材专属写作指导
 */
export function buildGenreWritingGuidance(genre: string, language: "zh" | "en" = "zh"): string {
  const config = GENRE_PROMPTS[genre];
  if (!config) return "";

  if (language === "en") {
    return `## Genre: ${config.label}
${config.writingRules.map((r) => `- ${r}`).join("\n")}

${config.forbiddenPatterns.map((f) => `- ${f}`).join("\n")}

${config.pacingGuidance}

${config.dialogueGuidance}`;
  }

  return `## 题材：${config.label}

### 写作规则
${config.writingRules.map((r) => `- ${r}`).join("\n")}

### 禁区
${config.forbiddenPatterns.map((f) => `- ${f}`).join("\n")}

### 节奏指导
${config.pacingGuidance}

### 对话风格
${config.dialogueGuidance}

### 世界观要点
${config.worldBuildingNotes}`;
}
