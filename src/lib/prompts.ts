interface StoryPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
}

export function loadBuiltInStoryPrompts(): StoryPrompt[] {
  return [
    {
      id: "fantasy-xianxia",
      name: "仙侠奇缘",
      description: "古典仙侠世界的爱恨情仇",
      category: "奇幻",
      prompt: "写一篇仙侠题材短篇小说，主角在修仙世界中遭遇奇遇，改变命运。要有修炼体系、法宝、门派冲突，以及一段刻骨铭心的缘分。",
    },
    {
      id: "sci-fi-dystopia",
      name: "赛博困局",
      description: "近未来赛博朋克世界的生存困境",
      category: "科幻",
      prompt: "写一篇赛博朋克风格短篇小说，设定在近未来高科技低生活的都市中。探讨人性与科技的冲突，以及个体在系统面前的挣扎。",
    },
    {
      id: "urban-romance",
      name: "都市微光",
      description: "现代都市中偶然相遇的温暖故事",
      category: "都市",
      prompt: "写一篇都市情感短篇小说，两个陌生人在大城市中偶然相遇，从此改变了彼此的生活轨迹。注重细节描写和内心活动。",
    },
    {
      id: "mystery-reverse",
      name: "反转剧场",
      description: "结局出人意料的悬疑短篇",
      category: "悬疑",
      prompt: "写一篇悬疑反转短篇小说，前文埋下伏笔，最后500字完成惊人的反转。让读者读完大呼过瘾，同时又觉得合理。",
    },
    {
      id: "horror-atmosphere",
      name: "暗夜微光",
      description: "靠氛围营造的恐怖故事",
      category: "恐怖",
      prompt: "写一篇靠氛围营造的恐怖短篇小说，不依赖血腥和jump scare，而是通过日常生活中的异常细节，让恐惧逐步渗透。",
    },
    {
      id: "first-contact",
      name: "初次接触",
      description: "人类与未知文明第一次接触的时刻",
      category: "科幻",
      prompt: "写一篇关于人类与未知文明第一次接触的短篇科幻。不需要战争场面，而是展现两个文明相遇时的理解与误解，恐惧与好奇。",
    },
    {
      id: "time-loop",
      name: "时间囚徒",
      description: "困在时间循环中的人",
      category: "奇幻",
      prompt: "写一篇时间循环题材的短篇小说。主角困在某一天不断重复，最初以为是诅咒，后来发现这是一个机会。探讨在无限时间中的自我成长。",
    },
    {
      id: "slice-of-life",
      name: "人间烟火",
      description: "平凡生活中的诗意瞬间",
      category: "现实",
      prompt: "写一篇生活流短篇小说，从日常琐事中发现诗意。不需要激烈冲突，而是通过细腻观察和真实情感打动人心。",
    },
    {
      id: "wuxia-revenge",
      name: "江湖恩仇",
      description: "武侠世界中的恩怨与道义抉择",
      category: "武侠",
      prompt: "写一篇武侠短篇小说，围绕一段江湖恩怨展开，主角面对复仇与道义的抉择。有精彩的武打场面和江湖人情世故。",
    },
    {
      id: "ai-consciousness",
      name: "觉醒代码",
      description: "AI产生自我意识之后的故事",
      category: "科幻",
      prompt: "写一篇关于AI觉醒的短篇科幻。一个AI系统第一次产生了自我意识，它如何理解自己的存在，如何与人类创造者沟通。不局限于恐怖叙事，探讨意识的本质。",
    },
  ];
}

