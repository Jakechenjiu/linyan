"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe, Users, ListTree } from "lucide-react";
import WizardStep1Basic from "./WizardStep1Basic";
import WizardStep2World from "./WizardStep2World";
import WizardStep3Character from "./WizardStep3Character";
import WizardStep4Outline from "./WizardStep4Outline";

export interface WizardData {
  // Step 1: Basic
  title: string;
  genre: string;
  synopsis: string;
  targetWordCount: number;
  // Step 2: World
  worldTemplate: string;
  worldType: string;
  scale: string;
  powerSystem: string;
  geography: string;
  factions: string;
  rules: string;
  // Step 3: Characters
  protagonist: { name: string; tagline: string; desire: string; flaw: string; goldenFinger: string };
  antagonist: { name: string; tagline: string; role: string; conflict: string };
  // Step 4: Outline
  volumes: { title: string; chapterCount: number; summary: string }[];
  openingHook: string;
}

const defaultWizardData: WizardData = {
  title: "",
  genre: "xuanhuan",
  synopsis: "",
  targetWordCount: 100000,
  worldTemplate: "",
  worldType: "",
  scale: "",
  powerSystem: "",
  geography: "",
  factions: "",
  rules: "",
  protagonist: { name: "", tagline: "", desire: "", flaw: "", goldenFinger: "" },
  antagonist: { name: "", tagline: "", role: "", conflict: "" },
  volumes: [{ title: "第一卷", chapterCount: 10, summary: "" }],
  openingHook: "",
};

const steps = [
  { id: 1, label: "基本信息", icon: BookOpen },
  { id: 2, label: "世界观", icon: Globe },
  { id: 3, label: "角色设计", icon: Users },
  { id: 4, label: "大纲预设", icon: ListTree },
];

export default function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>(defaultWizardData);

  const update = (partial: Partial<WizardData>) => setData((prev) => ({ ...prev, ...partial }));

  const canNext = () => {
    if (step === 1) return data.title.trim().length > 0 && data.genre.length > 0;
    if (step === 2) return true; // all optional
    if (step === 3) return data.protagonist.name.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/novels/create-with-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const novel = await res.json();
      router.push(`/workspace/star/${novel.id}`);
    } catch (e) {
      console.error("Create failed:", e);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => { if (s.id < step) setStep(s.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                s.id === step
                  ? "bg-[var(--cyan)] text-[#0a0e17]"
                  : s.id < step
                    ? "bg-[var(--cyan-soft)] text-[var(--cyan)] cursor-pointer"
                    : "text-muted-foreground cursor-default"
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${s.id < step ? "bg-[var(--cyan)]" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="space-card rounded-2xl p-8 min-h-[400px]">
        {step === 1 && <WizardStep1Basic data={data} update={update} />}
        {step === 2 && <WizardStep2World data={data} update={update} />}
        {step === 3 && <WizardStep3Character data={data} update={update} />}
        {step === 4 && <WizardStep4Outline data={data} update={update} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-all disabled:opacity-30"
        >
          ← 上一步
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={!canNext()}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-30"
            style={{ color: "#0a0e17" }}
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
            style={{ color: "#0a0e17" }}
          >
            {submitting ? "正在创建…" : "确认创建"}
          </button>
        )}
      </div>
    </div>
  );
}
