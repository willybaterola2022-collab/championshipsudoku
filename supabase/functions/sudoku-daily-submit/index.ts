// sudoku-daily-submit
// Auth: JWT required
// Rate: 30/hour per user
// Submit daily puzzle result, insert completion, return rank.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

interface Body {
  challenge_id: string;
  time_ms: number;
  errors: number;
  hints_used: number;
  board_state: number[][];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return jsonResponse(req, { error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalSecret = Deno.env.get("INTERNAL_SECRET")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return jsonResponse(req, { error: "Invalid token" }, 401);
    const user = userData.user;

    const body = (await req.json()) as Body;
    if (!body.challenge_id || !body.board_state) {
      return jsonResponse(req, { error: "Missing challenge_id or board_state" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Fetch daily + puzzle to verify solution
    // @ts-expect-error runtime typing
    const { data: daily } = await admin
      .from("sudoku_daily_challenges")
      .select("id, puzzle_id, difficulty, bonus_xp, challenge_date")
      .eq("id", body.challenge_id)
      .maybeSingle();

    if (!daily) return jsonResponse(req, { error: "Daily challenge not found" }, 404);

    // @ts-expect-error runtime typing
    const { data: puzzle } = await admin
      .from("sudoku_puzzles")
      .select("solution, variant")
      .eq("id", daily.puzzle_id)
      .maybeSingle();

    if (!puzzle) return jsonResponse(req, { error: "Puzzle not found" }, 404);

    const solution: number[][] = JSON.parse(puzzle.solution);

    // Verify
    let solved = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (body.board_state[r]?.[c] !== solution[r][c]) {
          solved = false;
          break;
        }
      }
      if (!solved) break;
    }

    if (!solved) return jsonResponse(req, { error: "Solution incorrect" }, 400);

    // Insert completion (unique constraint prevents double submit)
    // @ts-expect-error runtime typing
    const { error: insertErr } = await admin.from("sudoku_daily_completions").insert({
      user_id: user.id,
      challenge_id: daily.id,
      time_ms: body.time_ms,
      errors: body.errors,
      hints_used: body.hints_used,
      solved: true,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return jsonResponse(
          req,
          { error: "Already completed today", already_claimed: true, solved: true, xp_gained: 0 },
          409
        );
      }
      return jsonResponse(req, { error: "Failed to save", detail: insertErr.message }, 500);
    }

    // Chain to grant-xp with is_daily=true
    const grantRes = await fetch(`${supabaseUrl}/functions/v1/sudoku-grant-xp`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": internalSecret },
      body: JSON.stringify({
        user_id: user.id,
        session_id: `daily:${daily.id}:${user.id}`, // unique pseudo-session for idempotency
        difficulty: daily.difficulty,
        variant: puzzle.variant,
        time_ms: body.time_ms,
        errors: body.errors,
        hints_used: body.hints_used,
        is_daily: true,
      }),
    });
    const grantData = grantRes.ok ? await grantRes.json() : {};

    // Rank today
    // @ts-expect-error runtime typing
    const { count: totalCompletions } = await admin
      .from("sudoku_daily_completions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", daily.id);

    // @ts-expect-error runtime typing
    const { count: betterThan } = await admin
      .from("sudoku_daily_completions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", daily.id)
      .lt("time_ms", body.time_ms);

    const rank = (betterThan ?? 0) + 1;
    const percentile = totalCompletions
      ? Math.round(((totalCompletions - rank + 1) / totalCompletions) * 100)
      : 100;

    return jsonResponse(req, {
      solved: true,
      rank_today: rank,
      total_completions: totalCompletions ?? 1,
      xp_gained: grantData.xp_gained ?? 0,
      percentile,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
