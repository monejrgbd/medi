import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

Deno.serve(async (req) => {
  // Validate internal secret
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { visit_id } = await req.json();

    if (!visit_id) {
      return new Response(JSON.stringify({ error: "Missing visit_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load conversation (service-role — gets all messages including system prompt)
    const { data: convData } = await supabase.rpc("get_conversation", {
      p_visit_id: visit_id,
    });

    if (!convData?.success) {
      return new Response(JSON.stringify({ error: "Failed to load conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = convData.messages || [];

    // Build transcript (exclude system-role messages)
    const transcript = messages
      .filter((m: { role: string }) => m.role !== "system")
      .map((m: { role: string; content: string }) =>
        `${m.role === "patient" ? "Patient" : "AI"}: ${m.content}`
      )
      .join("\n\n");

    // Load visit details for display_format and ai_model
    const { data: visitRow } = await supabase
      .from("visits")
      .select("org_id, patient_id, session_token, location_id")
      .eq("id", visit_id)
      .single();

    if (!visitRow) {
      return new Response(JSON.stringify({ error: "Visit not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: locationRow } = await supabase
      .from("locations")
      .select("ai_model, display_format")
      .eq("id", visitRow.location_id)
      .single();

    const aiModel = locationRow?.ai_model || "standard";
    const displayFormat = locationRow?.display_format || "summary";

    // Build the structured output prompt
    const includeStructuredCard = displayFormat === "structured_card";
    const includeDiagnostic = aiModel === "advanced";

    const summaryPrompt = `You are a medical summarization assistant. Analyze the following patient-AI intake conversation and produce a JSON response.

CONVERSATION TRANSCRIPT:
${transcript}

Produce a JSON object with these fields:
1. "summary" (string, REQUIRED): A concise plain-text paragraph summarizing the patient's chief complaint, symptoms, timeline, severity, medications, allergies, and chronic conditions discussed. Written for the treating physician.

2. "structured_card" (${includeStructuredCard ? "object, REQUIRED" : "null"}): ${includeStructuredCard ? `An object with these string fields (use null for any not discussed):
   - "chief_complaint": Main reason for visit
   - "onset": When symptoms started
   - "duration": How long symptoms have persisted
   - "severity": Pain scale or severity description
   - "location": Body location of symptoms
   - "associated_symptoms": Other symptoms mentioned
   - "aggravating_factors": What makes it worse
   - "relieving_factors": What makes it better
   - "tried": Treatments or remedies already attempted` : "Always null for this visit."}

3. "diagnostic" (${includeDiagnostic ? "string, REQUIRED" : "null"}): ${includeDiagnostic ? "A doctor-eyes-only AI assessment with clinical reasoning, potential differential diagnoses, and suggested workup. This is NOT shown to the patient." : "Always null for this visit."}

4. "medications" (string[] or null): Array of medication names mentioned by the patient as currently taking. Use null if medications were not discussed (NOT an empty array). Use empty array [] only if patient explicitly stated they take no medications.

5. "allergies" (string[] or null): Array of allergy names mentioned. Same null vs [] rules as medications.

6. "chronic_conditions" (string[] or null): Array of chronic condition names mentioned. Same null vs [] rules as medications.

Respond ONLY with valid JSON. No markdown, no code fences, no explanation.`;

    // Single Claude API call for all outputs
    const claudeModel = aiModel === "advanced"
      ? "claude-opus-4-20250514"
      : "claude-sonnet-4-20250514";

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: 2048,
        messages: [{ role: "user", content: summaryPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      console.error("Claude API error:", claudeResponse.status);
      return new Response(JSON.stringify({ error: "AI summarization failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const claudeResult = await claudeResponse.json();
    const rawText = claudeResult.content?.[0]?.text || "";

    // Parse JSON response — strip any markdown fences if present
    let parsed;
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude JSON:", rawText);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate and extract fields
    const summary = typeof parsed.summary === "string" ? parsed.summary : null;
    if (!summary) {
      console.error("No summary in parsed response");
      return new Response(JSON.stringify({ error: "AI did not produce a summary" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const structuredCard = includeStructuredCard && parsed.structured_card && typeof parsed.structured_card === "object"
      ? parsed.structured_card
      : null;

    const diagnostic = includeDiagnostic && typeof parsed.diagnostic === "string"
      ? parsed.diagnostic
      : null;

    // Save summary to visit
    await supabase.rpc("save_summary", {
      p_visit_id: visit_id,
      p_summary: summary,
      p_structured_card: structuredCard,
      p_diagnostic: diagnostic,
    });

    // Update medical records (only if AI returned non-null arrays)
    const medPromises = [];

    if (Array.isArray(parsed.medications)) {
      const meds = parsed.medications.filter((m: unknown) => typeof m === "string" && m.trim());
      medPromises.push(
        supabase.rpc("update_medications", {
          p_patient_id: visitRow.patient_id,
          p_medications: meds,
        })
      );
    }

    if (Array.isArray(parsed.allergies)) {
      const allergies = parsed.allergies.filter((a: unknown) => typeof a === "string" && a.trim());
      medPromises.push(
        supabase.rpc("update_allergies", {
          p_patient_id: visitRow.patient_id,
          p_allergies: allergies,
        })
      );
    }

    if (Array.isArray(parsed.chronic_conditions)) {
      const conditions = parsed.chronic_conditions.filter((c: unknown) => typeof c === "string" && c.trim());
      medPromises.push(
        supabase.rpc("update_chronic_conditions", {
          p_patient_id: visitRow.patient_id,
          p_conditions: conditions,
        })
      );
    }

    if (medPromises.length > 0) {
      await Promise.all(medPromises);
    }

    // Broadcast summary_ready to patient channel
    const channel = supabase.channel(`patient:${visitRow.session_token}`);
    await channel.send({
      type: "broadcast",
      event: "summary_ready",
      payload: {
        visit_id,
        summary,
        structured_card: structuredCard,
      },
    });
    supabase.removeChannel(channel);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-summary error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
