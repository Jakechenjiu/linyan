import { prisma } from "@/lib/db";

const DEFAULT_BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
const DEFAULT_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || "";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "deepseek-v4-pro";

const providerDefaults: Record<string, { baseUrl: string; model: string; format?: "openai" | "anthropic" }> = {
  xiaomimimo: { baseUrl: "https://token-plan-cn.xiaomimimo.com/v1", model: "mimo-v2.5-pro" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
  moonshot: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  spark: { baseUrl: "https://spark-api-open.xf-yun.com/v1", model: "generalv3.5" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  anthropic: { baseUrl: "https://api.anthropic.com", model: "claude-sonnet-4-6", format: "anthropic" },
  google: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.0-flash" },
};

// 缓存层
const configCache = new Map<string, { config: any; ts: number }>();
const CONFIG_TTL = 5 * 60_000; // 5 分钟

/** 清除用户的配置缓存（保存设置后调用） */
export function invalidateAiConfigCache(userId: string): void {
  configCache.delete(userId);
}

export async function getAiConfig(userId: string) {
  // 检查缓存
  const cached = configCache.get(userId);
  if (cached && Date.now() - cached.ts < CONFIG_TTL) {
    return cached.config;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKey: true, apiProvider: true },
  });

  const provider = user?.apiProvider || "deepseek";
  const defaults = providerDefaults[provider] || providerDefaults.deepseek;

  const apiKey = user?.apiKey || DEFAULT_API_KEY;

  const config = {
    apiKey,
    baseUrl: defaults.baseUrl,
    model: defaults.model,
    hasKey: !!apiKey,
    provider,
    format: defaults.format, // 可选：强制指定格式
  };

  // 写入缓存
  configCache.set(userId, { config, ts: Date.now() });

  return config;
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
  format?: "openai" | "anthropic"; // 可选：强制指定格式
}

// 工具调用类型
export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface AiToolCall {
  id: string;
  name: string;
  input: Record<string, string>;
}

export interface AiToolResult {
  toolCallId: string;
  name: string;
  result: string;
}

export interface AiResponseWithTools {
  text: string;
  toolCalls: AiToolCall[];
  stopReason: "end_turn" | "tool_use";
}

/**
 * Non-streaming AI call. Returns full response text.
 * Uses native API format per provider.
 */
export async function callAi(params: AiCallParams): Promise<string> {
  const { apiKey, baseUrl, model, provider, system, messages, max_tokens = 4096, temperature = 0.8, format } = params;

  // 格式检测：优先使用显式指定的格式，否则自动检测
  const isAnthropic = format === "anthropic" || (!format && (baseUrl.includes("/anthropic") || provider === "anthropic"));

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

  // 带重试的 fetch
  let response: Response | undefined;
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      if (response.ok) break;
      // 如果是认证错误，不重试
      if (response.status === 401 || response.status === 403) break;
      // 其他错误，等待后重试
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    } catch (e) {
      // 网络错误，等待后重试
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(`AI 服务连接失败 (${provider})，请稍后重试`);
    }
  }

  if (!response || !response.ok) {
    const errBody = await response?.text().catch(() => "") || "";
    console.error(`LLM error (${response?.status}):`, errBody.slice(0, 500));
    const msg = response?.status === 401 || response?.status === 403
      ? `API Key 无效 (${provider})，请检查设置中的密钥配置`
      : `AI 服务返回错误 (${response?.status})，请稍后重试`;
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
 * AI call with native tool support. Returns structured response with tool calls.
 */
export async function callAiWithTools(
  params: AiCallParams & { tools: AiTool[] }
): Promise<AiResponseWithTools> {
  const { apiKey, baseUrl, model, provider, system, messages, tools, max_tokens = 4096, temperature = 0.7, format } = params;

  // 格式检测：优先使用显式指定的格式，否则自动检测
  const isAnthropic = format === "anthropic" || (!format && (baseUrl.includes("/anthropic") || provider === "anthropic"));

  // 构建工具定义
  const toolsPayload = tools.map((t) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [name, prop] of Object.entries(t.parameters)) {
      properties[name] = { type: prop.type, description: prop.description };
      if (prop.required) required.push(name);
    }
    if (isAnthropic) {
      return {
        name: t.name,
        description: t.description,
        input_schema: { type: "object", properties, required },
      };
    }
    return {
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: { type: "object", properties, required },
      },
    };
  });

  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (isAnthropic) {
    url = `${baseUrl}/v1/messages`;
    headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
    body = {
      model,
      max_tokens,
      temperature,
      system,
      tools: toolsPayload,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
  } else {
    url = `${baseUrl}/chat/completions`;
    headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    body = {
      model,
      max_tokens,
      temperature,
      messages: [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      tools: toolsPayload,
      tool_choice: "auto",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.error(`LLM error (${response.status}):`, errBody.slice(0, 500));
    throw new Error(`AI 服务返回错误 (${response.status})`);
  }

  const data = await response.json();

  // 解析响应
  let text = "";
  const toolCalls: AiToolCall[] = [];
  let stopReason: "end_turn" | "tool_use" = "end_turn";

  if (isAnthropic) {
    // Anthropic 格式
    if (data.content) {
      for (const block of data.content) {
        if (block.type === "text") {
          text += block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }
    }
    if (data.stop_reason === "tool_use") stopReason = "tool_use";
  } else {
    // OpenAI 格式
    const msg = data.choices?.[0]?.message;
    if (msg?.content) text = msg.content;
    if (msg?.tool_calls) {
      for (const tc of msg.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }
    if (data.choices?.[0]?.finish_reason === "tool_calls") stopReason = "tool_use";
  }

  return { text, toolCalls, stopReason };
}

/**
 * Streaming AI call. Returns a ReadableStream of text chunks.
 */
export function callAiStream(params: AiCallParams): ReadableStream {
  const { apiKey, baseUrl, model, provider, system, messages, max_tokens = 4096, temperature = 0.8 } = params;

  // Auto-detect format: if baseUrl contains "/anthropic", use Anthropic format
  const isAnthropic = baseUrl.includes("/anthropic") || provider === "anthropic";

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
          signal: AbortSignal.timeout(60000), // 60秒超时
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
