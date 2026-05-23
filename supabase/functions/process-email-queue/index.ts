// Internal edge function — deploy with `--no-verify-jwt`. Called only by the
// pg_net trigger on pending_emails INSERT, never by browsers. Authentication is
// via the `x-internal-secret` header (matched against INTERNAL_EDGE_SECRET env var).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  // Auth: internal secret header OR service role bearer
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-internal-secret");
  const isAuthorized =
    (secretHeader && secretHeader === INTERNAL_SECRET) ||
    (authHeader && authHeader === `Bearer ${SERVICE_ROLE_KEY}`);

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Fetch pending emails ordered by priority (high first), then age
  const { data: emails, error: fetchError } = await supabase
    .from("pending_emails")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!emails || emails.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const email of emails) {
    // Check notification preferences if pref_key is set
    const prefKey = email.metadata?.pref_key;
    if (prefKey) {
      const { data: pref } = await supabase
        .from("notification_preferences")
        .select(`email_${prefKey}`)
        .eq("email", email.to_email)
        .single();

      // If preference exists and is explicitly false, skip
      if (pref && pref[`email_${prefKey}`] === false) {
        await supabase
          .from("pending_emails")
          .update({ status: "skipped", last_attempt_at: new Date().toISOString() })
          .eq("id", email.id);
        skipped++;
        continue;
      }
    }

    // Send via Resend API
    const fromName = (email.from_name || "Hilt Health")
      .replace(/[\n\r<>"]/g, "")
      .slice(0, 78);

    // From address comes from the row's from_email column. Only @hilthealth.com addresses
    // are accepted so a malformed row cannot spoof an external domain. Fallback to the
    // generic notifications@ address for legacy rows that do not set from_email.
    const fromAddress = (email.from_email && /^[^\s<>"]+@hilthealth\.com$/i.test(email.from_email))
      ? email.from_email
      : "notifications@hilthealth.com";

    const emailPayload: Record<string, unknown> = {
      from: `${fromName} <${fromAddress}>`,
      to: Array.isArray(email.to_email) ? email.to_email : [email.to_email],
      subject: email.subject,
      html: email.html_body,
    };

    if (email.text_body) emailPayload.text = email.text_body;
    if (email.reply_to) emailPayload.reply_to = email.reply_to;
    if (email.attachments && Array.isArray(email.attachments)) {
      emailPayload.attachments = email.attachments;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (res.ok) {
        const data = await res.json();
        await supabase
          .from("pending_emails")
          .update({
            status: "sent",
            last_attempt_at: new Date().toISOString(),
            attempt_count: email.attempt_count + 1,
            metadata: { ...email.metadata, resend_id: data.id, sent_at: new Date().toISOString() },
          })
          .eq("id", email.id);
        sent++;
      } else {
        const errBody = await res.text();
        const newAttemptCount = email.attempt_count + 1;
        await supabase
          .from("pending_emails")
          .update({
            status: newAttemptCount >= MAX_ATTEMPTS ? "failed" : "pending",
            last_attempt_at: new Date().toISOString(),
            attempt_count: newAttemptCount,
            error_message: `HTTP ${res.status}: ${errBody.slice(0, 500)}`,
          })
          .eq("id", email.id);
        failed++;
      }
    } catch (err) {
      const newAttemptCount = email.attempt_count + 1;
      await supabase
        .from("pending_emails")
        .update({
          status: newAttemptCount >= MAX_ATTEMPTS ? "failed" : "pending",
          last_attempt_at: new Date().toISOString(),
          attempt_count: newAttemptCount,
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", email.id);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed: emails.length, sent, failed, skipped }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
