import type { ChatMessage, ModelCall, ProviderAdapter, StreamChunk } from "./types.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicAdapter implements ProviderAdapter {
  async *streamChat(opts: {
    call: ModelCall;
    system: string;
    messages: ChatMessage[];
  }): AsyncIterable<StreamChunk> {
    if (!ANTHROPIC_API_KEY) {
      yield { type: "error", error: "ANTHROPIC_API_KEY not configured" };
      return;
    }

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
            system: opts.system,
            stream: true,
            messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
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
    messages: ChatMessage[];
  }): Promise<{ json: unknown; rawText: string }> {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

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
            system: opts.system,
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
