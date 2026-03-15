import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
// Dynamic CORS: echo the request Origin so embedded widgets on clinic sites work.
// These endpoints are session-token-gated (not cookie-gated), so origin-echoing is safe.
function corsHeaders(req?: Request) {
  const origin = req?.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "false",
  };
}

// Urgency keywords
const HIGH_URGENCY = [
  "chest pain", "difficulty breathing", "severe bleeding",
  "stroke", "loss of consciousness", "suicidal", "suicide",
  "can't breathe", "cannot breathe", "heart attack",
];
const MEDIUM_URGENCY = [
  "high fever", "fever over 103", "pain 7", "pain 8", "pain 9", "pain 10",
  "infection", "persistent vomiting", "head injury", "concussion",
];

// Sensitive topic keywords
const SENSITIVE_TOPICS = [
  "mental health", "depression", "anxiety", "substance use", "drug use",
  "alcohol", "sexual health", "domestic violence", "abuse", "self-harm",
  "eating disorder", "trauma", "ptsd",
];

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

// Inline Google Translate helpers (avoid extra network hop for latency-sensitive chat)
async function googleTranslateText(text: string, target: string, source?: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = new URL("https://translation.googleapis.com/language/translate/v2");
    url.searchParams.set("key", GOOGLE_API_KEY);
    const body: Record<string, string> = { q: text, target, format: "text" };
    if (source) body.source = source;
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.translations[0].translatedText;
  } catch {
    return null;
  }
}

