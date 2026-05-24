import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 24, md: 32, lg: 48 };
  const s = dims[size];
  const fontSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <Link href="/" className="flex items-center gap-2 select-none">
      <svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        style={{ filter: "drop-shadow(0 0 6px rgba(0,229,255,0.4))" }}
      >
        {/* 砚台 body */}
        <rect
          x="8" y="14" width="32" height="24" rx="6"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="2"
        />
        {/* 砚池 */}
        <rect
          x="16" y="20" width="16" height="10" rx="4"
          fill="rgba(0,229,255,0.15)"
          stroke="rgba(0,229,255,0.3)"
          strokeWidth="1"
        />
        {/* 墨滴 */}
        <ellipse cx="24" cy="24" rx="3" ry="2.5" fill="#00e5ff" opacity="0.8">
          <animate attributeName="ry" values="2.5;3;2.5" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </svg>
      <span className={`font-mono font-bold tracking-wider ${fontSize} glow-text`}>
        灵砚
      </span>
    </Link>
  );
}
