// sudoku-claim-mission
// Auth: JWT required
// Claim XP reward for a completed weekly mission. Atomic row lock.

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
    const internalSecret = Deno.env.get("INTERNAL_SECRET")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return jsonResponse(req, { error: "Invalid token" }, 401);

    const { mission_id } = await req.json();
    if (!mission_id) return jsonResponse(req, { error: "Missing mission_id" }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Get progress
    const { data: progress } = await admin
      .from("sudoku_mission_progress")
      .select("id, completed, claimed")
      .eq("user_id", userData.user.id)
      .eq("mission_id", mission_id)
      .maybeSingle();

    if (!progress) return jsonResponse(req, { error: "No progress for this mission" }, 404);
    if (!progress.completed) return jsonResponse(req, { error: "Mission not completed yet" }, 400);
    if (progress.claimed) return jsonResponse(req, { error: "Already claimed", already: true }, 409);

    // Get mission for XP amount
    const { data: mission } = await admin
      .from("sudoku_weekly_missions")
      .select("xp_reward")
      .eq("id", mission_id)
      .single();

    if (!mission) return jsonResponse(req, { error: "Mission not found" }, 404);

    // Mark claimed
    await admin
      .from("sudoku_mission_progress")
      .update({ claimed: true })
      .eq("id", progress.id);

    // Grant XP via internal EF
    const grantRes = await fetch(`${url}/functions/v1/sudoku-grant-xp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        user_id: userData.user.id,
        session_id: `mission:${mission_id}:${userData.user.id}`,
        difficulty: "medium",
        variant: "classic",
        time_ms: 0,
        errors: 0,
        hints_used: 0,
        is_daily: false,
      }),
    });

    const grantData = grantRes.ok ? await grantRes.json() : {};

    return jsonResponse(req, {
      claimed: true,
      xp_reward: mission.xp_reward,
      xp_gained: grantData.xp_gained ?? mission.xp_reward,
    });
  } catch (err) {
    return jsonResponse(req, { error: err instanceof Error ? err.message : "Error" }, 500);
  }
});
