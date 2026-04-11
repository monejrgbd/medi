import type { ChatMessage, ModelCall, ProviderAdapter, StreamChunk } from "./types.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/**
 * Build the system field as either a plain string (no caching) or an array of
 * text blocks with a cache_control breakpoint on the stable prefix.
 *
 * Anthropic matches cache by prefix, so we split the system prompt at
 * systemCachePrefix chars: the first block is cacheable (stable base prompt),
 * the second block holds any dynamic tail (pacing notice, feature flags).
 */
function buildSystemBlocks(
  system: string,
  cachePrefix?: number
): string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> {
  if (!cachePrefix || cachePrefix <= 0) return system;

  if (cachePrefix >= system.length) {
    return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
  }

  return [
    {
      type: "text",
      text: system.slice(0, cachePrefix),
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: system.slice(cachePrefix) },
  ];
}

/**
 * Convert the incoming ChatMessage[] into Anthropic's message format with a
 * cache breakpoint on the most recent assistant turn. This lets the full
 * conversation prefix (everything up to and including the last AI response)
 * hit cache on the next turn, so only the new user message is billed at full
 * rate.
 */
function buildMessagesWithCache(messages: ChatMessage[]) {
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }

  return messages.map((m, i) => {
    if (i === lastAssistantIdx) {
      return {
        role: m.role,
        content: [
          {
            type: "text" as const,
            text: m.content,
            cache_control: { type: "ephemeral" as const },
          },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });
}

export class AnthropicAdapter implements ProviderAdapter {
  async *streamChat(opts: {
    call: ModelCall;
    system: string;
    systemCachePrefix?: number;
    messages: ChatMessage[];
  }): AsyncIterable<StreamChunk> {
    if (!ANTHROPIC_API_KEY) {
      yield { type: "error", error: "ANTHROPIC_API_KEY not configured" };
      return;
    }

    const systemBlocks = buildSystemBlocks(opts.system, opts.systemCachePrefix);
    const anthropicMessages = buildMessagesWithCache(opts.messages);

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(ANTHROPIC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: opts.call.model,
            max_tokens: opts.call.max_tokens,
            temperature: Math.min(Math.max(opts.call.temperature, 0), 1),
            system: systemBlocks,
            stream: true,
            messages: anthropicMessages,
          }),
        });
        if (response.ok) break;
        if (response.status !== 500 && response.status !== 503) break;
        response = null;
      } catch {
        response = null;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    if (!response || !response.ok) {
      yield {
        type: "error",
        error: `Anthropic ${response?.status ?? "network"}: ${response ? await response.text() : "no response"}`,
      };
      return;
    }

    const reader = response.body!.getReader();
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
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const event = JSON.parse(data);
          if (event.type === "content_block_delta" && event.delta?.text) {
            yield { type: "delta", text: event.delta.text };
          } else if (event.type === "message_stop") {
            yield { type: "done" };
          }
        } catch {
          // skip unparseable
        }
      }
    }
  }

  async structuredOutput(opts: {
    call: ModelCall;
    system: string;
    systemCachePrefix?: number;
    messages: ChatMessage[];
  }): Promise<{ json: unknown; rawText: string }> {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const systemBlocks = buildSystemBlocks(opts.system, opts.systemCachePrefix);

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(ANTHROPIC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: opts.call.model,
            max_tokens: opts.call.max_tokens,
            temperature: Math.min(Math.max(opts.call.temperature, 0), 1),
            system: systemBlocks,
            messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (response.ok) break;
        response = null;
      } catch {
        response = null;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    if (!response) throw new Error("Anthropic request failed after retries");
    if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);

    const data = await response.json();
    const rawText = data.content?.[0]?.text ?? "";
    // Strip markdown fences if the model added them
    const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/```\s*$/, "").trim();
    return { json: JSON.parse(cleaned), rawText };
  }
}
