import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

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
    const body = await req.json();
    const { session_token, visit_id, event_type } = body;

    if (!session_token) {
      return new Response(JSON.stringify({ error: "Missing session_token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const channel = supabase.channel(`patient:${session_token}`);
    await channel.subscribe();

    {
      // Status change broadcast
      const { old_status, new_status, timeout_flagged, denied, staff_room, claimer_role } = body;

      if (!new_status) {
        supabase.removeChannel(channel);
        return new Response(JSON.stringify({ error: "Missing new_status" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await channel.send({
        type: "broadcast",
        event: "status_change",
        payload: {
          visit_id,
          status: new_status,
          old_status,
          timeout_flagged,
          denied,
          staff_room: staff_room ?? null,
          claimer_role: claimer_role ?? null,
        },
      });
    }

    supabase.removeChannel(channel);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
