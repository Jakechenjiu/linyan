// 编辑部模拟器核心逻辑 — 5 个角色独立评审 + 辩论 + 投票

import { REVIEWERS, buildReviewerPrompt, buildDebatePrompt, type ReviewerConfig } from "./reviewers";
import type { ReviewerRole, ReviewerAssessment, DebateEntry, EditorialResult } from "./types";

/**
 * 运行编辑部评审
 */
export async function runEditorialReview(
  chapterTitle: string,
  chapterBody: string,
  novelContext: {
    title: string;
    genre?: string;
    characters: Array<{ name: string; role: string; personality?: string }>;
    worldRules?: string;
  },
  llmCall: (system: string, user: string, temperature?: number) => Promise<string>
): Promise<EditorialResult> {
  // Phase 1: 独立评审（并行）
  const assessments = await runIndependentReviews(
    chapterTitle,
    chapterBody,
    novelContext,
    llmCall
  );

  // Phase 2: 检测分歧
  const disagreements = findDisagreements(assessments);

  // Phase 3: 辩论（如果有分歧）
  let debate: DebateEntry[] = [];
  if (disagreements.length > 0) {
    debate = await runDebate(
      chapterBody,
      assessments,
      disagreements,
      llmCall
    );
  }

  // Phase 4: 投票
  const votes = castVotes(assessments, debate);

  // Phase 5: 主编裁决
  const { finalDecision, chiefRuling } = await chiefEditorDecide(
    assessments,
    debate,
    votes,
    llmCall
  );

  return {
    assessments,
    debate,
    votes,
    finalDecision,
    chiefRuling,
  };
}

/**
 * Phase 1: 独立评审（并行）
 */
