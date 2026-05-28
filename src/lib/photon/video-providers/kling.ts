import type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult } from "./types";

const KLING_BASE = "https://api.klingai.com";

function apiPost<T>(apiKey: string, path: string, body: Record<string, unknown>): Promise<T> {
  return fetch(`${KLING_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Kling (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

function apiGet<T>(apiKey: string, path: string): Promise<T> {
  return fetch(`${KLING_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Kling (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

export function createKlingProvider(apiKeyOverride?: string): VideoProvider {
  function getApiKey(): string {
    return apiKeyOverride || process.env.KLING_API_KEY || "";
  }

  return {
    name: "kling",

    async generateVideo(params: VideoGenerateParams): Promise<TaskResult> {
      const apiKey = getApiKey();
      const data = await apiPost<{ data?: { task_id?: string }; code?: number; message?: string }>(
        apiKey,
        "/v1/videos/generations",
        {
          prompt: params.prompt,
          duration: params.duration <= 5 ? "5" : "10",
          aspect_ratio: "9:16",
          model: "kling-v1",
        }
      );
      if (!data.data?.task_id) {
        throw new Error(`Kling: ${data.message || "未返回 task_id"}`);
      }
      return { taskId: data.data.task_id };
    },

    async pollTask(taskId: string): Promise<TaskStatus> {
      const apiKey = getApiKey();
      const data = await apiGet<{ data?: { status?: string; video?: { url?: string }; fail_reason?: string } }>(
        apiKey,
        `/v1/videos/generations/${taskId}`
      );
      const status = data.data?.status;
      if (status === "succeed") {
        return { status: "completed", videoUrl: data.data?.video?.url };
      }
      if (status === "failed") {
        return { status: "failed", error: data.data?.fail_reason || "生成失败" };
      }
      return { status: "running" };
    },

    async generateVoice(text: string, options?: { voice?: string; rate?: number }): Promise<VoiceResult> {
      const apiKey = getApiKey();
      const data = await apiPost<{ data?: { audio_url?: string } }>(
        apiKey,
        "/v1/audio/speech",
        {
          input: text,
          voice: options?.voice || "alloy",
          speed: options?.rate || 1.0,
        }
      );
      if (!data.data?.audio_url) {
        throw new Error("Kling TTS: 未返回音频URL");
      }
      return { voiceUrl: data.data.audio_url };
    },

    async isAvailable(): Promise<boolean> {
      return !!getApiKey();
    },
  };
}