async function googleDetectLanguage(text: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = new URL("https://translation.googleapis.com/language/translate/v2/detect");
    url.searchParams.set("key", GOOGLE_API_KEY);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.detections[0][0].language;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    const body = await req.json();
    const { visit_id, session_token, patient_message, language } = body;
    const patientLanguage: string = language || "en";

    // Validate required fields
    if (!visit_id || !session_token || !patient_message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Strip HTML and enforce 5000-char limit
    let cleanMessage = stripHtml(patient_message);
    if (!cleanMessage) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }
    cleanMessage = cleanMessage.substring(0, 5000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate session via get_patient_session
    const { data: sessionData } = await supabase.rpc("get_patient_session", {
      p_session_token: session_token,
    });

    if (!sessionData?.success) {
      return new Response(
        JSON.stringify({ error: sessionData?.error || "Invalid session" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (sessionData.visit_id !== visit_id) {
      return new Response(
        JSON.stringify({ error: "Session mismatch" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (sessionData.status !== "still_answering_ai") {
      return new Response(
        JSON.stringify({ error: "Visit is not in AI conversation state" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Fetch visit + location data once (reused for credits + model selection)
    const { data: visitRow } = await supabase
      .from("visits")
      .select("org_id, location_id")
      .eq("id", visit_id)
      .single();

    if (!visitRow) {
      return new Response(
        JSON.stringify({ error: "Visit not found" }),
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { data: locationRow } = await supabase
      .from("locations")
      .select("ai_model")
      .eq("id", visitRow.location_id)
      .single();

    const aiModel = locationRow?.ai_model || "standard";

    // Load conversation before storing message (for credit check + rate limit)
    const { data: convData } = await supabase.rpc("get_conversation", {
      p_visit_id: visit_id,
    });

    if (!convData?.success) {
      return new Response(
        JSON.stringify({ error: "Failed to load conversation" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const existingMessages = convData.messages || [];

    // Rate limit: count existing patient messages
    const existingPatientCount = existingMessages.filter(
      (m: { role: string }) => m.role === "patient"
    ).length;

    if (existingPatientCount >= 30) {
      return new Response(
        JSON.stringify({ error: "message_limit_reached" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Credit deduction on first patient message — before storing to avoid dangling messages
    if (existingPatientCount === 0) {
      const { data: creditResult } = await supabase.rpc("deduct_credits", {
        p_org_id: visitRow.org_id,
        p_visit_id: visit_id,
        p_ai_model: aiModel,
      });

      if (!creditResult?.success && creditResult?.error === "no_credits") {
        return new Response(
          JSON.stringify({ error: "no_credits" }),
          { status: 402, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Translation: if non-English, detect and translate patient message to English
    let englishMessage = cleanMessage;
    const originalMessage = cleanMessage;
    let translationFailed = false;

    if (patientLanguage !== "en") {
      const detectedLang = await googleDetectLanguage(cleanMessage);
      if (detectedLang && detectedLang !== "en") {
        const translated = await googleTranslateText(cleanMessage, "en", detectedLang);
        if (translated) {
          englishMessage = translated;
        } else {
          translationFailed = true;
        }
      }
      // If detected as English or detection failed, use original (bilingual patient typed in English)
    }

    // Store patient message via RPC (validates session_token + status again)
    // content = English (for doctors), content_original = what patient typed (their language)
    // When translation failed, prefix content so doctors know it's untranslated
    const storedContent = translationFailed
      ? `[Translation unavailable] ${englishMessage}`
      : englishMessage;
    const { data: sendResult } = await supabase.rpc("send_patient_message", {
      p_visit_id: visit_id,
      p_session_token: session_token,
      p_content: storedContent,
      p_content_original: patientLanguage !== "en" ? originalMessage : null,
    });

    if (!sendResult?.success) {
      return new Response(
        JSON.stringify({ error: sendResult?.error || "Failed to store message" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Append patient message to existing conversation (avoid re-fetching)
    // Use English message for Claude context
    const allMessages = [...existingMessages, { role: "patient", content: englishMessage }];
    const patientMessageCount = existingPatientCount + 1;

    // Build Claude messages array
    let systemPrompt = "";
    const claudeMessages: Array<{ role: string; content: string }> = [];

    let systemMessageIndex = 0;
    for (const msg of allMessages) {
      if (msg.role === "system") {
        if (systemMessageIndex === 0) {
          // First system message is the cached prompt
          systemPrompt = msg.content;
        } else if (systemMessageIndex >= 2) {
          // System hints (e.g. rejection continuation) — send as user message so AI sees them
          claudeMessages.push({
            role: "user",
            content: `<system_instruction>${msg.content}</system_instruction>`,
          });
        }
        // systemMessageIndex === 1 is the greeting — skip from Claude messages
        systemMessageIndex++;
        continue;
      }

      if (msg.role === "patient") {
        claudeMessages.push({
          role: "user",
          content: `<user_message>${msg.content}</user_message>`,
        });
      } else if (msg.role === "ai") {
        claudeMessages.push({
          role: "assistant",
          content: msg.content,
        });
      }
    }

    const claudeModel = aiModel === "advanced"
      ? "claude-opus-4-20250514"
      : "claude-sonnet-4-20250514";

    // Call Claude API with streaming
    let claudeResponse: Response | null = null;
    let retries = 0;

    while (retries < 3) {
      try {
        claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 1024,
            system: systemPrompt,
            stream: true,
            messages: claudeMessages,
          }),
        });

        if (claudeResponse.ok) break;

        if (claudeResponse.status === 500 || claudeResponse.status === 503) {
          retries++;
          if (retries < 3) {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
        } else {
          break;
        }
      } catch {
        retries++;
        if (retries < 3) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
        }
      }
    }

    if (!claudeResponse || !claudeResponse.ok) {
      // Move to queue with proper status guard (only transitions from still_answering_ai)
      await supabase.rpc("move_to_queue_on_error", {
        p_visit_id: visit_id,
        p_session_token: session_token,
      });

      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 503, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Stream SSE response to client
    let accumulatedText = "";
    const isNonEnglish = patientLanguage !== "en";

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process Claude stream in background
    (async () => {
      try {
        const reader = claudeResponse!.body!.getReader();
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
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "content_block_delta" && event.delta?.text) {
                accumulatedText += event.delta.text;
                // For non-English: buffer text, don't stream deltas (translate after completion)
                // For English: stream deltas in real-time
                if (!isNonEnglish) {
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`)
                  );
                }
              }

              if (event.type === "message_stop") {
                // For English: send done event immediately
                if (!isNonEnglish) {
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
                  );
                }
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Post-stream processing
        const completionMarker = "[CONVERSATION_COMPLETE]";
        const hasCompletion = accumulatedText.includes(completionMarker);
        const strippedText = accumulatedText.replace(completionMarker, "").trim();

        // For non-English: translate the full response, then send as single delta + done
        let translatedResponse: string | null = null;
        if (isNonEnglish && strippedText) {
          translatedResponse = await googleTranslateText(strippedText, patientLanguage, "en");
          if (translatedResponse) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text: translatedResponse })}\n\n`)
            );
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
            );
          } else {
            // Translation failed — send English as fallback + notification
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "translation_unavailable" })}\n\n`)
            );
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text: strippedText })}\n\n`)
            );
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
            );
          }
        }

        // Store AI response: content = English, content_original = translated (patient's language)
        if (strippedText) {
          await supabase.rpc("store_ai_message", {
            p_visit_id: visit_id,
            p_content: strippedText,
            p_content_original: translatedResponse || null,
          });
        }

        // Urgency detection (scan both patient message and AI response)
        // Use englishMessage (not cleanMessage) so urgency keywords match for non-English patients
        const combinedText = (englishMessage + " " + accumulatedText).toLowerCase();

        const isHigh = HIGH_URGENCY.some((kw) => combinedText.includes(kw));
        const isMedium = !isHigh && MEDIUM_URGENCY.some((kw) => combinedText.includes(kw));

        if (isHigh) {
          await supabase.rpc("update_visit_priority", {
            p_visit_id: visit_id,
            p_priority: 3,
          });
        } else if (isMedium) {
          await supabase.rpc("update_visit_priority", {
            p_visit_id: visit_id,
            p_priority: 2,
          });
        }

        // Sensitivity detection
        const isSensitive = SENSITIVE_TOPICS.some((kw) => combinedText.includes(kw));
        if (isSensitive) {
          await supabase.rpc("set_sensitive_flag", {
            p_visit_id: visit_id,
          });
        }

        // Conversation complete — trigger summary generation
        if (hasCompletion) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "conversation_complete" })}\n\n`)
          );

          // Invoke generate-summary (must await or Deno kills the fetch on isolate termination)
          const edgeFunctionUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/generate-summary";
          try {
            const summaryRes = await fetch(edgeFunctionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "x-internal-secret": INTERNAL_SECRET!,
              },
              body: JSON.stringify({ visit_id }),
            });
            if (!summaryRes.ok) {
              console.error("generate-summary returned error:", summaryRes.status);
            }
          } catch (summaryErr) {
            console.error("generate-summary invoke error:", summaryErr);
            try {
              await supabase.rpc("move_to_queue_on_error", {
                p_visit_id: visit_id,
                p_session_token: session_token,
              });
            } catch { /* best effort */ }
          }
        }
      } catch (err) {
        console.error("Stream processing error:", err);
        try {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Stream processing error" })}\n\n`)
          );
        } catch { /* writer may be closed */ }
      } finally {
        try { await writer.close(); } catch { /* already closed */ }
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("ai-conversation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
