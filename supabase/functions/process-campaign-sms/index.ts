// Deployed with --no-verify-jwt (internal function, not called by browsers)
// Triggered by pg_cron every minute to send pending campaign SMS messages
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const EDGE_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query active campaigns that are in sending state
    const { data: campaigns, error: campaignsErr } = await supabase
      .from("sms_campaigns")
      .select("id, message_body, org_id")
      .eq("status", "sending");

    if (campaignsErr) {
      console.error("Failed to query campaigns:", campaignsErr);
      return new Response(JSON.stringify({ error: "Failed to query campaigns" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ campaigns_processed: 0, total_sent: 0, total_failed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const campaign of campaigns) {
      // Re-check status (might have been cancelled between query and processing)
      const { data: statusCheck } = await supabase
        .from("sms_campaigns")
        .select("status")
        .eq("id", campaign.id)
        .single();

      if (!statusCheck || statusCheck.status !== "sending") {
        continue;
      }

      // Load org name for message substitution
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", campaign.org_id)
        .single();

      const orgName = org?.name || "Your clinic";

      // Query batch of 50 pending recipients
      const { data: recipients, error: recipientsErr } = await supabase
        .from("sms_campaign_recipients")
        .select("id, patient_id, phone, sms_log_id, patients!inner(first_name, is_demo_patient)")
        .eq("campaign_id", campaign.id)
        .eq("status", "pending")
        .eq("excluded", false)
        .order("created_at", { ascending: true })
        .limit(50);

      if (recipientsErr) {
        console.error(`Failed to query recipients for campaign ${campaign.id}:`, recipientsErr);
        continue;
      }

      if (!recipients || recipients.length === 0) {
        // No more pending recipients, complete the campaign
        const { error: completeErr } = await supabase.rpc("complete_campaign_sending", {
          p_campaign_id: campaign.id,
        });

        if (completeErr) {
          console.error(`complete_campaign_sending error for ${campaign.id}:`, completeErr);
        }
        continue;
      }

      // Process each recipient
      for (const recipient of recipients) {
        const firstName = (recipient as Record<string, unknown>).patients
          ? ((recipient as Record<string, unknown>).patients as { first_name: string }).first_name
          : "there";

        // Build message: substitute {first_name} and {clinic_name}, append opt-out
        let message = campaign.message_body || "";
        message = message.replaceAll("{first_name}", firstName);
        message = message.replaceAll("{clinic_name}", orgName);
        message += "\nReply STOP to opt out";

        // Skip real SMS for demo patients — simulate delivery
        const isDemo = (recipient as any).patients?.is_demo_patient === true;

        if (isDemo) {
          await supabase
            .from("sms_campaign_recipients")
            .update({ status: "sent" })
            .eq("id", recipient.id);

          if (recipient.sms_log_id) {
            await supabase
              .from("sms_log")
              .update({ status: "sent", message_body: message })
              .eq("id", recipient.sms_log_id);
          }

          totalSent++;
          continue;
        }

        // Call send-sms edge function
        try {
          const smsResponse = await fetch(`${EDGE_URL}/send-sms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              "x-internal-secret": INTERNAL_SECRET!,
            },
            body: JSON.stringify({
              to: recipient.phone,
              org_id: campaign.org_id,
              patient_id: recipient.patient_id,
              sms_type: "marketing",
              sms_log_id: recipient.sms_log_id,
              body: message,
            }),
          });

          const smsResult = await smsResponse.json();
          const sent = smsResponse.ok && smsResult.success;

          // Update recipient status
          await supabase
            .from("sms_campaign_recipients")
            .update({
              status: sent ? "sent" : "failed",
            })
            .eq("id", recipient.id);

          if (sent) {
            totalSent++;
          } else {
            totalFailed++;
          }
        } catch (smsErr) {
          console.error(`SMS send error for recipient ${recipient.id}:`, smsErr);

          await supabase
            .from("sms_campaign_recipients")
            .update({ status: "failed" })
            .eq("id", recipient.id);

          totalFailed++;
        }

        // 100ms delay between sends to avoid rate limiting
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return new Response(
      JSON.stringify({
        campaigns_processed: campaigns.length,
        total_sent: totalSent,
        total_failed: totalFailed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-campaign-sms error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
