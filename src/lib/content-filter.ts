// 内容审查系统 — 关键词过滤 + 风险检测

// 违禁关键词分类
const BLOCKED_CATEGORIES: Record<string, { keywords: string[]; severity: "high" | "medium" | "low" }> = {
  // 高危：直接违法
  illegal: {
    keywords: [
      "赌博", "色情", "毒品", "枪支", "爆炸物", "贩卖人口",
      "洗钱", "诈骗", "传销", "邪教", "恐怖主义",
    ],
    severity: "high",
  },
  // 中危：敏感内容
  sensitive: {
    keywords: [
      "政治敏感", "色情擦边", "暴力血腥", "自残自杀",
      "未成年人", "性暗示",
    ],
    severity: "medium",
  },
  // 低危：需要审核
  review: {
    keywords: [
      "代开发票", "刷单", "薅羊毛", "破解", "外挂",
      "盗版", "翻墙", "VPN",
    ],
    severity: "low",
  },
};

export interface ContentCheckResult {
  allowed: boolean;
  severity: "high" | "medium" | "low" | "safe";
  matchedKeywords: string[];
  message: string;
}

// 检查文本内容
export function checkContent(text: string): ContentCheckResult {
  if (!text || text.trim().length === 0) {
    return { allowed: true, severity: "safe", matchedKeywords: [], message: "" };
  }

  const normalizedText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let highestSeverity: "high" | "medium" | "low" | "safe" = "safe";

  for (const [category, config] of Object.entries(BLOCKED_CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        if (config.severity === "high") highestSeverity = "high";
        else if (config.severity === "medium" && highestSeverity !== "high") highestSeverity = "medium";
        else if (config.severity === "low" && highestSeverity === "safe") highestSeverity = "low";
      }
    }
  }

  if (highestSeverity === "high") {
    return {
      allowed: false,
      severity: "high",
      matchedKeywords,
      message: "内容包含违规信息，已被拦截",
    };
  }

  if (highestSeverity === "medium") {
    return {
      allowed: false,
      severity: "medium",
      matchedKeywords,
      message: "内容包含敏感信息，请修改后重试",
    };
  }

  if (highestSeverity === "low") {
    return {
      allowed: true, // 允许但标记
      severity: "low",
      matchedKeywords,
      message: "内容可能涉及敏感话题，请注意合规",
    };
  }

  return { allowed: true, severity: "safe", matchedKeywords: [], message: "" };
}

// 检查用户名/标题等短文本
export function checkShortText(text: string): ContentCheckResult {
  return checkContent(text);
}

// 生成免责声明
export function getDisclaimer(): string {
  return `【免责声明】
本平台为AI辅助创作工具，用户自行承担创作内容的法律责任。
平台不存储用户API Key，不审核用户创作内容。
如有违规内容，请通过举报功能反馈，我们将在24小时内处理。`;
}

// 生成服务条款摘要
export function getTermsSummary(): string {
  return `【服务条款摘要】
1. 本平台为创作工具，用户对创作内容负全责
2. 禁止创作违法、色情、暴力等违规内容
3. 用户自带API Key，平台不存储敏感信息
4. 平台有权删除违规内容并封禁账号
5. 详细条款请查看完整服务协议`;
}
