import type { VideoProvider, VideoProviderOptions } from "./types";
import { pixelleProvider } from "./pixelle";
import { createDashscopeProvider, dashscopeProvider } from "./dashscope";
import { createKlingProvider } from "./kling";
import { createZhipuProvider } from "./zhipu";

export type { VideoProvider, VideoGenerateParams, TaskResult, TaskStatus, VoiceResult, VideoProviderOptions } from "./types";

export type ProviderType = "dashscope" | "kling" | "zhipu" | "pixelle";

export function getVideoProvider(type: ProviderType = "dashscope", options?: VideoProviderOptions): VideoProvider {
  switch (type) {
    case "dashscope":
      return createDashscopeProvider(options?.apiKey);
    case "kling":
      return createKlingProvider(options?.apiKey);
    case "zhipu":
      return createZhipuProvider(options?.apiKey);
    case "pixelle":
      return pixelleProvider;
    default:
      return createDashscopeProvider(options?.apiKey);
  }
}

export async function detectAvailableProvider(options?: VideoProviderOptions): Promise<ProviderType> {
  if (await getVideoProvider("dashscope", options).isAvailable()) return "dashscope";
  if (await getVideoProvider("kling", options).isAvailable()) return "kling";
  if (await getVideoProvider("zhipu", options).isAvailable()) return "zhipu";
  if (await pixelleProvider.isAvailable()) return "pixelle";
  return "dashscope";
}

export { pixelleProvider, dashscopeProvider, createDashscopeProvider, createKlingProvider, createZhipuProvider };
