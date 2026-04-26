import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiModelToTier, getAdapter, loadTaskCall } from "../_ai-providers/index.ts";
import { PLAN_AI } from "../_ai-providers/plan-config.ts";

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
      .select("org_id, location_id, ai_model_override")
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
      .select("ai_model, ai_message_limit, queue_type, nurse_enabled")
      .eq("id", visitRow.location_id)
      .single();

    // Visit-level override takes priority (receptionist can set per-patient)
    const aiModel = visitRow?.ai_model_override || locationRow?.ai_model || "standard";
    const queueType = locationRow?.queue_type || "fifo";

    // Get subscription plan for model selection + message limit
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("subscription_plan")
      .eq("id", visitRow.org_id)
      .single();
    const subscriptionPlan = orgRow?.subscription_plan || "starter";

    // Message limit: per-location override (capped by plan max) > plan default > 30
    const planConfig = PLAN_AI[subscriptionPlan] ?? { messageLimit: { def: 30, max: 30 }, included: [], creditBased: [] };
    const msgConfig = planConfig.messageLimit;
    const messageLimit = locationRow?.ai_message_limit
      ? Math.min(locationRow.ai_message_limit, msgConfig.max)
      : msgConfig.def;

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

    if (existingPatientCount >= messageLimit * 2) {
      return new Response(
        JSON.stringify({ error: "message_limit_reached" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Resolve the tier + load the intake combo row, then pick the adapter
    const tier = aiModelToTier(aiModel);
    const { call: intakeCall } = await loadTaskCall(supabase, tier, "intake");
    const intakeAdapter = getAdapter(intakeCall.provider, supabase);

    // Credit deduction: only tiers in creditBased for this plan deduct
    // (enterprise has empty creditBased → free; PAYG/trials have all 4 → always deduct)
    const shouldDeductCredits = planConfig.creditBased.includes(tier);

    if (shouldDeductCredits && existingPatientCount === 0) {
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
        } else if (systemMessageIndex === 1) {
          // Greeting already shown to the patient via SystemGreeting.tsx. Replay it
          // as a prior assistant turn so the model knows it already greeted and
          // continues the conversation instead of greeting again on the first reply.
          // Strip the patient first name so Claude does not learn PII (the system
          // prompt declares "you do NOT know the patient's name"). Greeting formats
          // are owned by start_ai_conversation.core-sql.
          const sanitizedGreeting = msg.content
            .replace(/^Hello [^,]+,/, "Hello,")
            .replace(/^Welcome back, [^!]+!/, "Welcome back!");
          claudeMessages.push({
            role: "assistant",
            content: sanitizedGreeting,
          });
        } else {
          // System hints (e.g. rejection continuation) — send as user message so AI sees them
          claudeMessages.push({
            role: "user",
            content: `<system_instruction>${msg.content}</system_instruction>`,
          });
        }
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

    // Snapshot the stable system prompt length BEFORE appending the dynamic pacing
    // notice. This is the portion adapters can safely prompt-cache across turns
    // (Anthropic splits on this boundary; Gemini 3.x handles it automatically via
    // implicit caching; OpenAI caches prompts >1024 tokens automatically).
    const stableSystemPromptLen = systemPrompt.length;

    // Wrap-up nudge: when approaching message limit, tell AI to prioritize remaining fields
    const messagesRemaining = messageLimit - patientMessageCount;
    if (messagesRemaining <= 4 && messagesRemaining >= 0) {
      systemPrompt += `\n\nURGENT PACING NOTICE: The patient has approximately ${messagesRemaining} messages remaining. If you have not yet covered current medications, known allergies, chronic conditions, or pets at home, ask about ALL remaining uncovered items in your NEXT response. Move toward wrapping up the conversation.`;
    } else if (messagesRemaining < 0) {
      systemPrompt += `\n\nOVER LIMIT: You are past the message limit. Wrap up the conversation immediately.`;
    }

    // Call intake adapter (provider chosen by ai_model_config for this tier)
    // The adapter handles its own retries + streaming.
    // It yields normalized {type: 'delta'|'done'|'error'} chunks.
    const stream = intakeAdapter.streamChat({
      call: intakeCall,
      system: systemPrompt,
      systemCachePrefix: stableSystemPromptLen,
      messages: claudeMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    // Stream SSE response to client
    let accumulatedText = "";
    let streamError: string | null = null;
    const isNonEnglish = patientLanguage !== "en";

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process adapter stream in background
    (async () => {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "error") {
            streamError = chunk.error ?? "AI provider error";
            break;
          }

          if (chunk.type === "delta" && chunk.text) {
            accumulatedText += chunk.text;
            // For non-English: buffer text, don't stream deltas (translate after completion)
            // For English: stream deltas in real-time
            if (!isNonEnglish) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: "delta", text: chunk.text })}\n\n`)
              );
            }
          }

          if (chunk.type === "done") {
            // For English: send done event immediately
            if (!isNonEnglish) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
              );
            }
          }
        }

        if (streamError) {
          // Move to queue with proper status guard
          await supabase.rpc("move_to_queue_on_error", {
            p_visit_id: visit_id,
            p_session_token: session_token,
          });
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "AI service unavailable" })}\n\n`)
          );
          await writer.close();
          return;
        }

        // Post-stream processing
        const completionMarker = "[CONVERSATION_COMPLETE]";
        const rawHasCompletion = accumulatedText.includes(completionMarker);
        // Guard against premature completion. The model sometimes emits the
        // marker after a single patient message, especially with smaller models
        // or with restrictive ai_message_limit. Refuse to honor it before the
        // patient has had a chance to give the screening checklist content.
        // patientMessageCount counts the patient message that triggered THIS
        // turn, so 4 means the patient has spoken 4 times — enough to cover
        // chief complaint plus a few follow-ups.
        const MIN_PATIENT_TURNS = 4;
        const completionPremature = rawHasCompletion && patientMessageCount < MIN_PATIENT_TURNS;
        const hasCompletion = rawHasCompletion && !completionPremature;
        if (completionPremature) {
          console.warn(
            `Suppressing premature [CONVERSATION_COMPLETE] for visit ${visit_id}: ` +
            `patientMessageCount=${patientMessageCount}, threshold=${MIN_PATIENT_TURNS}`
          );
        }
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

        const skipAllPriority = ["fifo", "appointment_fifo"].includes(queueType);
        const criticalOnly = queueType === "critical_appointment_fifo";

        if (!skipAllPriority) {
          if (isHigh) {
            await supabase.rpc("update_visit_priority", {
              p_visit_id: visit_id,
              p_priority: 3,
            });
          } else if (isMedium && !criticalOnly) {
            await supabase.rpc("update_visit_priority", {
              p_visit_id: visit_id,
              p_priority: 2,
            });
          }
        }

        // Sensitivity detection
        const isSensitive = SENSITIVE_TOPICS.some((kw) => combinedText.includes(kw));
        if (isSensitive) {
          await supabase.rpc("set_sensitive_flag", {
            p_visit_id: visit_id,
          });
        }

        // Conversation complete — trigger summary generation. Status stays
        // 'still_answering_ai' until the patient approves on the summary review screen
        // (Rule A: patient gates the queue in BOTH nurse-enabled and non-nurse flows).
        // For nurse-enabled locations, the diagnostic is deferred until nurse_release_to_doctor
        // (Rule B) — pass mode=summary_only so generate-summary skips the diagnostic block.
        if (hasCompletion) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "conversation_complete" })}\n\n`)
          );

          const nurseEnabled = locationRow?.nurse_enabled === true;
          const summaryMode = nurseEnabled ? "summary_only" : "full";
          const edgeFunctionUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/generate-summary";
          try {
            const summaryRes = await fetch(edgeFunctionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "x-internal-secret": INTERNAL_SECRET!,
              },
              body: JSON.stringify({ visit_id, mode: summaryMode }),
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
