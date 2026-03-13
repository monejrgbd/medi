import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limiter: org_id -> { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(orgId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(orgId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

async function googleTranslate(
  text: string,
  target: string,
  source?: string
): Promise<string> {
  const params: Record<string, string> = {
    q: text,
    target,
    key: GOOGLE_API_KEY!,
    format: "text",
  };
  if (source) params.source = source;

  const res = await fetch(
    "https://translation.googleapis.com/language/translate/v2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Translate API error: ${res.status}`);
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}

async function googleDetect(
  text: string
): Promise<{ language: string; confidence: number }> {
  const res = await fetch(
    "https://translation.googleapis.com/language/translate/v2/detect",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        key: GOOGLE_API_KEY!,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Detect API error: ${res.status}`);
  }

  const data = await res.json();
  const detection = data.data.detections[0][0];
  return {
    language: detection.language,
    confidence: detection.confidence,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Auth: internal secret OR valid JWT
    const internalSecret = req.headers.get("x-internal-secret");
    let orgId: string | null = null;

    if (internalSecret && internalSecret === INTERNAL_SECRET) {
      orgId = "internal"; // Internal calls bypass rate limit
    } else {
      // Validate JWT
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      orgId = user.app_metadata?.org_id || user.id;
    }

    // Rate limit (skip for internal calls)
    if (orgId !== "internal" && !checkRateLimit(orgId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait." }),
        {
          status: 429,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "detect") {
      const { text } = body;
      if (!text) {
        return new Response(
          JSON.stringify({ error: "Missing text" }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      const result = await googleDetect(text);
      return new Response(
        JSON.stringify({
          language_code: result.language,
          confidence: result.confidence,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "translate") {
      const { text, from, to } = body;
      if (!text || !to) {
        return new Response(
          JSON.stringify({ error: "Missing text or target language" }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      const translated = await googleTranslate(text, to, from || undefined);
      return new Response(
        JSON.stringify({ translated_text: translated }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "batch") {
      const { texts, from, to } = body;
      if (!texts || !Array.isArray(texts) || !to) {
        return new Response(
          JSON.stringify({ error: "Missing texts array or target language" }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      if (texts.length > 50) {
        return new Response(
          JSON.stringify({ error: "Batch size cannot exceed 50 texts" }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      const results = await Promise.all(
        texts.map((t: string) => googleTranslate(t, to, from || undefined))
      );
      return new Response(
        JSON.stringify({ translated_texts: results }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("translate error:", err);
    return new Response(
      JSON.stringify({ error: "Translation temporarily unavailable" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
