"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; r: number; a: number;
  phase: number; speed: number;
}

interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number;
  a: number;
}

export default function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initStars();
      initParticles();
    };

    // —— Static starfield background ——
    const initStars = () => {
      const count = Math.floor((w * h) / 2800);
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.003,
      }));
    };

    // —— Floating interactive particles ——
    const initParticles = () => {
      const count = Math.min(70, Math.floor((w * h) / 20000));
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        a: Math.random() * 0.5 + 0.1,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // —— Layer 1: Twinkling stars ——
      for (const s of starsRef.current) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const alpha = s.a * (0.6 + 0.4 * twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (1 + twinkle * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${alpha.toFixed(3)})`;
        ctx.fill();

        // Brighter core for larger stars
        if (s.r > 1 && twinkle > 0.8) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,229,255,${(alpha * 0.25).toFixed(3)})`;
          ctx.fill();
        }
      }

      // —— Layer 2: Interactive particles ——
      for (const p of particlesRef.current) {
        const dxm = mx - p.x;
        const dym = my - p.y;
        const dm = Math.sqrt(dxm * dxm + dym * dym);

        // Mouse attraction
        if (dm < 220 && dm > 0) {
          const force = 0.018 * (1 - dm / 220);
          p.vx += (dxm / dm) * force;
          p.vy += (dym / dm) * force;
        }

        p.vx *= 0.999;
        p.vy *= 0.999;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.4) { p.vx = (p.vx / speed) * 1.4; p.vy = (p.vy / speed) * 1.4; }

        const glow = dm < 220 ? p.a + 0.35 * (1 - dm / 220) : p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${Math.min(1, glow).toFixed(3)})`;
        ctx.fill();

        // Connecting lines
        for (const q of particlesRef.current) {
          if (q === p) continue;
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,229,255,${(0.06 * (1 - d / 140)).toFixed(3)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }

        // Line to mouse
        if (dm < 200) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(124,58,237,${(0.12 * (1 - dm / 200)).toFixed(3)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Ambient light orbs */}
      <div className="particle-layer" aria-hidden="true">
        <div className="ambient-orb ambient-orb-cyan" style={{ top: "8%", left: "60%" }} />
        <div className="ambient-orb ambient-orb-nebula" style={{ top: "55%", left: "25%" }} />
        <div className="ambient-orb ambient-orb-star" style={{ top: "70%", left: "70%" }} />
      </div>
      <canvas ref={canvasRef} className="particle-layer" aria-hidden="true" />
    </>
  );
}
