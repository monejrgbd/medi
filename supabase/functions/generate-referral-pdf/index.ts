import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  rgb,
  StandardFonts,
} from "https://esm.sh/pdf-lib@1.17.1";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-internal-secret, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Dual auth: internal secret OR JWT
    const internalSecret = req.headers.get("x-internal-secret");
    const authHeader = req.headers.get("authorization");

    let isAuthorized = false;
    let callerClient: ReturnType<typeof createClient> | null = null;

    if (internalSecret && internalSecret === INTERNAL_SECRET) {
      isAuthorized = true;
    } else if (authHeader?.startsWith("Bearer ")) {
      // Verify JWT via supabase
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        isAuthorized = true;
        callerClient = userClient;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { referral_id } = await req.json();
    if (!referral_id) {
      return new Response(
        JSON.stringify({ error: "Missing referral_id" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // Service role client for storage/table writes
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    // Use caller's JWT for get_referral_detail so SQL enforces org-level auth;
    // internal-secret path uses service_role (SQL function already authorized the action)
    const rpcClient = callerClient || supabase;
    const { data: detailData, error: detailError } = await rpcClient.rpc(
      "get_referral_detail",
      { p_referral_id: referral_id }
    );

    if (detailError || !detailData?.success) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch referral data" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const referral = detailData.data.referral;
    const visits = detailData.data.visits || [];

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const PAGE_WIDTH = 595;
    const PAGE_HEIGHT = 842;
    const MARGIN = 50;
    const LINE_HEIGHT = 14;
    const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    function ensureSpace(needed: number) {
      if (y - needed < MARGIN) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
    }

    function drawText(
      text: string,
      size: number,
      f = font,
      color = rgb(0, 0, 0)
    ) {
      ensureSpace(size + 4);
      page.drawText(text, { x: MARGIN, y, size, font: f, color });
      y -= size + 4;
    }

    function drawWrapped(text: string, size: number, f = font) {
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = f.widthOfTextAtSize(testLine, size);
        if (width > MAX_WIDTH && line) {
          ensureSpace(LINE_HEIGHT);
          page.drawText(line, { x: MARGIN, y, size, font: f });
          y -= LINE_HEIGHT;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, { x: MARGIN, y, size, font: f });
        y -= LINE_HEIGHT;
      }
    }

    // Header
    drawText("Hilt Health — Patient Referral", 18, fontBold, rgb(0.1, 0.4, 0.8));
    drawText(
      `Generated: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      9,
      font,
      rgb(0.5, 0.5, 0.5)
    );
    y -= 10;

    // Patient info
    drawText("Patient Information", 12, fontBold);
    drawText(`Name: ${referral.patient_name}`, 10);
    drawText(`Date of Birth: ${referral.patient_birthday}`, 10);
    y -= 10;

    // Referral info
    drawText("Referral Details", 12, fontBold);
    drawText(`Specialty: ${referral.specialty}`, 10);
    drawText(`From: ${referral.from_org_name} — Dr. ${referral.from_doctor_name}`, 10);
    if (referral.to_org_name) {
      drawText(`To: ${referral.to_org_name}`, 10);
    } else if (referral.to_email) {
      drawText(`To: ${referral.to_email}`, 10);
    }
    y -= 10;

    // Referral note
    drawText("Referral Note", 12, fontBold);
    drawWrapped(referral.referral_note || "No note provided.", 10);
    y -= 10;

    // Included visits
    for (let i = 0; i < visits.length; i++) {
      const visit = visits[i];
      ensureSpace(40);
      drawText(`Visit ${i + 1} — ${visit.completed_at ? new Date(visit.completed_at).toLocaleDateString() : "N/A"}`, 11, fontBold);

      if (visit.ai_summary) {
        drawText("Summary:", 10, fontBold);
        drawWrapped(visit.ai_summary, 9);
        y -= 5;
      }

      if (visit.doctor_diagnosis) {
        drawText("Diagnosis:", 10, fontBold);
        drawWrapped(visit.doctor_diagnosis, 9);
        y -= 5;
      }

      if (visit.ai_diagnostic) {
        drawText("AI Diagnostic:", 10, fontBold);
        const diagnosticText = typeof visit.ai_diagnostic === 'object'
          ? JSON.stringify(visit.ai_diagnostic, null, 2)
          : String(visit.ai_diagnostic || '');
        drawWrapped(diagnosticText, 9);
        y -= 5;
      }

      // Transcript
      if (visit.transcript && visit.transcript.length > 0) {
        drawText("Transcript:", 10, fontBold);
        for (const msg of visit.transcript) {
          const role = msg.role === "assistant" ? "AI" : msg.role === "user" ? "Patient" : msg.role;
          ensureSpace(LINE_HEIGHT);
          drawWrapped(`${role}: ${msg.content}`, 8);
        }
        y -= 5;
      }

      // Public notes
      if (visit.notes && visit.notes.length > 0) {
        drawText("Doctor Notes:", 10, fontBold);
        for (const note of visit.notes) {
          drawWrapped(`${note.author_name || "Doctor"}: ${note.content}`, 9);
        }
        y -= 5;
      }

      y -= 10;
    }

    // Medications / Allergies / Chronic conditions
    if (referral.medications?.length || referral.allergies?.length || referral.chronic_conditions?.length) {
      ensureSpace(30);
      drawText("Medical Information", 12, fontBold);

      if (referral.medications?.length) {
        drawText(`Medications: ${referral.medications.map((m: { name: string }) => m.name).join(", ")}`, 10);
      }
      if (referral.allergies?.length) {
        drawText(`Allergies: ${referral.allergies.map((a: { name: string }) => a.name).join(", ")}`, 10);
      }
      if (referral.chronic_conditions?.length) {
        drawText(`Chronic Conditions: ${referral.chronic_conditions.map((c: { name: string }) => c.name).join(", ")}`, 10);
      }
    }

    // Footer
    y -= 20;
    ensureSpace(20);
    drawText(
      "Generated by Hilt Health — hilthealth.com",
      8,
      font,
      rgb(0.6, 0.6, 0.6)
    );

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const storagePath = `${referral.from_org_id}/${referral_id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("referral-pdfs")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // Update referral with pdf_url
    await supabase
      .from("referrals")
      .update({ pdf_url: storagePath })
      .eq("id", referral_id);

    // If external referral (to_email), queue email with PDF attachment
    if (referral.to_email) {
      // Base64 encode PDF for email attachment (chunked to avoid stack overflow)
      const uint8 = new Uint8Array(pdfBytes);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.slice(i, i + chunkSize));
      }
      const base64Pdf = btoa(binary);

      const { error: emailQueueError } = await supabase
        .from("pending_emails")
        .insert({
          to_email: referral.to_email,
          subject: `Patient Referral — ${referral.patient_name}`,
          html_body: `<h2>Patient Referral</h2>
            <p>You have received a patient referral from <strong>${(referral.from_org_name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong> (Dr. ${(referral.from_doctor_name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}).</p>
            <p><strong>Patient:</strong> ${(referral.patient_name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <p><strong>Specialty:</strong> ${(referral.specialty || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <p>Please see the attached PDF for the full referral package.</p>
            <br/><p style="color: #999;">Sent via Hilt Health — hilthealth.com</p>`,
          from_name: referral.from_org_name,
          attachments: [
            {
              filename: `referral-${referral.patient_name.replace(/\s+/g, "-")}.pdf`,
              content: base64Pdf,
            },
          ],
          priority: 2,
          metadata: { type: "referral_pdf", referral_id },
        });

      if (emailQueueError) {
        console.error(`Failed to queue referral email for ${referral_id}: ${emailQueueError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, pdf_url: storagePath }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }
});
