"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = svgRef.current;
    const W = svg.clientWidth || 800;
    const H = svg.clientHeight || 500;

    // Simple force-directed layout (single pass for demo)
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

    // Initialize positions in a circle
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

    // Run a few iterations of force simulation
    const iterations = 50;
    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;

      // Repulsion between all pairs
      const nodes = data.nodes;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = positions.get(nodes[i].id)!;
          const b = positions.get(nodes[j].id)!;
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

      // Attraction along edges
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

      // Center gravity
      for (const pos of positions.values()) {
        pos.vx += (cx - pos.x) * 0.005 * alpha;
        pos.vy += (cy - pos.y) * 0.005 * alpha;
      }

      // Apply velocities with damping
      for (const pos of positions.values()) {
        pos.vx *= 0.85;
        pos.vy *= 0.85;
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.x = Math.max(30, Math.min(W - 30, pos.x));
        pos.y = Math.max(20, Math.min(H - 20, pos.y));
      }
    }

    // Build SVG elements
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Draw edges
    for (const edge of data.edges) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      if (!a || !b) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      line.setAttribute("stroke", "rgba(0,229,255,0.15)");
      line.setAttribute("stroke-width", "0.5");
      g.appendChild(line);
    }

    // Draw nodes
    for (const node of data.nodes) {
      const pos = positions.get(node.id)!;
      const r = Math.max(4, Math.min(12, 4 + node.degree * 2));

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", node.degree > 0 ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.1)");
      circle.setAttribute("stroke", node.degree > 0 ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.2)");
      circle.setAttribute("stroke-width", "1");
      circle.setAttribute("cursor", "pointer");
      circle.setAttribute("data-id", node.id);
      circle.setAttribute("data-title", node.title);
      circle.setAttribute("data-tags", node.tags.join(","));

      circle.addEventListener("mouseenter", (e) => {
        const rect = svg.getBoundingClientRect();
        setTooltip({
          x: pos.x,
          y: pos.y - r - 8,
          title: node.title,
          tags: node.tags,
        });
      });
      circle.addEventListener("mouseleave", () => setTooltip(null));
      circle.addEventListener("click", () => {
        window.location.href = `/workspace/notes/${node.id}`;
      });

      // Label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(pos.x));
      text.setAttribute("y", String(pos.y + r + 12));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "rgba(255,255,255,0.6)");
      text.setAttribute("font-size", "9");
      text.setAttribute("font-family", "monospace");
      text.textContent = node.title.length > 8 ? node.title.slice(0, 8) + "…" : node.title;
      g.appendChild(circle);
      g.appendChild(text);
    }

    // Clear and append
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(g);
  }, [data]);

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        还没有笔记，创建一些笔记并添加 [[链接]] 来生成图谱
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        className="w-full rounded-xl border border-card-border bg-[var(--bg-elevated)]/50"
        style={{ height: "500px" }}
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
    </div>
  );
}
