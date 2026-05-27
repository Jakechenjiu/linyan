"use client";

import { useRef, ReactNode, MouseEvent } from "react";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  tiltAmount?: number;
  scaleOnHover?: number;
}

export default function InteractiveCard({
  children,
  className = "",
  glowColor = "rgba(0, 229, 255, 0.15)",
  tiltAmount = 5,
  scaleOnHover = 1.02,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltAmount;
    const rotateY = ((x - centerX) / centerX) * tiltAmount;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`;
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  };

  return (
    <div
      ref={cardRef}
      className={`interactive-card relative overflow-hidden transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glow effect following cursor */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${glowColor}, transparent 60%)`,
          opacity: 1,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Magnetic button effect
export function MagneticButton({
  children,
  className = "",
  onClick,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    const button = buttonRef.current;
    if (!button) return;
    button.style.transform = "translate(0, 0)";
  };

  return (
    <button
      ref={buttonRef}
      className={`magnetic-btn transition-transform duration-200 ease-out ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
