import type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult } from "./types";

const PIXELLE_BASE = process.env.PIXELLE_VIDEO_URL || "http://localhost:8501";

async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PIXELLE_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Pixelle-Video error (${res.status}): ${err.slice(0, 300)}`);
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PIXELLE_BASE}${path}`);
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Pixelle-Video error (${res.status}): ${err.slice(0, 300)}`);
  }
  return res.json();
}

export const pixelleProvider: VideoProvider = {
  name: "pixelle",

  async generateVideo(params: VideoGenerateParams): Promise<TaskResult> {
    return apiPost<TaskResult>("/api/generate/video", {
      prompt: params.prompt,
      duration: params.duration,
      style: params.style || "realistic",
      model: "wan-2.2-ti2v-5b",
      resolution: params.resolution || "1080x1920",
    });
  },

  async pollTask(taskId: string): Promise<TaskStatus> {
    let lastStatus: TaskStatus | null = null;
    for (let i = 0; i < 240; i++) {
      const s = await apiGet<TaskStatus>(`/api/task/${taskId}`);
      if (s.status === "completed" || s.status === "failed") return s;
      lastStatus = s;
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error(`Task ${taskId} timed out (${JSON.stringify(lastStatus)})`);
  },

  async generateVoice(text: string, options?: { voice?: string; rate?: number }): Promise<VoiceResult> {
    return apiPost<VoiceResult>("/api/generate/voice", {
      text,
      voice: options?.voice || "zh-CN-XiaoxiaoNeural",
      rate: options?.rate || 0,
    });
  },

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${PIXELLE_BASE}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return false;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return false;
      const body = await res.json().catch(() => null);
      return body?.service === "pixelle-video";
    } catch {
      return false;
    }
  },
};
