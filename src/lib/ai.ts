import { prisma } from "@/lib/db";

const DEFAULT_BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
const DEFAULT_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || "";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "deepseek-v4-pro";

const providerDefaults: Record<string, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
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
    provider,
  };
}

export function getDefaultAiConfig() {
  return {
    apiKey: DEFAULT_API_KEY,
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  };
}

// --- Unified AI call helpers ---

interface AiMessage {
  role: string;
  content: string;
}

interface AiCallParams {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
  system: string;
  messages: AiMessage[];
  max_tokens?: number;
  temperature?: number;
}

/**
 * Non-streaming AI call. Returns full response text.
 * Uses native API format per provider.
 */
export async function callAi(params: AiCallParams): Promise<string> {
  const { apiKey, baseUrl, model, provider, system, messages, max_tokens = 4096, temperature = 0.8 } = params;

  const isAnthropic = provider === "anthropic";

  const url = isAnthropic
    ? `${baseUrl}/v1/messages`
    : `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let body: Record<string, unknown>;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model,
      max_tokens,
      temperature,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    const chatMessages = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    body = {
      model,
      max_tokens,
      temperature,
      messages: chatMessages,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.error(`LLM error (${response.status}):`, errBody.slice(0, 500));
    const msg = response.status === 401 || response.status === 403
      ? "API Key 无效，请检查设置中的密钥配置"
      : `AI 服务返回错误 (${response.status})，请稍后重试`;
    throw new Error(msg);
  }

  const data = await response.json();

  // Parse response based on format
  let content = "";
  if (data.content?.[0]?.text) {
    // Anthropic format
    content = data.content[0].text;
  } else if (data.choices?.[0]?.message?.content) {
    // OpenAI format
    content = data.choices[0].message.content;
  }

  if (!content) {
    console.error("Empty LLM response, keys:", Object.keys(data));
    throw new Error("AI 返回了空内容，请重试。如果持续出现，请检查 API 配置。");
  }

  return content;
}

/**
 * Streaming AI call. Returns a ReadableStream of text chunks.
 */
export function callAiStream(params: AiCallParams): ReadableStream {
  const { apiKey, baseUrl, model, provider, system, messages, max_tokens = 4096, temperature = 0.8 } = params;

  const isAnthropic = provider === "anthropic";

  const url = isAnthropic
    ? `${baseUrl}/v1/messages`
    : `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let body: Record<string, unknown>;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model,
      max_tokens,
      temperature,
      stream: true,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    const chatMessages = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    body = {
      model,
      max_tokens,
      temperature,
      stream: true,
      messages: chatMessages,
    };
  }

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          console.error(`LLM stream error (${response.status}):`, errBody.slice(0, 500));
          const msg = response.status === 401 || response.status === 403
            ? "API Key 无效，请检查设置中的密钥配置"
            : `AI 服务返回错误 (${response.status})，请稍后重试`;
          controller.enqueue(encoder.encode(`[ERROR] ${msg}`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;

            try {
              const parsed = JSON.parse(raw);

              if (isAnthropic) {
                // Anthropic SSE: type: "content_block_delta", delta.text
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } else {
                // OpenAI SSE: choices[0].delta.content
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
        controller.close();
      } catch (e) {
        console.error("Stream error:", e);
        controller.enqueue(encoder.encode(`[ERROR] 流式请求失败: ${e instanceof Error ? e.message : "未知错误"}`));
        controller.close();
      }
    },
  });
}
