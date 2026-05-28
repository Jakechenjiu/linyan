// 万象推演 — 智能体预设和场景模板

export interface AgentPreset {
  id: string;
  name: string;
  role: string;
  personality: string;
  category: "analysis" | "creative" | "caution" | "industry" | "social";
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  topic: string;
  seedMaterial: string;
  agents: { name: string; role: string }[];
  rounds: number;
  category: "business" | "risk" | "trend" | "conflict" | "creative";
}

// ===== 角色预设 =====
export const agentPresets: AgentPreset[] = [
  // 分析类
  { id: "analyst", name: "数据分析师", role: "冷静客观的数据分析师，擅长从数据和事实中提炼洞察", personality: "理性、严谨、数据驱动", category: "analysis" },
  { id: "strategist", name: "战略顾问", role: "从全局视角分析问题，关注长期价值和竞争优势", personality: "宏观思维、长远眼光", category: "analysis" },
  { id: "researcher", name: "深度研究员", role: "深入挖掘问题本质，寻找底层逻辑和因果关系", personality: "好奇心强、追根究底", category: "analysis" },
  { id: "devil_advocate", name: "魔鬼代言人", role: "专门寻找方案的漏洞和风险，提出反对意见", personality: "批判性思维、不盲从", category: "analysis" },

  // 创意类
  { id: "innovator", name: "创新者", role: "善于提出颠覆性想法和非传统解决方案", personality: "天马行空、敢于冒险", category: "creative" },
  { id: "designer", name: "用户体验设计师", role: "从用户视角思考问题，关注易用性和情感体验", personality: "共情能力强、注重细节", category: "creative" },
  { id: "storyteller", name: "故事讲述者", role: "用故事和案例来阐述观点，善于打动人心", personality: "感性、有感染力", category: "creative" },
  { id: "connector", name: "跨界连接者", role: "善于将不同领域的知识和经验跨界融合", personality: "知识面广、善于联想", category: "creative" },

  // 谨慎类
  { id: "pessimist", name: "悲观主义者", role: "关注最坏情况和脆弱环节，提前预警风险", personality: "谨慎、保守", category: "caution" },
  { id: "compliance", name: "合规专家", role: "关注法律法规和政策风险，确保方案合规", personality: "严谨、守规矩", category: "caution" },
  { id: "security", name: "安全专家", role: "关注安全漏洞和潜在威胁，提出防护建议", personality: "警惕、细致", category: "caution" },
  { id: "cost_analyst", name: "成本分析师", role: "关注投入产出比和资源消耗，优化成本结构", personality: "精打细算、务实", category: "caution" },

  // 行业类
  { id: "tech_expert", name: "技术专家", role: "深厚的技术背景，评估技术可行性和架构方案", personality: "技术驱动、追求最优解", category: "industry" },
  { id: "market_expert", name: "市场专家", role: "了解市场动态和竞争格局，评估市场机会", personality: "敏锐、商业嗅觉强", category: "industry" },
  { id: "finance_expert", name: "财务专家", role: "评估财务可行性和投资回报，制定预算方案", personality: "严谨、数字敏感", category: "industry" },
  { id: "ops_expert", name: "运营专家", role: "关注执行细节和落地可行性，制定运营策略", personality: "执行力强、注重细节", category: "industry" },

  // 社会类
  { id: "user_rep", name: "用户代表", role: "代表终端用户的声音，关注实际使用体验", personality: "直率、真实", category: "social" },
  { id: "investor", name: "投资人视角", role: "从投资回报和增长潜力角度评估方案", personality: "理性、追求增长", category: "social" },
  { id: "competitor", name: "竞争对手", role: "站在竞争对手角度思考，预测对手可能的反应", personality: "竞争意识强", category: "social" },
  { id: "regulator", name: "监管者", role: "从监管和公共利益角度审视方案", personality: "公正、关注公共利益", category: "social" },
];

