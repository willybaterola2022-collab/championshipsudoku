// sudoku-speed-submit
// Auth: JWT required
// Submit speed challenge completion. Saves time, returns rank.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return jsonResponse(req, { error: "Authentication required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return jsonResponse(req, { error: "Invalid token" }, 401);

    const body = await req.json();
    const { challenge_id, time_ms, errors } = body;
    if (!challenge_id || !time_ms) return jsonResponse(req, { error: "Missing fields" }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Verify challenge exists and is active
    const { data: challenge } = await admin
      .from("sudoku_speed_challenges")
      .select("id, ends_at")
      .eq("id", challenge_id)
      .maybeSingle();

    if (!challenge) return jsonResponse(req, { error: "Challenge not found" }, 404);
    if (new Date(challenge.ends_at) < new Date()) return jsonResponse(req, { error: "Challenge ended" }, 410);

    // Insert completion
    const { error: insertErr } = await admin.from("sudoku_speed_completions").insert({
      user_id: userData.user.id,
      challenge_id,
      time_ms,
      errors: errors ?? 0,
    });

    if (insertErr) {
      if (insertErr.code === "23505") return jsonResponse(req, { error: "Already submitted", already: true }, 409);
      return jsonResponse(req, { error: insertErr.message }, 500);
    }

    // Get rank
    const { count: better } = await admin
      .from("sudoku_speed_completions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challenge_id)
      .lt("time_ms", time_ms);

    const { count: total } = await admin
      .from("sudoku_speed_completions")
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
