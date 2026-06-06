// 情感曲线 5 维度定义

export interface EmotionalDimension {
  id: string;
  name: string;
  description: string;
  techniques: Array<{
    name: string;
    description: string;
    effect: number; // 0-1
  }>;
}

export const EMOTIONAL_DIMENSIONS: EmotionalDimension[] = [
  {
    id: "tension",
    name: "紧张度",
    description: "读者感到的压力、紧迫感",
    techniques: [
      { name: "时间压力", description: "deadline逼近", effect: 0.8 },
      { name: "信息不对称", description: "读者知道危险但角色不知道", effect: 0.7 },
      { name: "威胁逼近", description: "反派在行动", effect: 0.9 },
      { name: "选择困境", description: "两个都不好的选择", effect: 0.6 },
      { name: "资源耗尽", description: "时间/金钱/信任快用完", effect: 0.7 },
    ],
  },
  {
    id: "suspense",
    name: "悬念度",
    description: "读者想知道答案的欲望",
    techniques: [
      { name: "未答问题", description: "抛出问题不给答案", effect: 0.9 },
      { name: "反常行为", description: "角色做了不合理的事", effect: 0.7 },
      { name: "信息截断", description: "关键信息被打断", effect: 0.8 },
      { name: "新线索", description: "出现意外信息", effect: 0.6 },
      { name: "视角切换", description: "在关键时刻切到另一条线", effect: 0.7 },
    ],
  },
  {
    id: "pleasure",
    name: "愉悦度",
    description: "读者感到的满足、快乐",
    techniques: [
      { name: "愿望达成", description: "角色实现了目标", effect: 0.8 },
      { name: "意外收获", description: "超出预期的好结果", effect: 0.7 },
      { name: "关系升温", description: "角色间关系改善", effect: 0.6 },
      { name: "智慧展现", description: "角色用聪明的方式解决问题", effect: 0.7 },
      { name: "幽默", description: "轻松的时刻", effect: 0.5 },
    ],
  },
  {
    id: "sadness",
    name: "悲伤度",
    description: "读者感到的心痛、失落",
    techniques: [
      { name: "失去", description: "失去重要的人/物/机会", effect: 0.9 },
      { name: "背叛", description: "信任被打破", effect: 0.8 },
      { name: "希望破灭", description: "以为会好结果但没有", effect: 0.7 },
      { name: "孤独", description: "角色被孤立", effect: 0.6 },
      { name: "回忆对比", description: "现在vs过去的反差", effect: 0.5 },
    ],
  },
  {
    id: "reversal",
    name: "反转度",
    description: "读者感到的意外、震惊",
    techniques: [
      { name: "身份揭示", description: "某人不是你以为的那样", effect: 0.9 },
      { name: "真相翻转", description: "之前的理解是错的", effect: 0.8 },
      { name: "立场逆转", description: "盟友变敌人或反之", effect: 0.8 },
      { name: "规则打破", description: "世界观的底层规则被颠覆", effect: 0.7 },
      { name: "伏笔回收", description: "很久前的细节突然重要", effect: 0.6 },
    ],
  },
];

export const DIMENSION_IDS = EMOTIONAL_DIMENSIONS.map((d) => d.id);
export type DimensionId = (typeof DIMENSION_IDS)[number];

export function getDimension(id: string): EmotionalDimension | undefined {
  return EMOTIONAL_DIMENSIONS.find((d) => d.id === id);
}

export function selectTechniques(
  targets: Record<string, number>
): Array<{ dimension: string; technique: string; reason: string }> {
  const selections: Array<{ dimension: string; technique: string; reason: string }> = [];

  for (const [dimension, intensity] of Object.entries(targets)) {
    if (intensity < 5) continue; // 只关注需要强化的维度

    const dim = getDimension(dimension);
    if (!dim) continue;

    // 选择效果最强且与目标强度匹配的手段
    const available = dim.techniques
      .filter((t) => t.effect <= intensity / 10 + 0.2)
      .sort((a, b) => b.effect - a.effect)
      .slice(0, 2);

    for (const t of available) {
      selections.push({
        dimension,
        technique: t.name,
        reason: t.description,
      });
    }
  }

  return selections;
}
