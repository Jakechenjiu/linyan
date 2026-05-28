"use client";

import { useState, ReactNode } from "react";
import WorkspaceAtmosphere from "@/components/brand/WorkspaceAtmosphere";
import CursorGlow from "@/components/brand/CursorGlow";
import { Menu, X } from "lucide-react";

export default function WorkspaceLayoutClient({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 3D 星空背景 */}
      <WorkspaceAtmosphere />

      {/* 鼠标聚光 */}
      <CursorGlow />

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

      {/* Mobile menu button */}
      {sidebar && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-[var(--bg-elevated)] border border-card-border md:hidden"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        {sidebar && (
          <div
            className={`
              fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300
              ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <div onClick={() => setMobileMenuOpen(false)}>
              {sidebar}
            </div>
          </div>
        )}

        {children}
      </div>
    </>
  );
}
