export interface GenrePreset {
  id: string;
  label: string;
  category: string;
  description: string;
  coverColor: string;
  hookTypes: string[];
  pacingNote: string;
}

export const genrePresets: GenrePreset[] = [
  {
    id: "xuanhuan",
    label: "玄幻",
    category: "玄幻修仙类",
    description: "东方幻想世界，修炼体系、宗门林立、天道争锋",
    coverColor: "#7c3aed",
    hookTypes: ["境界突破", "秘境探险", "宗门大比", "天材地宝"],
    pacingNote: "境界突破是核心爽点，3-5章一个小高潮",
  },
  {
    id: "xianxia",
    label: "修仙",
    category: "玄幻修仙类",
    description: "凡人修仙，步步登天，长生路上的机缘与因果",
    coverColor: "#00e5ff",
    hookTypes: ["机缘获得", "突破渡劫", "法宝出世", "道心考验"],
    pacingNote: "可容纳更多铺垫章，境界突破是读者核心期待",
  },
  {
    id: "system",
    label: "系统流",
    category: "玄幻修仙类",
    description: "系统加持，任务驱动，数据化成长轨迹",
    coverColor: "#22c55e",
    hookTypes: ["系统任务", "奖励发放", "数值突破", "隐藏成就"],
    pacingNote: "金手指前2章内出现，每章至少2个爽点",
  },
  {
    id: "urban",
    label: "都市异能",
    category: "都市现代类",
    description: "现代都市背景下，隐藏身份的能力者在暗处博弈",
    coverColor: "#f59e0b",
    hookTypes: ["身份暴露", "实力碾压", "势力冲突", "资源争夺"],
    pacingNote: "身份隐藏→揭露的节奏控制是核心，3章一个峰值",
  },
  {
    id: "scifi",
    label: "科幻",
    category: "玄幻修仙类",
    description: "未来科技、星际文明、AI觉醒、赛博空间",
    coverColor: "#3b82f6",
    hookTypes: ["技术突破", "外星接触", "文明冲突", "AI进化"],
    pacingNote: "科技逻辑一致性优先于爽点密度",
  },
  {
    id: "romance",
    label: "言情",
    category: "言情类",
    description: "情感驱动的故事，关系推拉与身份反转",
    coverColor: "#ec4899",
    hookTypes: ["关系转折", "身份揭秘", "情感爆发", "重逢/分离"],
    pacingNote: "情感钩子是最核心的微交付，关系推进即爽点",
  },
  {
    id: "mystery",
    label: "悬疑",
    category: "特殊题材",
    description: "谜题驱动，层层揭开真相，逻辑完整性至上",
    coverColor: "#6b7280",
    hookTypes: ["线索发现", "反转揭露", "红鲱鱼", "真相碎片"],
    pacingNote: "逻辑完整性 > 爽点密度，信息交付是核心",
  },
  {
    id: "history",
    label: "历史",
    category: "特殊题材",
    description: "穿越/架空历史，知识优势与时代浪潮的碰撞",
    coverColor: "#92400e",
    hookTypes: ["制度创新", "技术降维", "权谋博弈", "历史转折"],
    pacingNote: "知识优势 > 武力优势，3章一个制度/技术峰值",
  },
];

export function getGenrePreset(id: string): GenrePreset | undefined {
  return genrePresets.find((g) => g.id === id);
}
