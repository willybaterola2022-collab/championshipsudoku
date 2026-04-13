// sudoku-create-challenge
// Auth: JWT optional (anonymous challenges allowed)
// Creates a shareable challenge link from a completed puzzle.

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
    const { puzzle, solution, difficulty, variant, time_ms, errors } = body;

    if (!puzzle || !solution || !difficulty) {
      return jsonResponse(req, { error: "Missing puzzle, solution, or difficulty" }, 400);
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: challenge, error } = await admin
      .from("sudoku_challenges")
      .insert({
        creator_id: userId,
        puzzle: typeof puzzle === "string" ? puzzle : JSON.stringify(puzzle),
        solution: typeof solution === "string" ? solution : JSON.stringify(solution),
        difficulty,
        variant: variant ?? "classic",
        creator_time_ms: time_ms ?? null,
        creator_errors: errors ?? 0,
      })
      .select("id, code")
      .single();

    if (error) return jsonResponse(req, { error: error.message }, 500);

    return jsonResponse(req, {
      challenge_id: challenge.id,
      code: challenge.code,
      url: `https://championshipsudoku.vercel.app/challenge/${challenge.code}`,
    });
  } catch (err) {
    return jsonResponse(req, { error: err instanceof Error ? err.message : "Error" }, 500);
  }
});
