// 跨章节奏检测 — 分析近 N 章的节奏波形

export interface RhythmAnalysis {
  wavePattern: Array<{ chapter: number; type: "setup" | "escalation" | "climax" | "aftermath"; intensity: number }>;
  issues: Array<{ severity: "warning" | "info"; description: string }>;
  summary: string;
}

/**
 * 分析近 N 章的节奏
 */
export function analyzeRhythm(
  chapters: Array<{ order: number; title: string; body: string }>,
  language: "zh" | "en" = "zh"
): RhythmAnalysis {
  if (chapters.length < 2) {
    return {
      wavePattern: [],
      issues: [],
      summary: language === "en" ? "Too few chapters to analyze rhythm" : "章节太少，无法分析节奏",
    };
  }

  // 分析每章的类型和强度
  const wavePattern = chapters.map((ch) => {
    const analysis = classifyChapter(ch.body, language);
    return {
      chapter: ch.order,
      type: analysis.type,
      intensity: analysis.intensity,
    };
  });

  // 检测节奏问题
  const issues: Array<{ severity: "warning" | "info"; description: string }> = [];

  // 检测连续相同类型
  for (let i = 0; i < wavePattern.length - 2; i++) {
    const slice = wavePattern.slice(i, i + 3);
    if (slice.every((s) => s.type === slice[0].type)) {
      const typeLabel = language === "en" ? slice[0].type : typeToChinese(slice[0].type);
      issues.push({
        severity: "warning",
        description: language === "en"
          ? `Chapters ${slice[0].chapter}-${slice[2].chapter}: 3 consecutive "${slice[0].type}" chapters`
          : `第${slice[0].chapter}-${slice[2].chapter}章：连续 3 章都是"${typeLabel}"`,
      });
    }
  }

  // 检测连续高强度无喘息
  let consecutiveHigh = 0;
  for (const wave of wavePattern) {
    if (wave.intensity > 7) {
      consecutiveHigh++;
    } else {
      consecutiveHigh = 0;
    }
  }
  if (consecutiveHigh >= 4) {
    issues.push({
      severity: "warning",
      description: language === "en"
        ? `${consecutiveHigh} consecutive high-intensity chapters — reader fatigue risk`
        : `连续 ${consecutiveHigh} 章高强度——读者疲劳风险`,
    });
  }

  // 检测连续低强度（流水账）
  let consecutiveLow = 0;
  for (const wave of wavePattern) {
    if (wave.intensity < 3) {
      consecutiveLow++;
    } else {
      consecutiveLow = 0;
    }
  }
  if (consecutiveLow >= 4) {
    issues.push({
      severity: "warning",
      description: language === "en"
        ? `${consecutiveLow} consecutive low-intensity chapters — pacing stagnation`
        : `连续 ${consecutiveLow} 章低强度——节奏停滞`,
    });
  }

  // 检测高潮后缺少后效
  for (let i = 0; i < wavePattern.length - 1; i++) {
    if (wavePattern[i].type === "climax" && wavePattern[i + 1].type === "setup") {
      issues.push({
        severity: "info",
        description: language === "en"
          ? `Chapter ${wavePattern[i].chapter} climax → Chapter ${wavePattern[i + 1].chapter} setup: missing aftermath`
          : `第${wavePattern[i].chapter}章高潮 → 第${wavePattern[i + 1].chapter}章铺垫：缺少后效`,
      });
    }
  }

  // 生成摘要
  const typeCounts = { setup: 0, escalation: 0, climax: 0, aftermath: 0 };
  for (const wave of wavePattern) {
    typeCounts[wave.type]++;
  }

  const summary = language === "en"
    ? `Rhythm: ${typeCounts.setup} setup, ${typeCounts.escalation} escalation, ${typeCounts.climax} climax, ${typeCounts.aftermath} aftermath. ${issues.length} issues found.`
    : `节奏：${typeCounts.setup}铺垫、${typeCounts.escalation}升级、${typeCounts.climax}高潮、${typeCounts.aftermath}后效。发现 ${issues.length} 个问题。`;

  return { wavePattern, issues, summary };
}

/**
 * 分类章节类型和强度
 */
function classifyChapter(
  body: string,
  language: "zh" | "en"
): { type: "setup" | "escalation" | "climax" | "aftermath"; intensity: number } {
  let intensity = 5; // 基础分

  // 高强度信号
  const highIntensityPatterns = language === "en"
    ? [/battle|fight|duel|kill|death|war|explode|destroy|rage|fury|scream|blood/i]
    : [/战斗|打斗|厮杀|斩杀|死亡|战争|爆炸|毁灭|暴怒|狂吼|鲜血|重伤|突破|渡劫/];

  const lowIntensityPatterns = language === "en"
    ? [/rest|sleep|eat|walk|talk|chat|morning|evening|peaceful|quiet|calm/i]
    : [/休息|睡觉|吃饭|散步|聊天|清晨|傍晚|平静|安静|祥和/];

  // 高潮信号
  const climaxPatterns = language === "en"
    ? [/final|ultimate|last stand|defeat the|victory|won|overcome|breakthrough/i]
    : [/最终|终极|最后一战|击败|胜利|战胜|突破|顿悟|觉醒/];

  // 后效信号
  const aftermathPatterns = language === "en"
    ? [/after|consequence|result|heal|recover|mourn|celebrate|reward|reflection/i]
    : [/之后|后果|结果|疗伤|恢复|哀悼|庆祝|奖励|反思|感悟/];

  // 计算强度
  for (const pattern of highIntensityPatterns) {
    if (pattern.test(body)) intensity += 2;
  }
  for (const pattern of lowIntensityPatterns) {
    if (pattern.test(body)) intensity -= 1;
  }

  // 对话比例高 = 低强度
  const dialogueRatio = (body.match(/["""「」]/g)?.length || 0) / body.length;
  if (dialogueRatio > 0.1) intensity -= 1;

  // 短句多 = 高强度
  const sentences = body.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = body.length / Math.max(sentences.length, 1);
  if (avgSentenceLength < 20) intensity += 1;
  if (avgSentenceLength > 50) intensity -= 1;

  intensity = Math.max(1, Math.min(10, intensity));

  // 分类
  let type: "setup" | "escalation" | "climax" | "aftermath";

  if (climaxPatterns.some((p) => p.test(body))) {
    type = "climax";
  } else if (aftermathPatterns.some((p) => p.test(body))) {
    type = "aftermath";
  } else if (intensity >= 7) {
    type = "escalation";
  } else {
    type = "setup";
  }

  return { type, intensity };
}

function typeToChinese(type: string): string {
  const map: Record<string, string> = {
    setup: "铺垫",
    escalation: "升级",
    climax: "高潮",
    aftermath: "后效",
  };
  return map[type] || type;
}
