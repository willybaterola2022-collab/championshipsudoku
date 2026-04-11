// sudoku-daily-cron
// Auth: x-internal-secret (called by pg_cron at 00:00 UTC)
// Idempotent: if today's challenge exists, return existing without error.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_SECRET")) {
    return jsonResponse(req, { error: "Forbidden" }, 403);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const today = new Date().toISOString().split("T")[0];

    // Idempotency: check if today exists
    // @ts-expect-error runtime typing
    const { data: existing } = await admin
      .from("sudoku_daily_challenges")
      .select("id, puzzle_id, difficulty")
      .eq("challenge_date", today)
      .maybeSingle();

    if (existing) {
      return jsonResponse(req, {
        challenge_date: today,
        puzzle_id: existing.puzzle_id,
        difficulty: existing.difficulty,
        already_existed: true,
      });
    }

    // Select a random medium puzzle with low times_played
    // @ts-expect-error runtime typing
    const { data: puzzles, error: selectErr } = await admin
      .from("sudoku_puzzles")
      .select("id")
      .eq("difficulty", "medium")
      .eq("variant", "classic")
      .order("times_played", { ascending: true })
      .limit(50);

    if (selectErr || !puzzles || puzzles.length === 0) {
      return jsonResponse(
        req,
        { error: "No puzzles available", detail: selectErr?.message },
        503
      );
    }

    const pick = puzzles[Math.floor(Math.random() * puzzles.length)];

    // @ts-expect-error runtime typing
    const { data: inserted, error: insertErr } = await admin
      .from("sudoku_daily_challenges")
      .insert({
        puzzle_id: pick.id,
        challenge_date: today,
        difficulty: "medium",
        bonus_xp: 50,
      })
      .select("id")
      .single();

    if (insertErr) {
      // 23505 unique violation = race, someone else inserted it first — treat as success
      if (insertErr.code === "23505") {
        return jsonResponse(req, { challenge_date: today, puzzle_id: pick.id, difficulty: "medium", already_existed: true });
      }
      return jsonResponse(req, { error: "Failed to insert daily", detail: insertErr.message }, 500);
    }

    return jsonResponse(req, {
      challenge_date: today,
      puzzle_id: pick.id,
      difficulty: "medium",
      already_existed: false,
      daily_id: inserted.id,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
