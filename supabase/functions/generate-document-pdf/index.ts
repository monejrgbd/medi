// Internal function — deploy with --no-verify-jwt
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

/** Format a date string as "Month DD, YYYY" */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** SOAP section headers */
const SOAP_HEADERS = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"];

/**
 * Detect SOAP-style content: lines starting with S:, O:, A:, P: or
 * SUBJECTIVE:, OBJECTIVE:, ASSESSMENT:, PLAN: (case-insensitive).
 */
function isSoapContent(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let matched = 0;
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (
      SOAP_HEADERS.some(
        (h) => upper.startsWith(h + ":") || upper.startsWith(h + "\n"),
      )
    ) {
      matched++;
    }
  }
  return matched >= 2;
}

/**
 * Parse SOAP content into sections.
 * Returns array of { header, body } objects.
 */
function parseSoapSections(
  text: string,
): { header: string; body: string }[] {
  const sections: { header: string; body: string }[] = [];
  const lines = text.split("\n");
  let currentHeader: string | null = null;
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    const matchedHeader = SOAP_HEADERS.find(
      (h) => upper.startsWith(h + ":") || upper === h,
    );

    if (matchedHeader) {
      // Save previous section
      if (currentHeader) {
        sections.push({
          header: currentHeader,
          body: currentBody.join("\n").trim(),
        });
      }
      currentHeader = matchedHeader;
      // Content after the header on the same line
      const afterColon = trimmed.substring(matchedHeader.length).replace(
        /^:\s*/,
        "",
      );
      currentBody = afterColon ? [afterColon] : [];
    } else {
      currentBody.push(line);
    }
  }

  // Push final section
  if (currentHeader) {
    sections.push({
      header: currentHeader,
      body: currentBody.join("\n").trim(),
    });
  }

  return sections;
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

    if (internalSecret && internalSecret === INTERNAL_SECRET) {
      isAuthorized = true;
    } else if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
          global: { headers: { Authorization: authHeader } },
        },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { document_id } = await req.json();
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "Missing document_id" }),
        {
          status: 400,
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        },
      );
    }

    // Service role client for all DB reads and storage writes
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Load clinical_documents row
    const { data: doc, error: docError } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        {
          status: 404,
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        },
      );
    }

    // 2. Load organization
    const { data: org } = await supabase
      .from("organizations")
      .select(
        "name, clinician_license_number, clinician_npi, clinician_credentials, clinician_signature_url, letterhead_logo_url, letterhead_disclaimer",
      )
      .eq("id", doc.org_id)
      .single();

    // 3. Load location
    const { data: location } = await supabase
      .from("locations")
      .select("name, address")
      .eq("id", doc.location_id)
      .single();

    // 4. Load signer staff user
    let signerName = "Unknown";
    if (doc.signed_by) {
      const { data: signer } = await supabase
        .from("staff_users")
        .select("full_name")
        .eq("id", doc.signed_by)
        .single();
      if (signer) signerName = signer.full_name;
    }

    // 5. Load patient
    const { data: patient } = await supabase
      .from("patients")
      .select("first_name, last_name, birthday")
      .eq("id", doc.patient_id)
      .single();

    // 6. Load document template
    const { data: template } = await supabase
      .from("document_templates")
      .select("display_name, default_disclaimer")
      .eq("key", doc.template_key)
      .single();

    const clinicName = org?.name || "Clinic";
    const templateTitle = template?.display_name || doc.document_type || "Clinical Document";
    const patientName = patient
      ? `${patient.first_name} ${patient.last_name}`
      : "Unknown Patient";
    const patientDob = patient?.birthday
      ? formatDate(patient.birthday)
      : "N/A";

    // ---------- Build PDF ----------
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
      color = rgb(0, 0, 0),
    ) {
      ensureSpace(size + 4);
      page.drawText(text, { x: MARGIN, y, size, font: f, color });
      y -= size + 4;
    }

    function drawTextRight(
      text: string,
      size: number,
      f = font,
      color = rgb(0, 0, 0),
    ) {
      ensureSpace(size + 4);
      const textWidth = f.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: PAGE_WIDTH - MARGIN - textWidth,
        y,
        size,
        font: f,
        color,
      });
      y -= size + 4;
    }

    function drawTextCentered(
      text: string,
      size: number,
      f = font,
      color = rgb(0, 0, 0),
    ) {
      ensureSpace(size + 4);
      const textWidth = f.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (PAGE_WIDTH - textWidth) / 2,
        y,
        size,
        font: f,
        color,
      });
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

    // ========== HEADER ==========
    let logoEmbedded = false;
    const headerStartY = y;

    // Try to embed letterhead logo (top-left, max 80x80)
    if (org?.letterhead_logo_url) {
      try {
        const logoRes = await fetch(org.letterhead_logo_url);
        if (logoRes.ok) {
          const logoBytes = new Uint8Array(await logoRes.arrayBuffer());
          const contentType = logoRes.headers.get("content-type") || "";
          let logoImage;
          if (contentType.includes("png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
          const scale = Math.min(80 / logoImage.width, 80 / logoImage.height);
          const logoW = logoImage.width * scale;
          const logoH = logoImage.height * scale;
          page.drawImage(logoImage, {
            x: MARGIN,
            y: headerStartY - logoH,
            width: logoW,
            height: logoH,
          });
          logoEmbedded = true;
        }
      } catch {
        // Logo fetch failed, continue without it
      }
    }

    // Clinic name + address + phone (top-right if logo, otherwise top-left)
    if (logoEmbedded) {
      // Draw clinic info on the right side
      const clinicNameWidth = fontBold.widthOfTextAtSize(clinicName, 14);
      page.drawText(clinicName, {
        x: PAGE_WIDTH - MARGIN - clinicNameWidth,
        y: headerStartY,
        size: 14,
        font: fontBold,
      });

      let rightY = headerStartY - 18;

      if (location?.address) {
        const addrWidth = font.widthOfTextAtSize(location.address, 9);
        page.drawText(location.address, {
          x: PAGE_WIDTH - MARGIN - addrWidth,
          y: rightY,
          size: 9,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
        rightY -= 13;
      }

      // Move y cursor below the taller of logo (80) or text block
      y = headerStartY - 85;
    } else {
      // No logo: clinic info at left
      drawText(clinicName, 14, fontBold);
      if (location?.address) {
        drawText(location.address, 9, font, rgb(0.3, 0.3, 0.3));
      }
    }

    y -= 10;

    // Horizontal divider
    ensureSpace(5);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 15;

    // ========== TITLE ==========
    drawTextCentered(templateTitle, 16, fontBold);
    drawTextCentered(
      `Issued: ${formatDate(doc.signed_at)}`,
      10,
      font,
      rgb(0.4, 0.4, 0.4),
    );
    y -= 15;

    // ========== PATIENT INFO ==========
    drawText(`Patient: ${patientName}`, 11, fontBold);
    drawText(`Date of Birth: ${patientDob}`, 10);
    y -= 15;

    // ========== BODY ==========
    const contentBody = doc.content_body || "";

    if (
      doc.document_category === "clinical_note" && isSoapContent(contentBody)
    ) {
      // Render SOAP note with section headers
      const sections = parseSoapSections(contentBody);
      for (const section of sections) {
        ensureSpace(30);
        drawText(section.header, 12, fontBold, rgb(0.1, 0.1, 0.5));
        y -= 2;
        // Wrap each paragraph line within the section
        const bodyLines = section.body.split("\n");
        for (const bLine of bodyLines) {
          if (bLine.trim()) {
            drawWrapped(bLine.trim(), 11);
          } else {
            y -= 6;
          }
        }
        y -= 10;
      }
    } else {
      // Standard content rendering, split by newlines
      const paragraphs = contentBody.split("\n");
      for (const para of paragraphs) {
        if (para.trim()) {
          drawWrapped(para.trim(), 11);
        } else {
          y -= 8;
        }
      }
    }

    y -= 20;

    // ========== SIGNATURE BLOCK ==========
    ensureSpace(80);

    // Horizontal rule before signature
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + 200, y },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 15;

    // Signature image if available
    if (org?.clinician_signature_url) {
      try {
        const sigRes = await fetch(org.clinician_signature_url);
        if (sigRes.ok) {
          const sigBytes = new Uint8Array(await sigRes.arrayBuffer());
          const sigContentType = sigRes.headers.get("content-type") || "";
          let sigImage;
          if (sigContentType.includes("png")) {
            sigImage = await pdfDoc.embedPng(sigBytes);
          } else {
            sigImage = await pdfDoc.embedJpg(sigBytes);
          }
          const sigScale = Math.min(
            150 / sigImage.width,
            50 / sigImage.height,
          );
          const sigW = sigImage.width * sigScale;
          const sigH = sigImage.height * sigScale;
          ensureSpace(sigH + 10);
          page.drawImage(sigImage, {
            x: MARGIN,
            y: y - sigH,
            width: sigW,
            height: sigH,
          });
          y -= sigH + 5;
        }
      } catch {
        // Signature fetch failed, continue without it
      }
    }

    // Signer name + credentials
    const credentials = org?.clinician_credentials || "";
    const signerLine = credentials
      ? `Electronically signed by ${signerName}, ${credentials}`
      : `Electronically signed by ${signerName}`;
    drawText(signerLine, 10, fontBold);

    if (org?.clinician_license_number) {
      drawText(`License: ${org.clinician_license_number}`, 9, font, rgb(0.3, 0.3, 0.3));
    }

    if (org?.clinician_npi) {
      drawText(`NPI: ${org.clinician_npi}`, 9, font, rgb(0.3, 0.3, 0.3));
    }

    drawText(
      `Date: ${formatDate(doc.signed_at)}`,
      9,
      font,
      rgb(0.3, 0.3, 0.3),
    );

    y -= 25;

    // ========== FOOTER ==========
    ensureSpace(30);

    // Thin rule
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 10;

    const disclaimerText = org?.letterhead_disclaimer ||
      template?.default_disclaimer ||
      `This document was generated by ${clinicName} and is subject to local laws and regulations.`;

    drawWrapped(disclaimerText, 7, font);

    // ---------- Save PDF ----------
    const pdfBytes = await pdfDoc.save();

    // ---------- Upload to storage ----------
    const storagePath =
      `${doc.org_id}/${doc.document_type}/${document_id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("clinical-documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("PDF upload failed:", uploadError.message);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF" }),
        {
          status: 500,
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        },
      );
    }

    // ---------- Update clinical_documents row ----------
    const { error: updateError } = await supabase
      .from("clinical_documents")
      .update({
        pdf_url: storagePath,
        pdf_bucket_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Failed to update document row:", updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        pdf_url: storagePath,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("generate-document-pdf error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }
});
