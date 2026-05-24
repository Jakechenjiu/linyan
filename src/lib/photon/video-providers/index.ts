import type { VideoProvider } from "./types";
import { pixelleProvider } from "./pixelle";
import { dashscopeProvider } from "./dashscope";

export type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult } from "./types";

export type ProviderType = "dashscope" | "pixelle";

const providers: Record<ProviderType, VideoProvider> = {
  dashscope: dashscopeProvider,
  pixelle: pixelleProvider,
};

export function getVideoProvider(type: ProviderType = "dashscope"): VideoProvider {
  return providers[type];
}

export async function detectAvailableProvider(): Promise<ProviderType> {
  if (await dashscopeProvider.isAvailable()) return "dashscope";
  if (await pixelleProvider.isAvailable()) return "pixelle";
  return "dashscope"; // default, will error meaningfully when used
}

export { pixelleProvider, dashscopeProvider };
