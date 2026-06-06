// 角色声音指纹系统 — 从已有章节提取角色说话风格

interface VoiceFingerprint {
  character: string;
  avgLineLength: number;        // 平均台词长度
  shortLineRatio: number;       // 短句比例（<15字）
  questionRatio: number;        // 反问比例
  frequentWords: string[];      // 高频词（2-3字）
  markers: string[];            // 风格标记
}

/**
 * 从章节正文中提取角色对话指纹
 */
export function extractDialogueFingerprints(
  chapters: Array<{ body: string }>,
  characterNames: string[]
): VoiceFingerprint[] {
  // 合并所有章节
  const allText = chapters.map((ch) => ch.body).join("\n\n");

  // 匹配对话模式
  // 中文：角色说道："台词" 或 "台词"
  const dialogueRegex = /(?:(.{1,6})(?:说道|道|喝道|冷声道|笑道|怒道|低声道|大声道|喝骂道|冷笑道|沉声道|喊道|叫道|问道|答道|嘟囔道|嘀咕道|自语道)\s*[：:]\s*["""「]([^"""」]+)["""「])|["""「]([^"""」]{2,})["""「]|"([^"]{2,})"/g;

  const characterDialogues = new Map<string, string[]>();
  let match: RegExpExecArray | null;

  while ((match = dialogueRegex.exec(allText)) !== null) {
    const speaker = match[1]?.trim();
    const line = match[2] ?? match[3] ?? match[4] ?? "";
    if (speaker && line.length > 1) {
      // 检查是否是已知角色
      const matchedName = characterNames.find(
        (name) => speaker.includes(name) || name.includes(speaker)
      );
      if (matchedName) {
        const existing = characterDialogues.get(matchedName) ?? [];
        characterDialogues.set(matchedName, [...existing, line]);
      }
    }
  }

  // 为每个角色生成指纹
  const fingerprints: VoiceFingerprint[] = [];

  for (const [character, lines] of characterDialogues) {
    if (lines.length < 2) continue; // 至少 2 句台词

    const avgLineLength = Math.round(
      lines.reduce((sum, l) => sum + l.length, 0) / lines.length
    );
    const shortLineRatio = lines.filter((l) => l.length < 15).length / lines.length;
    const questionRatio = lines.filter((l) => l.includes("？") || l.includes("?")).length / lines.length;

    // 高频词分析（2-3 字组合）
    const wordCounts = new Map<string, number>();
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const bigram = line.slice(i, i + 2);
        if (!/[，。！？、；：""「」\s]/.test(bigram)) {
          wordCounts.set(bigram, (wordCounts.get(bigram) ?? 0) + 1);
        }
      }
    }
    const frequentWords = [...wordCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    // 风格标记
    const markers: string[] = [];
    if (shortLineRatio > 0.6) markers.push("短句为主");
    else if (shortLineRatio < 0.3) markers.push("长句为主");

    if (questionRatio > 0.3) markers.push("反问多");

    if (frequentWords.length > 0) markers.push(`常用：${frequentWords.slice(0, 3).join("、")}`);

    // 检测省略号使用
    const ellipsisCount = lines.filter((l) => l.includes("……") || l.includes("...")).length;
    if (ellipsisCount > lines.length * 0.3) markers.push("多省略号");

    // 检测感叹号
    const exclaimCount = lines.filter((l) => l.includes("！") || l.includes("!")).length;
    if (exclaimCount > lines.length * 0.3) markers.push("多感叹");

    fingerprints.push({
      character,
      avgLineLength,
      shortLineRatio: Math.round(shortLineRatio * 100) / 100,
      questionRatio: Math.round(questionRatio * 100) / 100,
      frequentWords,
      markers,
    });
  }

  return fingerprints;
}

/**
 * 将指纹格式化为 prompt 注入文本
 */
export function formatFingerprintsForPrompt(
  fingerprints: VoiceFingerprint[],
  language: "zh" | "en" = "zh"
): string {
  if (fingerprints.length === 0) return "";

  if (language === "en") {
    return fingerprints
      .map((fp) => {
        const parts = [`- ${fp.character}: avg ${fp.avgLineLength} chars/line`];
        if (fp.markers.length > 0) parts.push(`  Style: ${fp.markers.join(", ")}`);
        return parts.join("\n");
      })
      .join("\n");
  }

  return fingerprints
    .map((fp) => {
      const parts = [`- ${fp.character}：平均${fp.avgLineLength}字/句`];
      if (fp.markers.length > 0) parts.push(`  风格：${fp.markers.join("，")}`);
      return parts.join("\n");
    })
    .join("\n");
}
