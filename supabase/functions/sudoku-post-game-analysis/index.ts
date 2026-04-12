// sudoku-post-game-analysis
// Auth: JWT or x-internal-secret
// Called after puzzle completion to calculate percentile and stats.
// Chained from sudoku-save-game (fire-and-forget).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

interface Body {
  session_id: string;
  user_id: string;
  difficulty: string;
  time_ms: number;
  errors: number;
  variant: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_SECRET")) {
    return jsonResponse(req, { error: "Forbidden" }, 403);
  }

  try {
    const body = (await req.json()) as Body;
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key, { auth: { persistSession: false } });

    // Calculate percentile: how does this time compare to all completed sessions of same difficulty?
    const { count: totalSessions } = await admin
      .from("sudoku_game_sessions")
      .select("*", { count: "exact", head: true })
      .eq("difficulty", body.difficulty)
      .eq("completed", true);

    const { count: fasterSessions } = await admin
      .from("sudoku_game_sessions")
      .select("*", { count: "exact", head: true })
      .eq("difficulty", body.difficulty)
      .eq("completed", true)
      .lt("time_ms", body.time_ms);

    const total = totalSessions ?? 1;
    const faster = fasterSessions ?? 0;
    const percentile = total > 1 ? Math.round(((total - faster) / total) * 100) : 100;

    // Average time for this difficulty
    const { data: avgData } = await admin
      .from("sudoku_game_sessions")
      .select("time_ms")
      .eq("difficulty", body.difficulty)
      .eq("completed", true)
      .order("created_at", { ascending: false })
      .limit(100);

    const avgTimeMs = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((s: number, r: { time_ms: number }) => s + r.time_ms, 0) / avgData.length)
      : null;

    // User's personal best for this difficulty
    const { data: bestData } = await admin
      .from("sudoku_game_sessions")
      .select("time_ms")
      .eq("user_id", body.user_id)
      .eq("difficulty", body.difficulty)
      .eq("completed", true)
      .order("time_ms", { ascending: true })
      .limit(1);

    const personalBestMs = bestData?.[0]?.time_ms ?? null;
    const isPersonalBest = personalBestMs === null || body.time_ms <= personalBestMs;

    // User's total games this difficulty
    const { count: userTotal } = await admin
      .from("sudoku_game_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", body.user_id)
      .eq("difficulty", body.difficulty)
      .eq("completed", true);

    // Update session with percentile
    await admin
      .from("sudoku_game_sessions")
      .update({ percentile })
      .eq("id", body.session_id);

    return jsonResponse(req, {
      percentile,
      avg_time_ms: avgTimeMs,
      personal_best_ms: personalBestMs,
      is_personal_best: isPersonalBest,
      total_sessions_difficulty: total,
      user_total_difficulty: userTotal ?? 0,
      faster_than_percent: percentile,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
