import type { ChatMessage, ModelCall, ProviderAdapter, StreamChunk } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIAdapter implements ProviderAdapter {
  async *streamChat(opts: {
    call: ModelCall;
    system: string;
    messages: ChatMessage[];
  }): AsyncIterable<StreamChunk> {
    if (!OPENAI_API_KEY) {
      yield { type: "error", error: "OPENAI_API_KEY not configured" };
      return;
    }

    // OpenAI: system goes in the messages array as role=system
    const messages = [
      { role: "system" as const, content: opts.system },
      ...opts.messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(OPENAI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: opts.call.model,
            max_tokens: opts.call.max_tokens,
            temperature: Math.min(Math.max(opts.call.temperature, 0), 2),
            stream: true,
            messages,
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
        error: `OpenAI ${response?.status ?? "network"}: ${response ? await response.text() : "no response"}`,
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
        if (!data) continue;
        if (data === "[DONE]") {
          yield { type: "done" };
          continue;
        }
        try {
          const event = JSON.parse(data);
          const text = event.choices?.[0]?.delta?.content;
          if (text) yield { type: "delta", text };
        } catch {
          // skip
        }
      }
    }
  }

  async structuredOutput(opts: {
    call: ModelCall;
    system: string;
    messages: ChatMessage[];
  }): Promise<{ json: unknown; rawText: string }> {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const messages = [
      { role: "system" as const, content: opts.system },
      ...opts.messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(OPENAI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: opts.call.model,
            max_tokens: opts.call.max_tokens,
            temperature: Math.min(Math.max(opts.call.temperature, 0), 2),
            response_format: { type: "json_object" },
            messages,
          }),
        });
        if (response.ok) break;
        response = null;
      } catch {
        response = null;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    if (!response) throw new Error("OpenAI request failed after retries");
    if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";
    return { json: JSON.parse(rawText), rawText };
  }
}
