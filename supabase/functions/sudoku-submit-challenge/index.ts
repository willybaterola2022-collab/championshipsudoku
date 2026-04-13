// sudoku-submit-challenge
// Auth: JWT optional (guests can play with a name)
// Submit a challenge attempt with time.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const body = await req.json();
    const { challenge_id, time_ms, errors, guest_name } = body;

    if (!challenge_id || !time_ms) {
      return jsonResponse(req, { error: "Missing challenge_id or time_ms" }, 400);
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { error: insertErr } = await admin.from("sudoku_challenge_attempts").insert({
      challenge_id,
      user_id: userId,
      guest_name: guest_name ?? null,
      time_ms,
      errors: errors ?? 0,
    });

    if (insertErr) return jsonResponse(req, { error: insertErr.message }, 500);

    // Get rank
    const { count: better } = await admin
      .from("sudoku_challenge_attempts")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challenge_id)
      .lt("time_ms", time_ms);

    const { count: total } = await admin
      .from("sudoku_challenge_attempts")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challenge_id);

    return jsonResponse(req, {
      rank: (better ?? 0) + 1,
      total: total ?? 1,
      time_ms,
    });
  } catch (err) {
    return jsonResponse(req, { error: err instanceof Error ? err.message : "Error" }, 500);
  }
});
