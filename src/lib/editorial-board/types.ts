// 编辑部类型定义

export type ReviewerRole = "author" | "editor" | "chief" | "reader" | "continuity";

export interface ReviewerAssessment {
  role: ReviewerRole;
  score: number;                 // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  verdict: "approve" | "reject" | "conditional";
  reasoning: string;
}

export interface DebateEntry {
  speaker: ReviewerRole;
  target: ReviewerRole | "all";
  point: string;
  type: "agree" | "disagree" | "challenge" | "support";
}

export interface EditorialResult {
  assessments: Record<ReviewerRole, ReviewerAssessment>;
  debate: DebateEntry[];
  votes: {
    approve: ReviewerRole[];
    reject: ReviewerRole[];
    conditional: ReviewerRole[];
  };
  finalDecision: "approve" | "reject" | "conditional";
  chiefRuling: string;
}
