// 情感曲线类型定义

export interface EmotionalDataPoint {
  position: number;    // 0-100，文本位置百分比
  tension: number;     // 0-10
  suspense: number;    // 0-10
  pleasure: number;    // 0-10
  sadness: number;     // 0-10
  reversal: number;    // 0-10
}

export interface NarrativeTechnique {
  segment: [number, number]; // [start%, end%]
  technique: string;
  reason: string;
  expectedEffect: string;
}

export interface EmotionalCurveDesign {
  targetCurve: EmotionalDataPoint[];
  techniques: NarrativeTechnique[];
  overallTone: string;
  pacingStrategy: string;
}

export interface CurveValidation {
  tensionMatch: number;      // 0-100
  suspenseMatch: number;
  pleasureMatch: number;
  sadnessMatch: number;
  reversalMatch: number;
  overallMatch: number;
}
