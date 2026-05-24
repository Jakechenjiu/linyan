import type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult } from "./types";

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com";

function apiPost<T>(apiKey: string, path: string, body: Record<string, unknown>, extraHeaders?: Record<string, string>): Promise<T> {
  return fetch(`${DASHSCOPE_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`DashScope error (${res.status}):`, err.slice(0, 500));
      if (res.status === 401 || res.status === 403) {
        throw new Error(`DashScope API Key 无效 (${res.status}): ${err.slice(0, 200)}`);
      }
      throw new Error(`DashScope (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

function apiGet<T>(apiKey: string, path: string): Promise<T> {
  return fetch(`${DASHSCOPE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`DashScope (${res.status}): ${err.slice(0, 300)}`);
    }
    return res.json();
  });
}

export function createDashscopeProvider(apiKeyOverride?: string): VideoProvider {
  function getApiKey(): string {
    return apiKeyOverride || process.env.DASHSCOPE_API_KEY || "";
  }

  return {
    name: "dashscope",

    async generateVideo(params: VideoGenerateParams): Promise<TaskResult> {
      const apiKey = getApiKey();
      const data = await apiPost<{ output?: { task_id?: string }; code?: string; message?: string }>(
        apiKey,
        "/api/v1/services/aigc/video-generation/video-synthesis",
        {
          model: "wan2.6-t2v",
          input: { prompt: params.prompt },
          parameters: {
            duration: Math.min(params.duration, 15),
            size: params.resolution || "1080*1920",
            prompt_extend: true,
          },
        },
        { "X-DashScope-Async": "enable" }
      );
      if (data.code && data.code !== "OK") {
        throw new Error(data.message || "DashScope video generation failed");
      }
      const taskId = data.output?.task_id;
      if (!taskId) throw new Error("DashScope: no task_id in response");
      return { taskId };
    },

    async pollTask(taskId: string): Promise<TaskStatus> {
      const apiKey = getApiKey();
      for (let i = 0; i < 120; i++) {
        const data = await apiGet<{
          output?: { task_status?: string; video_url?: string; message?: string };
        }>(apiKey, `/api/v1/tasks/${taskId}`);

        const status = data.output?.task_status;
        if (status === "SUCCEEDED") {
          return {
            status: "completed",
            videoUrl: data.output?.video_url,
          };
        }
        if (status === "FAILED" || status === "CANCELED") {
          return {
            status: "failed",
            error: data.output?.message || "Video generation failed",
          };
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
      throw new Error(`DashScope task ${taskId} timed out`);
    },

    async generateVoice(text: string, options?: { voice?: string }): Promise<VoiceResult> {
      const apiKey = getApiKey();
      const res = await fetch(`${DASHSCOPE_BASE}/api/v1/services/aigc/tts/speech-synthesizer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-tts",
          input: { text },
          parameters: {
            voice: options?.voice || "longxiaoxia_v2",
            format: "mp3",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`DashScope TTS (${res.status}): ${err.slice(0, 200)}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.output?.audio_url) {
          return { voiceUrl: data.output.audio_url };
        }
        throw new Error("DashScope TTS: no audio in response");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const fs = await import("fs/promises");
      const path = await import("path");
      const tmpDir = path.join(process.cwd(), "public", "tmp", "voice");
      await fs.mkdir(tmpDir, { recursive: true });
      const fileName = `tts-${Date.now()}.mp3`;
      await fs.writeFile(path.join(tmpDir, fileName), buffer);
      return { voiceUrl: `/tmp/voice/${fileName}` };
    },

    async isAvailable(): Promise<boolean> {
      return !!getApiKey();
    },
  };
}

// Default singleton (env-only, for backward compat)
export const dashscopeProvider = createDashscopeProvider();
