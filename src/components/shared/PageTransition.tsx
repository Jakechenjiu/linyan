"use client";

import { useEffect, useState, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  return (
    <div
      className="page-transition"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

// Cinematic loading screen
export function LoadingScreen({ progress = 0 }: { progress?: number }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-abyss)]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 60%)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo animation */}
        <div className="mb-8">
          <div
            className="inline-block"
            style={{
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--cyan)] to-[var(--nebula)] flex items-center justify-center shadow-2xl">
              <span className="text-3xl font-bold text-white font-mono">灵</span>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-sm text-muted-foreground font-mono">
          正在加载{dots}
        </p>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-4 w-48 h-0.5 bg-[var(--accent)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--nebula)] rounded-full"
              style={{
                width: `${progress}%`,
                transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Smooth section transition
export function SectionReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        animation: `sectionReveal 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
      }}
    >
      <style jsx>{`
        @keyframes sectionReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}
