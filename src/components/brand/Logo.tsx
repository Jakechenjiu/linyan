import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 26, md: 34, lg: 50 };
  const s = dims[size];
  const fontSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];
  const glowSpread = { sm: "8px", md: "12px", lg: "18px" }[size];

  return (
    <Link href="/" className="flex items-center gap-2.5 select-none group">
      <svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-500 group-hover:scale-105"
        style={{ filter: `drop-shadow(0 0 ${glowSpread} rgba(0,229,255,0.35))` }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="8" y1="14" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00e5ff" />
            <stop offset="0.6" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="logoInk" x1="16" y1="20" x2="32" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00e5ff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0.2" />
          </linearGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer vessel */}
        <rect
          x="6" y="10" width="36" height="28" rx="8"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="1.6"
          filter="url(#logoGlow)"
        />

        {/* Inner rim highlight */}
        <rect
          x="9" y="13" width="30" height="22" rx="5"
          fill="none"
          stroke="rgba(0,229,255,0.12)"
          strokeWidth="0.6"
        />

        {/* Ink pool */}
        <rect
          x="15" y="19" width="18" height="11" rx="5"
          fill="url(#logoInk)"
          stroke="rgba(0,229,255,0.2)"
          strokeWidth="0.8"
        />

        {/* Ink drop — pulsing */}
        <ellipse cx="24" cy="23.5" rx="3.5" ry="2.8" fill="#00e5ff" opacity="0.7">
          <animate attributeName="ry" values="2.8;3.6;2.8" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3.5s" repeatCount="indefinite" />
        </ellipse>

        {/* Ink drop glow ring */}
        <ellipse cx="24" cy="23.5" rx="6" ry="5" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="0.5">
          <animate attributeName="rx" values="5.5;7;5.5" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="ry" values="4.5;6;4.5" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.05;0.15" dur="3.5s" repeatCount="indefinite" />
        </ellipse>
      </svg>

      <span className={`font-mono font-bold tracking-widest ${fontSize} text-gradient-cyan glow-text transition-all duration-300 group-hover:tracking-[0.15em]`}>
        灵砚
      </span>
    </Link>
  );
}
