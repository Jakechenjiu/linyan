"use client";

import { useState, ReactNode } from "react";
import WorkspaceAtmosphere from "@/components/brand/WorkspaceAtmosphere";
import CursorGlow from "@/components/brand/CursorGlow";
import GlobalAI from "@/components/shared/GlobalAI";
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
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,0,0,0.25), transparent 70%)",
        }}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-[40]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      {sidebar && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-3 left-3 z-[50] p-2 rounded-lg bg-[var(--bg-elevated)] border border-card-border md:hidden"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      <div className="flex h-screen relative z-[10]">
        {/* Sidebar - desktop: static, mobile: fixed */}
        {sidebar && (
          <div
            className={`hidden md:block w-56 shrink-0 h-screen sticky top-0`}
          >
            {sidebar}
          </div>
        )}

        {/* Mobile sidebar */}
        {sidebar && (
          <div
            className={`fixed md:hidden inset-y-0 left-0 z-[45] w-56 transform transition-transform duration-300 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="h-full overflow-y-auto">
              {sidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      <GlobalAI />
    </>
  );
}
