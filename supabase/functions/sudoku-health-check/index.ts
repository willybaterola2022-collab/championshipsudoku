// sudoku-health-check
// Auth: none (public)
// Multi-check endpoint for CI + Vercel health probes + monitoring.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const checks = {
    db: false,
    sudoku_puzzles_count: 0,
    daily_exists_today: false,
    llm: false,
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // DB reachable
    // @ts-expect-error runtime typing
    const { count, error } = await admin
      .from("sudoku_puzzles")
      .select("*", { count: "exact", head: true });
    if (!error) {
      checks.db = true;
      checks.sudoku_puzzles_count = count ?? 0;
    }

    // Daily exists
    const today = new Date().toISOString().split("T")[0];
    // @ts-expect-error runtime typing
    const { data: daily } = await admin
      .from("sudoku_daily_challenges")
      .select("id")
      .eq("challenge_date", today)
      .maybeSingle();
    checks.daily_exists_today = !!daily;

    // LLM configured
    checks.llm = !!Deno.env.get("ANTHROPIC_API_KEY") || !!Deno.env.get("GEMINI_API_KEY");

    const ok = checks.db && checks.llm;
    return jsonResponse(
      req,
      { ok, checks, timestamp: new Date().toISOString() },
      ok ? 200 : 503
    );
  } catch (err) {
    return jsonResponse(
      req,
      {
        ok: false,
        checks,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});
