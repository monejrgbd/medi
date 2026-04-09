"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { stripHtml } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateCheckinLink(
  locationId: string,
  firstName: string,
  lastName: string,
  aiModel?: string | null,
  skipAi?: boolean,
  aiSessionInstructions?: string | null,
  nameMatchMode?: "name" | "none"
): Promise<{ success: boolean; link?: string; error?: string }> {
  await requireAuth();

  if (!locationId || !UUID_RE.test(locationId))
    return { success: false, error: "Invalid location" };

  const mode = nameMatchMode || "name";

  let cleanFirst = "";
  let cleanLast = "";
  if (mode === "name") {
    cleanFirst = stripHtml(firstName).trim().slice(0, 100);
    cleanLast = stripHtml(lastName).trim().slice(0, 100);
    if (!cleanFirst || !cleanLast)
      return { success: false, error: "First and last name are required" };
  }

  const cleanInstructions = aiSessionInstructions
    ? stripHtml(aiSessionInstructions).slice(0, 2000)
    : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pre_checkin_token", {
    p_location_id: locationId,
    p_first_name: mode === "name" ? cleanFirst : "",
    p_last_name: mode === "name" ? cleanLast : "",
    p_ai_model: aiModel || null,
    p_skip_ai: skipAi || false,
    p_ai_session_instructions: cleanInstructions,
    p_name_match_mode: mode,
  });

  if (error) return { success: false, error: "Failed to generate link" };
  if (data && !data.success) return { success: false, error: data.error };

  const baseUrl = process.env.APP_BASE_URL || "https://hilthealth.com";
  const link = `${baseUrl}/checkin/${locationId}?token=${data.token}`;

  return { success: true, link };
}
