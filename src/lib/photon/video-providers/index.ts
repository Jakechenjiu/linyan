import type { VideoProvider, VideoProviderOptions } from "./types";
import { pixelleProvider } from "./pixelle";
import { createDashscopeProvider, dashscopeProvider } from "./dashscope";

export type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult, VideoProviderOptions } from "./types";

export type ProviderType = "dashscope" | "pixelle";

export function getVideoProvider(type: ProviderType = "dashscope", options?: VideoProviderOptions): VideoProvider {
  if (type === "dashscope") {
    return createDashscopeProvider(options?.apiKey);
  }
  return pixelleProvider;
}

export async function detectAvailableProvider(options?: VideoProviderOptions): Promise<ProviderType> {
  if (await getVideoProvider("dashscope", options).isAvailable()) return "dashscope";
  if (await pixelleProvider.isAvailable()) return "pixelle";
  return "dashscope";
}

export { pixelleProvider, dashscopeProvider, createDashscopeProvider };
