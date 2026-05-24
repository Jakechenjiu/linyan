"use client";

import { useEffect, useRef } from "react";

export default function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const mouse = mouseRef;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouse.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; a: number; ox: number; oy: number }> = [];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({
        x, y,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        a: Math.random() * 0.6 + 0.1,
        ox: x, oy: y,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of particles) {
        // Mouse attraction
        const dxm = mx - p.x;
        const dym = my - p.y;
        const dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 200 && dm > 0) {
          const force = 0.02 * (1 - dm / 200);
          p.vx += (dxm / dm) * force;
          p.vy += (dym / dm) * force;
        }
        // Drag
        p.vx *= 0.999;
        p.vy *= 0.999;
        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) { p.vx = (p.vx / speed) * 1.5; p.vy = (p.vy / speed) * 1.5; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const glow = dm < 200 ? p.a + 0.3 * (1 - dm / 200) : p.a;
        ctx.fillStyle = `rgba(0, 229, 255, ${Math.min(1, glow)})`;
        ctx.fill();

        // Lines between nearby particles
        for (const q of particles) {
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.07 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Line to mouse
        if (dm < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.15 * (1 - dm / 180)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-layer" />;
}
