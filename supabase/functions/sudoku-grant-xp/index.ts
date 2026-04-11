// sudoku-grant-xp — INTERNAL ONLY
// Auth: x-internal-secret required
// Idempotent via xp_grants unique(user_id, action_type, ref_id).
// Never call from client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

interface Body {
  user_id: string;
  session_id: string;
  difficulty: "easy" | "medium" | "hard" | "expert" | "fiendish";
  variant: "classic" | "killer";
  time_ms: number;
  errors: number;
  hints_used: number;
  is_daily?: boolean;
}

const BASE_XP: Record<Body["difficulty"], number> = {
  easy: 30,
  medium: 50,
  hard: 80,
  expert: 120,
  fiendish: 200,
};

function computeXp(b: Body): number {
  let xp = BASE_XP[b.difficulty];
  let multiplier = 1;
  if (b.errors === 0) multiplier += 0.2;
  if (b.time_ms < 300_000) multiplier += 0.15;
  if (b.hints_used === 0) multiplier += 0.1;
  if (b.variant === "killer") multiplier += 0.3;
  xp = Math.floor(xp * multiplier);
  if (b.is_daily) xp += 50;
  return xp;
}

function xpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

async function checkAchievements(
  admin: ReturnType<typeof createClient>,
  userId: string,
  payload: Body,
  profileAfter: { sudoku_puzzles_solved: number; sudoku_current_streak: number }
): Promise<string[]> {
  const unlocked: string[] = [];

  const candidates: Array<{ key: string; check: () => boolean }> = [
    { key: "sudoku_first_puzzle", check: () => profileAfter.sudoku_puzzles_solved >= 1 },
    { key: "sudoku_10_puzzles", check: () => profileAfter.sudoku_puzzles_solved >= 10 },
    { key: "sudoku_50_puzzles", check: () => profileAfter.sudoku_puzzles_solved >= 50 },
    { key: "sudoku_streak_3", check: () => profileAfter.sudoku_current_streak >= 3 },
    { key: "sudoku_streak_7", check: () => profileAfter.sudoku_current_streak >= 7 },
    { key: "sudoku_perfect", check: () => payload.errors === 0 },
    { key: "sudoku_speed", check: () => payload.difficulty === "easy" && payload.time_ms < 300_000 },
    { key: "sudoku_hard", check: () => payload.difficulty === "hard" || payload.difficulty === "expert" || payload.difficulty === "fiendish" },
    { key: "sudoku_expert", check: () => payload.difficulty === "expert" || payload.difficulty === "fiendish" },
    { key: "sudoku_killer", check: () => payload.variant === "killer" },
  ];

  for (const c of candidates) {
    if (!c.check()) continue;
    // Check not already unlocked
    // @ts-expect-error runtime typing
    const { data: ach } = await admin.from("achievements").select("id").eq("key", c.key).maybeSingle();
    if (!ach) continue;
    // @ts-expect-error runtime typing
    const { data: existing } = await admin
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", ach.id)
      .maybeSingle();
    if (existing) continue;
    // @ts-expect-error runtime typing
    const { error } = await admin.from("user_achievements").insert({
      user_id: userId,
      achievement_id: ach.id,
    });
    if (!error) unlocked.push(c.key);
  }

  return unlocked;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const xpGained = computeXp(body);

    // Idempotency: insert xp_grants with unique constraint
    // @ts-expect-error runtime typing
    const { error: grantErr } = await admin.from("xp_grants").insert({
      user_id: body.user_id,
      action_type: "sudoku_puzzle_solved",
      ref_id: body.session_id,
      xp_granted: xpGained,
    });

    if (grantErr) {
      // Unique violation = already granted
      if (grantErr.code === "23505") {
        return jsonResponse(req, { error: "XP already granted for this session", already_granted: true }, 409);
      }
      return jsonResponse(req, { error: "Failed to grant XP", detail: grantErr.message }, 500);
    }

    // Fetch current profile
    // @ts-expect-error runtime typing
    const { data: profile } = await admin
      .from("profiles")
      .select("xp, level, sudoku_puzzles_solved, sudoku_current_streak, sudoku_best_streak, sudoku_last_played_date")
      .eq("user_id", body.user_id)
      .maybeSingle();

    const currentXp = profile?.xp ?? 0;
    const currentLevel = profile?.level ?? 1;
    const currentSolved = profile?.sudoku_puzzles_solved ?? 0;
    const currentStreak = profile?.sudoku_current_streak ?? 0;
    const bestStreak = profile?.sudoku_best_streak ?? 0;
    const lastPlayed: string | null = profile?.sudoku_last_played_date ?? null;

    // Streak logic: consecutive days
    const today = new Date().toISOString().split("T")[0];
    let newStreak = currentStreak;
    if (lastPlayed !== today) {
      if (lastPlayed) {
        const diffDays = Math.floor(
          (new Date(today).getTime() - new Date(lastPlayed).getTime()) / 86_400_000
        );
        newStreak = diffDays === 1 ? currentStreak + 1 : 1;
      } else {
        newStreak = 1;
      }
    }
    const newBestStreak = Math.max(bestStreak, newStreak);

    // Level up loop
    let newXp = currentXp + xpGained;
    let newLevel = currentLevel;
    let levelUp = false;
    while (newXp >= xpToNext(newLevel) && newLevel < 50) {
      newXp -= xpToNext(newLevel);
      newLevel++;
      levelUp = true;
    }

    const newSolved = currentSolved + 1;

    // Update profile
    // @ts-expect-error runtime typing
    await admin
      .from("profiles")
      .update({
        xp: newXp,
        level: newLevel,
        sudoku_puzzles_solved: newSolved,
        sudoku_current_streak: newStreak,
        sudoku_best_streak: newBestStreak,
        sudoku_last_played_date: today,
      })
      .eq("user_id", body.user_id);

    // Check achievements
    const achievementsUnlocked = await checkAchievements(admin, body.user_id, body, {
      sudoku_puzzles_solved: newSolved,
      sudoku_current_streak: newStreak,
    });

    // Record xp_gained in the session
    // @ts-expect-error runtime typing
    await admin
      .from("sudoku_game_sessions")
      .update({ xp_gained: xpGained })
      .eq("id", body.session_id);

    return jsonResponse(req, {
      xp_gained: xpGained,
      new_xp_total: newXp,
      new_level: newLevel,
      level_up: levelUp,
      achievements_unlocked: achievementsUnlocked,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
