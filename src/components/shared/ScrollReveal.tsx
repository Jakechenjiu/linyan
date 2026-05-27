"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  scale?: number;
  duration?: number;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  scale = 1,
  duration = 800,
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const directionMap = {
      up: { from: "translateY(40px)", to: "translateY(0)" },
      down: { from: "translateY(-40px)", to: "translateY(0)" },
      left: { from: "translateX(40px)", to: "translateX(0)" },
      right: { from: "translateX(-40px)", to: "translateX(0)" },
      none: { from: "translate(0)", to: "translate(0)" },
    };

    const { from } = directionMap[direction];

    el.style.opacity = "0";
    el.style.transform = `${from} scale(${scale})`;
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = `${directionMap[direction].to} scale(1)`;
            observer.unobserve(el);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction, scale, duration, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Staggered children animation
export function StaggerChildren({
  children,
  className = "",
  staggerDelay = 100,
  baseDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.children;
    Array.from(children).forEach((child, i) => {
      const htmlChild = child as HTMLElement;
      htmlChild.style.opacity = "0";
      htmlChild.style.transform = "translateY(20px)";
      htmlChild.style.transition = `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * staggerDelay}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * staggerDelay}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Array.from(children).forEach((child) => {
              const htmlChild = child as HTMLElement;
              htmlChild.style.opacity = "1";
              htmlChild.style.transform = "translateY(0)";
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [staggerDelay, baseDelay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Parallax scroll effect
export function Parallax({
  children,
  className = "",
  speed = 0.5,
  direction = "y",
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: "x" | "y";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const scrollPercent = rect.top / window.innerHeight;
      const offset = scrollPercent * speed * 100;

      if (direction === "y") {
        el.style.transform = `translateY(${offset}px)`;
      } else {
        el.style.transform = `translateX(${offset}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
