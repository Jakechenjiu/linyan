"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";

interface Props {
  type: "notes" | "novel" | "content" | "seed";
  accept: string;
  multiple?: boolean;
  label?: string;
  variant?: "button" | "text";
  onSeedContent?: (content: string) => void;
}

export default function ImportButton({
  type,
  accept,
  multiple = false,
  label = "导入",
  variant = "button",
  onSeedContent,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append("files", fileList[i]);
    }

    try {
      const res = await fetch(`/api/import?type=${type}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "导入失败");
        return;
      }

      if (type === "seed" && onSeedContent && data.content) {
        onSeedContent(data.content);
      }

      setStatus("success");
      const count = data.count || 0;
      setMessage(count > 0 ? `成功导入 ${count} 项` : "未识别到有效内容");
      router.refresh();

      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch {
      setStatus("error");
      setMessage("网络错误，请重试");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    }

    // Reset input so same file can be re-imported
    if (inputRef.current) inputRef.current.value = "";
  };

  if (variant === "text") {
    return (
      <>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />
        <button type="button" onClick={handleClick} disabled={status === "uploading"} className="text-xs text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          {status === "uploading" ? <Loader2 size={12} className="animate-spin inline" /> : <Upload size={12} className="inline" />}
          {" "}{label}
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />

      {status === "error" ? (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {message}
        </span>
      ) : status === "success" ? (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <Check size={12} />
          {message}
        </span>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={status === "uploading"}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-card-border hover:border-[var(--cyan)]/30 hover:bg-[var(--accent)] transition-all disabled:opacity-50"
      >
        {status === "uploading" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Upload size={12} />
        )}
        {label}
      </button>
    </>
  );
}
