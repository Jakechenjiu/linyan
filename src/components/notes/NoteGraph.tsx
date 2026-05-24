"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Node {
  id: string;
  title: string;
  tags: string[];
  degree: number;
}

interface Edge {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export default function NoteGraph({ data }: { data: GraphData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; tags: string[] } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const W = 800;
  const H = 500;
  const gRef = useRef<SVGGElement | null>(null);

  // Rebuild graph when data changes
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = svgRef.current;
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.35;
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length - Math.PI / 2;
      positions.set(node.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });

    const iterations = 50;
    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;
      for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
          const a = positions.get(data.nodes[i].id)!;
          const b = positions.get(data.nodes[j].id)!;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const force = (200 * alpha) / (dist * dist);
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          a.vx -= dx;
          a.vy -= dy;
          b.vx += dx;
          b.vy += dy;
        }
      }
      for (const edge of data.edges) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 80) * 0.02 * alpha;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
      for (const pos of positions.values()) {
        pos.vx += (cx - pos.x) * 0.005 * alpha;
        pos.vy += (cy - pos.y) * 0.005 * alpha;
      }
      for (const pos of positions.values()) {
        pos.vx *= 0.85;
        pos.vy *= 0.85;
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.x = Math.max(30, Math.min(W - 30, pos.x));
        pos.y = Math.max(20, Math.min(H - 20, pos.y));
      }
    }

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gRef.current = g;

    for (const edge of data.edges) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      if (!a || !b) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      line.setAttribute("stroke", "rgba(0,229,255,0.12)");
      line.setAttribute("stroke-width", "0.5");
      g.appendChild(line);
    }

    // Glow defs
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "node-glow");
    filter.innerHTML = '<feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>';
    defs.appendChild(filter);
    g.appendChild(defs);

    for (const node of data.nodes) {
      const pos = positions.get(node.id)!;
      const r = Math.max(4, Math.min(12, 4 + node.degree * 2));

      // Glow ring (hidden by default)
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("cx", String(pos.x));
      glow.setAttribute("cy", String(pos.y));
      glow.setAttribute("r", String(r * 2));
      glow.setAttribute("fill", "rgba(0,229,255,0.06)");
      glow.setAttribute("stroke", "rgba(0,229,255,0.15)");
      glow.setAttribute("stroke-width", "1");
      glow.setAttribute("opacity", "0");
      glow.setAttribute("data-glow", node.id);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", node.degree > 0 ? "rgba(0,229,255,0.35)" : "rgba(255,255,255,0.08)");
      circle.setAttribute("stroke", node.degree > 0 ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.12)");
      circle.setAttribute("stroke-width", "1");
      circle.setAttribute("cursor", "pointer");
      circle.setAttribute("data-id", node.id);
      circle.setAttribute("data-glow-ref", node.id);

      const handleEnter = () => {
        glow.setAttribute("opacity", "1");
        setTooltip({ x: pos.x, y: pos.y - r - 8, title: node.title, tags: node.tags });
      };
      circle.addEventListener("mouseenter", handleEnter);
      glow.addEventListener("mouseenter", handleEnter);
      circle.addEventListener("mouseleave", () => {
        glow.setAttribute("opacity", "0");
        setTooltip(null);
      });
      glow.addEventListener("mouseleave", () => {
        glow.setAttribute("opacity", "0");
        setTooltip(null);
      });
      circle.addEventListener("click", () => {
        window.location.href = `/workspace/notes/${node.id}`;
      });

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(pos.x));
      text.setAttribute("y", String(pos.y + r + 12));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "rgba(255,255,255,0.5)");
      text.setAttribute("font-size", "9");
      text.setAttribute("font-family", "monospace");
      text.textContent = node.title.length > 16 ? node.title.slice(0, 16) + "…" : node.title;

      g.appendChild(glow);
      g.appendChild(circle);
      g.appendChild(text);
    }

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(g);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [data]);

  // Zoom & Pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.3, Math.min(3, scale * factor));
    const newX = mx - (mx - offset.x) * (newScale / scale);
    const newY = my - (my - offset.y) * (newScale / scale);
    setScale(newScale);
    setOffset({ x: newX, y: newY });
  }, [scale, offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === "svg") {
      panning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    panning.current = false;
  }, []);

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        还没有笔记，创建一些笔记并添加 [[链接]] 来生成图谱
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-card-border bg-[var(--bg-elevated)]/50 select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{
          height: "500px",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none px-2 py-1 rounded text-[10px] bg-[var(--bg-elevated)] border border-card-border shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          <div className="font-medium text-[var(--cyan)]">{tooltip.title}</div>
          {tooltip.tags.length > 0 && tooltip.tags[0] && (
            <div className="text-muted-foreground">{tooltip.tags.map((t) => `#${t}`).join(" ")}</div>
          )}
        </div>
      )}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 bg-[var(--bg-elevated)]/80 px-2 py-0.5 rounded">
        滚轮缩放 · 拖拽平移
      </div>
    </div>
  );
}
