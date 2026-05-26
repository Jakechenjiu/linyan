// Re-export from the provider abstraction layer.
// Prefer importing from "./video-providers" in new code.
export {
  pixelleProvider,
  getVideoProvider,
  detectAvailableProvider,
} from "./video-providers";

export type { VideoProvider, ProviderType } from "./video-providers";

// Keep old direct functions for backward compatibility
import { pixelleProvider } from "./video-providers";

export const submitClipGeneration = (params: { prompt: string; duration: number; style?: string }) =>
  pixelleProvider.generateVideo(params);

export const pollTask = (taskId: string) => {
  return pixelleProvider.pollTask(taskId);
};

export const generateVoice = (text: string, options?: { voice?: string; rate?: number }) =>
  pixelleProvider.generateVoice(text, options);

export const assembleVideo = async (params: {
  clips: { videoUrl: string; voiceUrl: string; text: string }[];
  bgmPath?: string;
  resolution?: string;
}) => {
  const PIXELLE_BASE = process.env.PIXELLE_VIDEO_URL || "http://localhost:8501";
  const res = await fetch(`${PIXELLE_BASE}/api/assemble`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clips: params.clips,
      bgm_path: params.bgmPath,
      resolution: params.resolution || "1080x1920",
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Pixelle-Video error (${res.status}): ${err.slice(0, 300)}`);
  }
  return res.json() as Promise<{ outputUrl: string }>;
};

export const pingPixelle = () => pixelleProvider.isAvailable();
