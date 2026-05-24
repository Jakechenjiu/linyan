import Link from "next/link";
import { FileText, ArrowRight, Sparkles } from "lucide-react";
import { loadBuiltInTemplates } from "@/lib/templates";

export default function TemplatesPage() {
  const templates = loadBuiltInTemplates();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">模板工坊</h1>
        <p className="text-sm text-muted-foreground mt-1">选择模板，一键生成多平台内容</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((tmpl) => (
          <Link
            key={tmpl.id}
            href={`/workspace/photon/batch?template=${tmpl.id}`}
            className="space-card group rounded-xl p-5"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--cyan-soft)", color: "var(--cyan)" }}
              >
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-mono font-bold text-sm mb-1 group-hover:text-[var(--cyan)] transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{tmpl.description}</p>
                {tmpl.platforms && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tmpl.platforms.map((p: string) => (
                      <span
                        key={p}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 text-muted-foreground group-hover:text-[var(--cyan)] group-hover:translate-x-1 transition-all mt-1"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--cyan)]" />
          自定义生成
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          不使用模板，直接输入主题和需求，AI 将为你生成内容
        </p>
        <Link
          href="/workspace/photon/batch"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          开始自定义 <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
