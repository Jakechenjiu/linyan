"use client";

import type { PersonalityVector } from "@/lib/character-agent/types";

const DIMENSIONS = [
  { key: "openness" as const, label: "开放", angle: -90 },
  { key: "conscientiousness" as const, label: "尽责", angle: -18 },
  { key: "extraversion" as const, label: "外向", angle: 54 },
  { key: "agreeableness" as const, label: "宜人", angle: 126 },
  { key: "neuroticism" as const, label: "神经质", angle: 198 },
];

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 60;

function polarToCartesian(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function PersonalityRadar({
  personality,
  size = SIZE,
}: {
  personality: PersonalityVector | null;
  size?: number;
}) {
  if (!personality) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-muted-foreground"
        style={{ width: size, height: size }}
      >
        未设定性格
      </div>
    );
  }

  const scale = size / SIZE;
  const r = RADIUS * scale;
  const cx = (size / 2);
  const cy = (size / 2);

  // 计算每个维度的点
  const points = DIMENSIONS.map((dim) => {
    const value = personality[dim.key] / 10; // 0-1
    const { x, y } = polarToCartesian(dim.angle, r * value);
    return { ...dim, x: x * scale, y: y * scale, value };
  });

  // 构建多边形路径
  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // 网格圆
  const gridCircles = [0.25, 0.5, 0.75, 1].map((ratio) => r * ratio);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 网格 */}
      {gridCircles.map((radius, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}

      {/* 轴线 */}
      {DIMENSIONS.map((dim, i) => {
        const { x, y } = polarToCartesian(dim.angle, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x * scale}
            y2={y * scale}
            stroke="var(--accent)"
            strokeWidth={1}
            opacity={0.3}
          />
        );
      })}

      {/* 数据多边形 */}
      <path
        d={polygonPath}
        fill="var(--cyan)"
        fillOpacity={0.15}
        stroke="var(--cyan)"
        strokeWidth={2}
      />

      {/* 数据点 */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="var(--cyan)"
        />
      ))}

      {/* 标签 */}
      {DIMENSIONS.map((dim, i) => {
        const { x, y } = polarToCartesian(dim.angle, r + 18 * scale);
        return (
          <text
            key={i}
            x={x * scale}
            y={y * scale}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9 * scale}
            fill="var(--muted-foreground)"
          >
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}
