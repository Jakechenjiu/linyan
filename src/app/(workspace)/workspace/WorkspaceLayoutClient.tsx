"use client";

import WorkspaceAtmosphere from "@/components/brand/WorkspaceAtmosphere";

export default function WorkspaceLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 3D 星空背景 */}
      <WorkspaceAtmosphere />

      {/* CSS 环境光球 */}
      <div className="particle-layer" aria-hidden="true">
        <div className="ambient-orb ambient-orb-cyan" style={{ top: "5%", right: "8%" }} />
        <div className="ambient-orb ambient-orb-nebula" style={{ bottom: "8%", left: "20%" }} />
        <div className="ambient-orb ambient-orb-star" style={{ top: "45%", right: "25%" }} />
      </div>

      {/* 顶部渐暗遮罩 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,0,0,0.25), transparent 70%)",
        }}
      />

      {children}
    </>
  );
}
