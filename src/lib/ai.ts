import { prisma } from "@/lib/db";

const DEFAULT_BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
const DEFAULT_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || "";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "deepseek-v4-pro";

const providerDefaults: Record<string, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/anthropic", model: "deepseek-v4-pro" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  anthropic: { baseUrl: "https://api.anthropic.com", model: "claude-sonnet-4-6" },
};

export async function getAiConfig(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKey: true, apiProvider: true },
  });

  const provider = user?.apiProvider || "deepseek";
  const defaults = providerDefaults[provider] || providerDefaults.deepseek;

  const apiKey = user?.apiKey || DEFAULT_API_KEY;

  return {
    apiKey,
    baseUrl: defaults.baseUrl,
    model: defaults.model,
    hasKey: !!apiKey,
  };
}

export function getDefaultAiConfig() {
  return {
    apiKey: DEFAULT_API_KEY,
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  };
}
