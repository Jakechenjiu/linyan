"use client";

import { useState, useEffect, useRef } from "react";

interface CharNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface RelEdge {
  source: string;
  target: string;
  type: string;
  label: string;
}

const roleColors: Record<string, string> = {
  protagonist: "#00e5ff",
  antagonist: "#ef4444",
  love_interest: "#ec4899",
  mentor: "#f0e68c",
  supporting: "#7c3aed",
};

const edgeStyles: Record<string, { stroke: string; dash: string; width: number }> = {
  ally: { stroke: "#00e5ff", dash: "", width: 1.5 },
  enemy: { stroke: "#ef4444", dash: "6,3", width: 1.5 },
  lover: { stroke: "#ec4899", dash: "2,4", width: 2 },
  family: { stroke: "#f0e68c", dash: "", width: 2.5 },
  master_student: { stroke: "#7c3aed", dash: "3,3", width: 1.5 },
  rival: { stroke: "#f59e0b", dash: "8,4", width: 1.5 },
};

export default function CharacterGraph({ novelId }: { novelId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<CharNode[]>([]);
  const [edges, setEdges] = useState<RelEdge[]>([]);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [dimensions] = useState({ w: 600, h: 400 });

  useEffect(() => {
    fetch(`/api/novels/${novelId}`)
      .then((r) => r.json())
      .then((data) => {
        const chars: CharNode[] = data.characters?.map((c: { id: string; name: string; role: string }, i: number) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          x: Math.random() * 400 + 100,
          y: Math.random() * 250 + 50,
          vx: 0,
          vy: 0,
        })) || [];

        const rels: RelEdge[] = [];
        for (const c of data.characters || []) {
          if (c.relationships) {
            try {
              const parsed = JSON.parse(c.relationships);
              for (const r of parsed) {
                if (chars.find((n) => n.id === r.characterId)) {
                  rels.push({ source: c.id, target: r.characterId, type: r.type || "ally", label: r.label || "" });
                }
              }
            } catch {}
          }
        }
        setNodes(chars);
        setEdges(rels);
      });
  }, [novelId]);

  // Force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    let running = true;
    const simNodes = nodes.map((n) => ({ ...n }));

    const tick = () => {
      if (!running) return;
      for (let i = 0; i < 3; i++) {
        // Repulsion
        for (let a = 0; a < simNodes.length; a++) {
          for (let b = a + 1; b < simNodes.length; b++) {
            const dx = simNodes[b].x - simNodes[a].x;
            const dy = simNodes[b].y - simNodes[a].y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 800 / (d * d);
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            simNodes[a].vx -= fx;
            simNodes[a].vy -= fy;
            simNodes[b].vx += fx;
            simNodes[b].vy += fy;
          }
        }
        // Attraction along edges
        for (const e of edges) {
          const a = simNodes.findIndex((n) => n.id === e.source);
          const b = simNodes.findIndex((n) => n.id === e.target);
          if (a === -1 || b === -1) continue;
          const dx = simNodes[b].x - simNodes[a].x;
          const dy = simNodes[b].y - simNodes[a].y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (d - 120) * 0.03;
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;
          simNodes[a].vx += fx;
          simNodes[a].vy += fy;
          simNodes[b].vx -= fx;
          simNodes[b].vy -= fy;
        }
        // Center gravity + damping
        for (const n of simNodes) {
          if (dragNode === n.id) { n.vx = 0; n.vy = 0; continue; }
          n.vx += (dimensions.w / 2 - n.x) * 0.001;
          n.vy += (dimensions.h / 2 - n.y) * 0.001;
          n.vx *= 0.6;
          n.vy *= 0.6;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(40, Math.min(dimensions.w - 40, n.x));
          n.y = Math.max(20, Math.min(dimensions.h - 20, n.y));
        }
      }
      setNodes(simNodes.map((n) => ({ ...n })));
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [edges.length, dimensions]);

  const handleMouseDown = (id: string) => {
    setDragNode(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragNode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodes((prev) => prev.map((n) => (n.id === dragNode ? { ...n, x, y, vx: 0, vy: 0 } : n)));
  };

  const handleMouseUp = () => setDragNode(null);

  const connectedNodes = hoverNode
    ? new Set(edges.filter((e) => e.source === hoverNode || e.target === hoverNode).flatMap((e) => [e.source, e.target]))
    : null;

  if (nodes.length === 0) {
    return (
      <div className="space-card rounded-2xl p-12 text-center text-muted-foreground text-sm">
        还没有创建角色，请先在「角色」页面添加角色和关系
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
      className="w-full h-[400px] rounded-xl bg-[var(--bg-abyss)] border border-card-border"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        {Object.entries(edgeStyles).map(([type, style]) => (
          <marker key={type} id={`arrow-${type}`} viewBox="0 0 8 6" refX="8" refY="3" markerWidth="6" markerHeight="4" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill={style.stroke} opacity="0.6" />
          </marker>
        ))}
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const src = nodes.find((n) => n.id === e.source);
        const tgt = nodes.find((n) => n.id === e.target);
        if (!src || !tgt) return null;
        const style = edgeStyles[e.type] || edgeStyles.ally;
        const dimmed = hoverNode && !(e.source === hoverNode || e.target === hoverNode);
        return (
          <g key={i}>
            <line
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={style.stroke} strokeWidth={style.width}
              strokeDasharray={style.dash} opacity={dimmed ? 0.08 : 0.4}
              markerEnd={`url(#arrow-${e.type})`}
            />
            {e.label && !dimmed && (
              <text
                x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 - 6}
                textAnchor="middle" fill={style.stroke} fontSize="9" opacity="0.6"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const color = roleColors[n.role] || "#7c3aed";
        const dimmed = hoverNode && !connectedNodes?.has(n.id);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            onMouseDown={() => handleMouseDown(n.id)}
            onMouseEnter={() => setHoverNode(n.id)}
            onMouseLeave={() => setHoverNode(null)}
            style={{ cursor: "grab", opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s" }}
          >
            <circle r="6" fill={color} opacity="0.2" />
            <circle r="4" fill={color} />
            <text y="16" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="bold">
              {n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
