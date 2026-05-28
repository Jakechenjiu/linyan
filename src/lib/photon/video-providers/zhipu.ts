import type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult } from "./types";

const ZHIPU_BASE = "https://open.bigmodel.cn/api/paas/v4";

function apiPost<T>(apiKey: string, path: string, body: Record<string, unknown>): Promise<T> {
  return fetch(`${ZHIPU_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Zhipu (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

function apiGet<T>(apiKey: string, path: string): Promise<T> {
  return fetch(`${ZHIPU_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Zhipu (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

export function createZhipuProvider(apiKeyOverride?: string): VideoProvider {
  function getApiKey(): string {
    return apiKeyOverride || process.env.ZHIPU_API_KEY || "";
  }

  return {
    name: "zhipu",

    async generateVideo(params: VideoGenerateParams): Promise<TaskResult> {
      const apiKey = getApiKey();
      const data = await apiPost<{ id?: string; error?: { message?: string } }>(
        apiKey,
        "/videos/generations",
        {
          model: "cogvideox",
          prompt: params.prompt,
          duration: Math.min(params.duration, 6),
          size: "1080x1920",
        }
      );
      if (!data.id) {
        throw new Error(`Zhipu: ${data.error?.message || "未返回任务ID"}`);
      }
      return { taskId: data.id };
    },

    async pollTask(taskId: string): Promise<TaskStatus> {
      const apiKey = getApiKey();
      const data = await apiGet<{ status?: string; video_result?: { url?: string }[]; error?: { message?: string } }>(
        apiKey,
        `/videos/generations/${taskId}`
      );
      if (data.status === "SUCCESS") {
        const videoUrl = data.video_result?.[0]?.url;
        return { status: "completed", videoUrl };
      }
      if (data.status === "FAIL") {
        return { status: "failed", error: data.error?.message || "生成失败" };
      }
      return { status: "running" };
    },

    async generateVoice(text: string, options?: { voice?: string; rate?: number }): Promise<VoiceResult> {
      const apiKey = getApiKey();
      const data = await apiPost<{ data?: { audio_url?: string } }>(
        apiKey,
        "/audio/speech",
        {
          input: text,
          voice: options?.voice || "alloy",
          speed: options?.rate || 1.0,
        }
      );
      if (!data.data?.audio_url) {
        throw new Error("Zhipu TTS: 未返回音频URL");
      }
      return { voiceUrl: data.data.audio_url };
    },

    async isAvailable(): Promise<boolean> {
      return !!getApiKey();
    },
  };
}
