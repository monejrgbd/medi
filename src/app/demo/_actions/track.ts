"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchDemoProgress(teamCode: string) {
  if (!teamCode || teamCode.length < 2) {
    return { sessions: [], emails: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_demo_tracker", {
    p_team_code: teamCode,
  });

  if (error || !data) {
    return { sessions: [], emails: [] };
  }

  return {
    sessions: data.sessions || [],
    emails: data.emails || [],
  };
}