async function runIndependentReviews(
  chapterTitle: string,
  chapterBody: string,
  novelContext: {
    title: string;
    genre?: string;
    characters: Array<{ name: string; role: string; personality?: string }>;
    worldRules?: string;
  },
  llmCall: (system: string, user: string, temperature?: number) => Promise<string>
): Promise<Record<ReviewerRole, ReviewerAssessment>> {
  const contextParts: string[] = [];
  contextParts.push(`小说：${novelContext.title}`);
  if (novelContext.genre) contextParts.push(`类型：${novelContext.genre}`);
  if (novelContext.characters.length > 0) {
    contextParts.push(`角色：${novelContext.characters.map((c) => `${c.name}(${c.role})`).join("、")}`);
  }
  if (novelContext.worldRules) contextParts.push(`世界规则：${novelContext.worldRules}`);

  const userMessage = `${contextParts.join("\n")}\n\n章节：${chapterTitle}\n\n${chapterBody.slice(0, 6000)}`;

  // 并行调用 5 个评审者
  const results = await Promise.all(
    REVIEWERS.map(async (reviewer) => {
      try {
        const prompt = buildReviewerPrompt(reviewer);
        const result = await llmCall(prompt, userMessage, reviewer.temperature);
        const parsed = JSON.parse(result.replace(/```json\s?|\```/g, "").trim());
        return {
          role: reviewer.id as ReviewerRole,
          score: parsed.score || 50,
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || [],
          verdict: parsed.verdict || "conditional",
          reasoning: parsed.reasoning || "",
        };
      } catch {
        return {
          role: reviewer.id as ReviewerRole,
          score: 50,
          strengths: [],
          weaknesses: ["评审失败"],
          suggestions: [],
          verdict: "conditional" as const,
          reasoning: "评审调用失败",
        };
      }
    })
  );

  // 转换为 Record
  const assessments: Record<ReviewerRole, ReviewerAssessment> = {} as any;
  for (const result of results) {
    assessments[result.role] = result;
  }
  return assessments;
}

/**
 * Phase 2: 检测分歧
 */
function findDisagreements(
  assessments: Record<ReviewerRole, ReviewerAssessment>
): Array<{ topic: string; disagreeing: ReviewerRole[] }> {
  const disagreements: Array<{ topic: string; disagreeing: ReviewerRole[] }> = [];

  // 检测 verdict 分歧
  const verdicts = Object.entries(assessments).map(([role, a]) => ({
    role: role as ReviewerRole,
    verdict: a.verdict,
  }));

  const approves = verdicts.filter((v) => v.verdict === "approve");
  const rejects = verdicts.filter((v) => v.verdict === "reject");

  if (approves.length > 0 && rejects.length > 0) {
    disagreements.push({
      topic: `发布决策：${approves.map((a) => a.role).join("、")} 同意发布，${rejects.map((r) => r.role).join("、")} 拒绝`,
      disagreeing: [...approves.map((a) => a.role), ...rejects.map((r) => r.role)],
    });
  }

  // 检测分数分歧（差距 > 30 分）
  const scores = Object.entries(assessments).map(([role, a]) => ({
    role: role as ReviewerRole,
    score: a.score,
  }));
  const maxScore = Math.max(...scores.map((s) => s.score));
  const minScore = Math.min(...scores.map((s) => s.score));

  if (maxScore - minScore > 30) {
    const high = scores.filter((s) => s.score >= maxScore - 5);
    const low = scores.filter((s) => s.score <= minScore + 5);
    disagreements.push({
      topic: `质量评分：${high.map((h) => `${h.role}(${h.score}分)`).join("、")} vs ${low.map((l) => `${l.role}(${l.score}分)`).join("、")}`,
      disagreeing: [...high.map((h) => h.role), ...low.map((l) => l.role)],
    });
  }

  return disagreements;
}

/**
 * Phase 3: 辩论
 */
async function runDebate(
  chapterBody: string,
  assessments: Record<ReviewerRole, ReviewerAssessment>,
  disagreements: Array<{ topic: string; disagreeing: ReviewerRole[] }>,
  llmCall: (system: string, user: string, temperature?: number) => Promise<string>
): Promise<DebateEntry[]> {
  const debate: DebateEntry[] = [];

  // 对所有分歧进行辩论（最多 3 个，避免太长）
  const maxDebates = Math.min(disagreements.length, 3);

  for (let i = 0; i < maxDebates; i++) {
    const disagreement = disagreements[i];
    const involvedReviewers = REVIEWERS.filter((r) =>
      disagreement.disagreeing.includes(r.id as ReviewerRole)
    );

    // 收集各方立场
    const positions = involvedReviewers.map((r) => ({
      role: r.id,
      point: assessments[r.id as ReviewerRole].reasoning,
    }));

    // 辩论
    const roundResults = await Promise.all(
      involvedReviewers.map(async (reviewer) => {
        try {
          const prompt = buildDebatePrompt(reviewer, disagreement.topic, positions);
          const result = await llmCall(prompt, `章节内容：\n${chapterBody.slice(0, 3000)}`, reviewer.temperature);
          const parsed = JSON.parse(result.replace(/```json\s?|\```/g, "").trim());
          return {
            speaker: reviewer.id as ReviewerRole,
            target: "all" as const,
            point: parsed.position || "",
            type: parsed.agrees_with?.length > 0 ? "agree" as const : "disagree" as const,
          };
        } catch {
          return null;
        }
      })
    );

    for (const entry of roundResults) {
      if (entry) debate.push(entry);
    }
  }

  return debate;
}

/**
 * Phase 4: 投票
 */
function castVotes(
  assessments: Record<ReviewerRole, ReviewerAssessment>,
  debate: DebateEntry[]
): EditorialResult["votes"] {
  const votes: EditorialResult["votes"] = {
    approve: [],
    reject: [],
    conditional: [],
  };

  for (const [role, assessment] of Object.entries(assessments)) {
    const reviewerRole = role as ReviewerRole;
    switch (assessment.verdict) {
      case "approve":
        votes.approve.push(reviewerRole);
        break;
      case "reject":
        votes.reject.push(reviewerRole);
        break;
      case "conditional":
        votes.conditional.push(reviewerRole);
        break;
    }
  }

  return votes;
}

/**
 * Phase 5: 主编裁决
 */
async function chiefEditorDecide(
  assessments: Record<ReviewerRole, ReviewerAssessment>,
  debate: DebateEntry[],
  votes: EditorialResult["votes"],
  llmCall: (system: string, user: string, temperature?: number) => Promise<string>
): Promise<{ finalDecision: EditorialResult["finalDecision"]; chiefRuling: string }> {
  // 检查一票否决
  const chiefVeto = assessments.chief?.verdict === "reject";
  const continuityVeto = assessments.continuity?.verdict === "reject";

  if (chiefVeto) {
    return {
      finalDecision: "reject",
      chiefRuling: `主编否决：${assessments.chief.reasoning}`,
    };
  }

  if (continuityVeto) {
    return {
      finalDecision: "reject",
      chiefRuling: `连续性检查员否决：${assessments.continuity.reasoning}`,
    };
  }

  // 加权投票
  const approveWeight = votes.approve.reduce((sum, role) => {
    const reviewer = REVIEWERS.find((r) => r.id === role);
    return sum + (reviewer?.votingWeight || 1);
  }, 0);

  const rejectWeight = votes.reject.reduce((sum, role) => {
    const reviewer = REVIEWERS.find((r) => r.id === role);
    return sum + (reviewer?.votingWeight || 1);
  }, 0);

  if (rejectWeight > approveWeight) {
    return {
      finalDecision: "reject",
      chiefRuling: `投票否决（${votes.reject.join("、")}反对）`,
    };
  }

  if (votes.conditional.length > 0) {
    const suggestions = votes.conditional
      .map((role) => assessments[role].suggestions)
      .flat()
      .slice(0, 3);
    return {
      finalDecision: "conditional",
      chiefRuling: `需要修改：${suggestions.join("；")}`,
    };
  }

  return {
    finalDecision: "approve",
    chiefRuling: "全票通过",
  };
}
