"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Users, TrendingUp, FileText, Zap, BookOpen, MessageSquare } from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  actionUrl?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: "inline-ai",
    title: "内联 AI 编辑",
    description: "选中任意文字，松开鼠标即可看到改写/扩写/精简/描写按钮。结果直接替换正文。",
    icon: <Sparkles size={16} />,
    action: "试试看",
  },
  {
    id: "character-agent",
    title: "角色 Agent",
    description: "让每个角色有独立人格。AI 写对话时会参考角色的大五人格和记忆。",
    icon: <Users size={16} />,
    action: "初始化角色",
  },
  {
    id: "emotional-curve",
    title: "情感曲线",
    description: "设计章节的情绪节奏（紧张/悬念/愉悦/悲伤/反转），AI 按曲线生成内容。",
    icon: <TrendingUp size={16} />,
    action: "生成曲线",
  },
  {
    id: "editorial-board",
    title: "编辑部评审",
    description: "5 位虚拟专家（作者/编辑/主编/读者/连续性检查员）独立审阅，辩论后给出结论。",
    icon: <MessageSquare size={16} />,
    action: "开始评审",
  },
  {
    id: "export",
    title: "导出功能",
    description: "支持 TXT 和 EPUB 格式导出。EPUB 支持目录、章节分隔、中文排版。",
    icon: <FileText size={16} />,
  },
  {
    id: "quick-actions",
    title: "快捷操作",
    description: "在 AI 对话框中，点击快捷按钮可以快速执行常见操作：写下一章、检查问题、下一步建议等。",
    icon: <Zap size={16} />,
  },
];

export default function FeatureGuide({
  onAction,
}: {
  onAction?: (action: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // 检查是否已经看过引导
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("lingyan-feature-guide-seen");
    if (!hasSeenGuide) {
      // 延迟显示，让页面先加载
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("lingyan-feature-guide-seen", "true");
  };

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleAction = () => {
    const step = GUIDE_STEPS[currentStep];
    if (step.action && onAction) {
      onAction(step.id);
    }
    handleNext();
  };

  if (!visible || dismissed) return null;

  const step = GUIDE_STEPS[currentStep];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[var(--background)] border border-card-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--accent)] border-b border-card-border">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--cyan)]" />
            <span className="text-xs font-medium">功能指南</span>
            <span className="text-[9px] text-muted-foreground">
              {currentStep + 1}/{GUIDE_STEPS.length}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-[var(--background)] transition-colors"
          >
            <X size={12} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--cyan)]/10 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1 justify-center">
            {GUIDE_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-[var(--cyan)]"
                    : i < currentStep
                    ? "bg-[var(--cyan)]/50"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {step.action && (
              <button
                onClick={handleAction}
                className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all"
              >
                {step.action}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground transition-all"
            >
              {currentStep < GUIDE_STEPS.length - 1 ? "下一个" : "完成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
