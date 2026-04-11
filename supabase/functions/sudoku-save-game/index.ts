// sudoku-save-game
// Auth: JWT required
// Verifies solution server-side, inserts session, chains internally to sudoku-grant-xp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";

interface Body {
  puzzle_id: string | null;
  difficulty: "easy" | "medium" | "hard" | "expert" | "fiendish";
  variant: "classic" | "killer";
  time_ms: number;
  errors: number;
  hints_used: number;
  board_state: number[][];
  solution: number[][];
}

function boardsMatch(a: number[][], b: number[][]): boolean {
  if (a.length !== 9 || b.length !== 9) return false;
  for (let r = 0; r < 9; r++) {
    if (a[r].length !== 9 || b[r].length !== 9) return false;
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function isComplete(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!board[r][c] || board[r][c] < 1 || board[r][c] > 9) return false;
    }
  }
  return true;
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

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse(req, { error: "Invalid token" }, 401);
    }
    const user = userData.user;

    const body = (await req.json()) as Body;

    // Validate shape
    if (!body.board_state || !body.solution || !body.difficulty || !body.variant) {
      return jsonResponse(req, { error: "Missing required fields" }, 400);
    }

    // Verify server-side
    if (!isComplete(body.board_state)) {
      return jsonResponse(req, { error: "Board is not complete" }, 400);
    }
    if (!boardsMatch(body.board_state, body.solution)) {
      return jsonResponse(req, { error: "Solution does not match board_state" }, 400);
    }

    // Insert session using service role
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: sessionRow, error: insertErr } = await admin
      .from("sudoku_game_sessions")
      .insert({
        user_id: user.id,
        puzzle_id: body.puzzle_id,
        difficulty: body.difficulty,
        variant: body.variant,
        time_ms: body.time_ms,
        errors: body.errors,
        hints_used: body.hints_used,
        completed: true,
        perfect: body.errors === 0,
        board_state: body.board_state,
      })
      .select("id")
      .single();

    if (insertErr || !sessionRow) {
      return jsonResponse(req, { error: "Failed to save session", detail: insertErr?.message }, 500);
    }

    // Chain to grant-xp via internal secret
    const grantRes = await fetch(`${supabaseUrl}/functions/v1/sudoku-grant-xp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        user_id: user.id,
        session_id: sessionRow.id,
        difficulty: body.difficulty,
        variant: body.variant,
        time_ms: body.time_ms,
        errors: body.errors,
        hints_used: body.hints_used,
        is_daily: false,
      }),
    });

    const grantData = grantRes.ok ? await grantRes.json() : {};

    return jsonResponse(req, {
      session_id: sessionRow.id,
      verified: true,
      xp_gained: grantData.xp_gained ?? 0,
      new_xp_total: grantData.new_xp_total ?? null,
      new_level: grantData.new_level ?? null,
      level_up: grantData.level_up ?? false,
      achievements_unlocked: grantData.achievements_unlocked ?? [],
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
