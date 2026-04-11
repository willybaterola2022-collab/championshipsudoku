// sudoku-leaderboard
// Auth: none (public read)
// Rate: 30/min per IP
// Returns top N entries for daily or all-time rankings.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, getIdentifier, getServiceClient } from "../_shared/rateLimit.ts";

interface Body {
  type: "daily" | "all_time_solved" | "all_time_perfect";
  difficulty?: "easy" | "medium" | "hard" | "expert" | "fiendish" | null;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const service = getServiceClient();
    const id = getIdentifier(req, null);
    const rl = await checkRateLimit(service, id, "sudoku-leaderboard", 30);
    if (!rl.allowed) {
      return jsonResponse(req, { error: "Rate limit exceeded", retry_after_ms: rl.retry_after_ms }, 429);
    }

    const body = (await req.json()) as Body;
    const limit = Math.min(body.limit ?? 20, 100);

    if (body.type === "daily") {
      // @ts-expect-error runtime typing
      const { data, error } = await service.rpc("get_sudoku_daily_leaderboard", { p_limit: limit });
      if (error) return jsonResponse(req, { error: "Query failed", detail: error.message }, 500);
      return jsonResponse(req, {
        entries: data ?? [],
        total: data?.length ?? 0,
        as_of: new Date().toISOString(),
      });
    }

    if (body.type === "all_time_solved") {
      // @ts-expect-error runtime typing
      let q = service
        .from("profiles")
        .select("user_id, display_name, username, sudoku_puzzles_solved, sudoku_best_streak")
        .order("sudoku_puzzles_solved", { ascending: false })
        .limit(limit);

      const { data, error } = await q;
      if (error) return jsonResponse(req, { error: "Query failed", detail: error.message }, 500);

      const entries = (data ?? []).map((row: Record<string, unknown>, i: number) => ({
        rank: i + 1,
        user_id: row.user_id,
        display_name: row.display_name ?? row.username ?? "Anonymous",
        puzzles_solved: row.sudoku_puzzles_solved,
        best_streak: row.sudoku_best_streak,
      }));

      return jsonResponse(req, { entries, total: entries.length, as_of: new Date().toISOString() });
    }

    return jsonResponse(req, { error: "Unknown leaderboard type" }, 400);
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