// ===== 场景模板 =====
export const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "product-launch",
    name: "产品发布决策",
    description: "评估新产品发布的时机、策略和潜在风险",
    topic: "我们计划在下季度发布一款新的AI写作助手产品，需要评估发布时机、定价策略和市场推广方案",
    seedMaterial: "产品已完成核心功能开发，目标用户是内容创作者和自媒体人。竞品已有3家，市场增长迅速。",
    agents: [
      { name: "市场专家", role: "了解AI写作工具市场动态和竞争格局" },
      { name: "技术专家", role: "评估产品技术成熟度和稳定性" },
      { name: "用户体验设计师", role: "从用户视角评估产品体验" },
      { name: "成本分析师", role: "评估定价策略和盈利能力" },
      { name: "魔鬼代言人", role: "寻找产品发布可能失败的原因" },
    ],
    rounds: 5,
    category: "business",
  },
  {
    id: "risk-assessment",
    name: "风险评估",
    description: "全面评估项目或决策的潜在风险",
    topic: "评估将业务扩展到海外市场的风险和机遇",
    seedMaterial: "公司目前在国内市场有一定基础，计划进入东南亚和欧美市场。需要考虑文化差异、法律法规、竞争环境等因素。",
    agents: [
      { name: "合规专家", role: "评估海外法律法规风险" },
      { name: "市场专家", role: "分析目标市场竞争格局" },
      { name: "悲观主义者", role: "关注最坏情况和应对方案" },
      { name: "战略顾问", role: "从全局视角评估扩展策略" },
      { name: "成本分析师", role: "评估扩展所需的资源投入" },
    ],
    rounds: 5,
    category: "risk",
  },
  {
    id: "trend-prediction",
    name: "趋势预测",
    description: "预测行业或技术发展趋势",
    topic: "预测未来3年AI在创意产业的应用趋势",
    seedMaterial: "当前AI已在文本生成、图像生成、视频生成等领域取得突破。需要预测技术发展方向、商业模式变化、对从业者的影响。",
    agents: [
      { name: "技术专家", role: "评估AI技术发展趋势" },
      { name: "创新者", role: "提出颠覆性的应用场景" },
      { name: "市场专家", role: "分析商业模式演变" },
      { name: "用户代表", role: "代表创作者的声音和需求" },
      { name: "战略顾问", role: "综合判断趋势走向" },
    ],
    rounds: 6,
    category: "trend",
  },
  {
    id: "conflict-resolution",
    name: "冲突分析",
    description: "分析多方利益冲突，寻找解决方案",
    topic: "团队内部关于技术选型的分歧需要解决",
    seedMaterial: "前端团队倾向于使用React，后端团队倾向于使用Go。需要在性能、开发效率、团队技能之间找到平衡。",
    agents: [
      { name: "技术专家", role: "客观评估两种技术的优劣" },
      { name: "用户体验设计师", role: "关注最终用户体验" },
      { name: "成本分析师", role: "评估学习成本和迁移成本" },
      { name: "战略顾问", role: "从长期发展角度给出建议" },
      { name: "跨界连接者", role: "寻找折中和创新方案" },
    ],
    rounds: 4,
    category: "conflict",
  },
  {
    id: "content-strategy",
    name: "内容策略",
    description: "制定内容创作和分发策略",
    topic: "为一个新品牌制定全平台内容营销策略",
    seedMaterial: "品牌定位是年轻、时尚、科技感。目标平台包括小红书、抖音、B站、公众号。预算有限，需要高效利用资源。",
    agents: [
      { name: "市场专家", role: "分析各平台用户画像和内容偏好" },
      { name: "故事讲述者", role: "设计品牌故事和内容主题" },
      { name: "用户体验设计师", role: "关注内容的视觉和交互体验" },
      { name: "成本分析师", role: "优化内容生产成本" },
      { name: "创新者", role: "提出差异化的内容形式" },
    ],
    rounds: 5,
    category: "creative",
  },
  {
    id: "startup-evaluation",
    name: "创业项目评估",
    description: "从多个维度评估一个创业项目的可行性",
    topic: "评估一个AI驱动的个性化教育平台的创业可行性",
    seedMaterial: "目标是利用AI为每个学生提供个性化的学习路径和内容。市场有需求但竞争激烈。团队有技术背景但缺乏教育行业经验。",
    agents: [
      { name: "投资人视角", role: "从投资回报角度评估" },
      { name: "市场专家", role: "分析教育科技市场" },
      { name: "技术专家", role: "评估AI技术可行性" },
      { name: "合规专家", role: "评估教育行业政策风险" },
      { name: "魔鬼代言人", role: "寻找项目可能失败的原因" },
      { name: "战略顾问", role: "制定发展策略" },
    ],
    rounds: 6,
    category: "business",
  },
];

// 获取角色预设分类
export function getPresetsByCategory() {
  const categories: Record<string, AgentPreset[]> = {};
  for (const preset of agentPresets) {
    if (!categories[preset.category]) categories[preset.category] = [];
    categories[preset.category].push(preset);
  }
  return categories;
}

// 获取场景模板分类
export function getTemplatesByCategory() {
  const categories: Record<string, ScenarioTemplate[]> = {};
  for (const template of scenarioTemplates) {
    if (!categories[template.category]) categories[template.category] = [];
    categories[template.category].push(template);
  }
  return categories;
}

// 从预设生成智能体列表
export function agentsFromPresets(presetIds: string[]): { name: string; role: string }[] {
  return presetIds
    .map((id) => agentPresets.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ name: p!.name, role: p!.role }));
}
