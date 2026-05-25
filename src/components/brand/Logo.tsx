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
          <linearGradient id="logoGrad2" x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00e5ff" />
            <stop offset="0.6" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="logoInk2" x1="18" y1="22" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00e5ff" stopOpacity="0.3" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0.15" />
          </linearGradient>
          <filter id="logoGlow2">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="sparkGlow3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0e68c" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#f0e68c" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Orbiting ring — subtle tech accent */}
        <ellipse cx="24" cy="12" rx="18" ry="3" fill="none" stroke="#7c3aed" strokeWidth="0.5" opacity="0.25"
                 strokeDasharray="6 3 2 3"/>

        {/* Inkstone body */}
        <rect
          x="5" y="16" width="38" height="26" rx="9"
          fill="none"
          stroke="url(#logoGrad2)"
          strokeWidth="1.6"
          filter="url(#logoGlow2)"
        />

        {/* Inner well */}
        <rect
          x="11" y="21" width="26" height="15" rx="6"
          fill="none"
          stroke="rgba(0,229,255,0.15)"
          strokeWidth="0.8"
        />

        {/* Ink pool surface */}
        <rect
          x="15" y="24" width="18" height="9" rx="5"
          fill="url(#logoInk2)"
          stroke="rgba(0,229,255,0.15)"
          strokeWidth="0.6"
        />

        {/* Data lines — subtle circuit motif */}
        <line x1="18" y1="27" x2="30" y2="27" stroke="#00e5ff" strokeWidth="0.3" opacity="0.2"/>
        <line x1="18" y1="29.5" x2="28" y2="29.5" stroke="#00e5ff" strokeWidth="0.3" opacity="0.15"/>

        {/* Main spark — the "灵" */}
        <circle cx="24" cy="5" r="2.8" fill="#00e5ff" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="24" cy="5" r="6" fill="url(#sparkGlow3)" opacity="0.5">
          <animate attributeName="r" values="5;7;5" dur="3.5s" repeatCount="indefinite" />
        </circle>

        {/* Accent sparks */}
        <circle cx="14" cy="12" r="1" fill="#f0e68c" opacity="0.5"/>
        <circle cx="34" cy="10" r="0.8" fill="#7c3aed" opacity="0.4"/>
      </svg>

      <span className={`font-mono font-bold tracking-widest ${fontSize} text-gradient-cyan glow-text transition-all duration-300 group-hover:tracking-[0.15em]`}>
        灵砚
      </span>
    </Link>
  );
}
