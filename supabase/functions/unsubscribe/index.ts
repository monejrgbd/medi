import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UNSUBSCRIBE_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function base64Decode(str: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
  );
}

async function verifyHmac(data: string, signature: string): Promise<boolean> {
  if (!UNSUBSCRIBE_SECRET) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(UNSUBSCRIBE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(expected)));

  return expectedBase64 === signature;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatPrefName(prefType: string): string {
  return prefType.split("_").map(capitalize).join(" ");
}

function successPage(prefName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed — Hilt Health</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
    .card { max-width: 420px; text-align: center; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 32px; }
    h1 { font-size: 20px; color: #1e293b; margin: 0 0 12px; }
    p { font-size: 14px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Hilt Health</div>
    <h1>Unsubscribed</h1>
    <p>You've been unsubscribed from <strong>${prefName}</strong> emails. This change takes effect immediately.</p>
  </div>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error — Hilt Health</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
    .card { max-width: 420px; text-align: center; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 32px; }
    h1 { font-size: 20px; color: #1e293b; margin: 0 0 12px; }
    p { font-size: 14px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Hilt Health</div>
    <h1>Something went wrong</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("pref");

  if (!token) {
    return new Response(errorPage("Missing unsubscribe token."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  let decoded: string;
  try {
    decoded = base64Decode(token);
  } catch {
    return new Response(errorPage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Format: email:pref_type:signature
  const lastColon = decoded.lastIndexOf(":");
  if (lastColon === -1) {
    return new Response(errorPage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const signature = decoded.slice(lastColon + 1);
  const dataStr = decoded.slice(0, lastColon);

  const colonIdx = dataStr.indexOf(":");
  if (colonIdx === -1) {
    return new Response(errorPage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const email = dataStr.slice(0, colonIdx);
  const prefType = dataStr.slice(colonIdx + 1);

  // Sanitize pref_type to prevent SQL injection
  if (!/^[a-z][a-z0-9_]*$/.test(prefType)) {
    return new Response(errorPage("Invalid preference type."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Verify HMAC
  const valid = await verifyHmac(dataStr, signature);
  if (!valid) {
    return new Response(errorPage("Invalid or expired unsubscribe link."), {
      status: 403,
      headers: { "Content-Type": "text/html" },
    });
  }

  const columnName = `email_${prefType}`;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Upsert: create preference row if it doesn't exist, then disable the preference
  const { error: upsertError } = await supabase
    .from("notification_preferences")
    .upsert(
      { email, [columnName]: false, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (upsertError) {
    return new Response(errorPage("Unable to update preferences. Please try again later."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }

  const prefName = formatPrefName(prefType);
  return new Response(successPage(prefName), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
});