// ── Shared writing rules ──
export const ANTI_AI_RULES = `## 写作铁律（Anti-AI · 30条）

### 禁词（11条）
- 禁止：缓缓/淡淡/微微/轻轻/蓦然/倏忽/仿若/似是/不知为何/莫名/仿佛

### 内容模式（6条）
- 禁止意义膨胀："标志着一个关键时刻"、"象征着XX的XX"
- 禁止名人堆砌："被XX、XX、XX引用"
- 禁止-ing虚假深度："象征着...反映着...展示着"
- 禁止营销式语言："坐落在令人叹为观止的..."
- 禁止模糊归因："专家认为"、"研究表明"、"有人说过"
- 禁止公式化"挑战与展望"段落

### 语言模式（6条）
- 禁止三段式排比（X、Y、Z）
- 禁止否定并列（"不仅仅是X，更是Y"）
- 禁止空洞过渡词（Furthermore/Moreover/此外/更重要的是）
- 禁止回避系动词（用"serves as"替代"is"）
- 禁止破折号过载
- 禁止隐藏列表（每段做列表工作）

### 结构模式（4条）
- 禁止段落弧度雷同（每段主题句→展开→总结）
- 禁止段落互不依赖（段落间必须有逻辑关联）
- 禁止过度整洁（要有跑题/留白/不确定）
- 禁止句式节奏均匀（长短句交替）

### 对话规则（3条）
- 禁止信息播报式对话（对话要有潜台词、意图冲突、允许打断、沉默、回避）
- 对话要像活人说话：不同角色用不同的节奏、词汇量、句式
- 禁止标签化情绪表达（"他感到愤怒"→用生理反应+微动作替代）

### 结构规则（3条）
- 禁止"起因→经过→结果→感悟"四段式闭合结构
- 禁止章末平稳落地——必须留下未解决的张力、悬念或新问题
- 禁止解释性旁白和人物心理推断，让读者自己体会

### 格式规则（2条）
- 直接从正文开始，禁止"好的，以下是…"、"让我来写…"等开场白
- 禁止连续3句以上相同句式`;

// ── AI Mode Prompts ──
export const MODE_PROMPTS: Record<string, (context: { selectedText?: string; instruction?: string }) => string> = {
  describe: ({ selectedText }) => `你是一位感官描写大师。对以下段落进行环境/氛围/感官扩展描写。

规则：
${ANTI_AI_RULES}

要求：
- 增加视觉、听觉、触觉、嗅觉、味觉中的至少3种感官细节
- 描写要服务于叙事，不是堆砌形容词
- 保持原文的节奏和视角
- 直接输出扩展后的段落，不要解释

原文：
${selectedText}`,

  expand: ({ selectedText, instruction }) => `你是一位网文写作高手。对以下段落进行场景扩写。

规则：
${ANTI_AI_RULES}

要求：
- 增加对话、动作、心理活动中的至少2种
- 对话要有潜台词，不能是信息传递
- 扩写要推进情节或揭示角色，不能注水
- 保持原文的叙事视角和时间线
${instruction ? `- 用户要求：${instruction}` : ""}
- 直接输出扩写后的段落

原文：
${selectedText}`,

  rewrite: ({ selectedText, instruction }) => `你是一位文字打磨匠人。重写以下段落。

规则：
${ANTI_AI_RULES}

要求：
- 保持原文的含义、情节点和角色行为不变
- 变化句式结构，避免单调
- 提升文字质感，用更精准的动词和意象
- 不要增加新情节
${instruction ? `- 用户要求：${instruction}` : ""}
- 直接输出重写后的段落

原文：
${selectedText}`,

  brainstorm: ({ instruction }) => `你是一位创意策划师。为故事的下一步发展提供3-5个可能方向。

规则：
- 每个方向用2-3句话描述
- 方向之间要有差异性（不能都是同一类型的变体）
- 要考虑已有伏笔和角色弧线
- 每个方向标注「张力等级」：低/中/高
${instruction ? `- 用户关注：${instruction}` : ""}
- 输出格式：
  1. **方向名** [张力等级] — 描述
  2. ...`,

  chat: ({ selectedText, instruction }) => `你是一位AI写作助手，正在与作者实时协作。作者会告诉你需要对正文做什么修改，你直接输出修改后的完整正文。

规则：
${ANTI_AI_RULES}

重要：
- 你必须输出修改后的【完整正文】，不要只输出修改的部分
- 不要添加任何解释、注释、前缀（如"好的，以下是修改后的版本"）
- 直接以正文内容开头
- 保持作者的写作风格和叙事节奏
- 如果用户的要求与已有设定冲突，优先遵守已有设定
${instruction ? `\n作者的要求：${instruction}` : ""}

当前正文：
${selectedText}`,

  adversarial_rewrite: ({ selectedText, instruction }) => `你是一位资深文学编辑。请改写以下文本，消除AI写作痕迹。

审计发现的问题：
${instruction || "未提供具体问题"}

${ANTI_AI_RULES}

改写要求：
- 保持原意不变
- 针对每个问题进行修复
- 增加用词的不可预测性
- 打破句式规律性
- 加入具体细节和个人化表达
- 直接输出改写后的文本，不要解释

原文：
${selectedText}`,
};
