const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  // Validate internal secret (no browser access)
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { to, subject, html_body, from_name, reply_to, attachments } =
      await req.json();

    if (!to || !subject || !html_body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailPayload: Record<string, unknown> = {
      from: `${from_name || "Hilt Health"} <notifications@hilthealth.com>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html_body,
    };

    if (reply_to) emailPayload.reply_to = reply_to;
    if (attachments && Array.isArray(attachments)) {
      emailPayload.attachments = attachments;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Email delivery failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, resend_id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
