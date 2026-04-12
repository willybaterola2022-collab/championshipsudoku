// Sudoku submission pipeline. Mirrors chess `gameService.ts` pattern.
// Owned by: Claude Code. Cursor uses this — never reimplements it.
//
// Rule: auth check at the TOP (before any network calls).
// If not authed → save to localStorage under "pending_sync" for later one-time sync.

import { supabase } from "@/integrations/supabase/client";
import type { Difficulty, Variant } from "@/lib/sudoku/types";

export interface SubmitPayload {
  puzzleId: string | null;
  difficulty: Difficulty;
  variant: Variant;
  timeMs: number;
  errors: number;
  hintsUsed: number;
  boardState: number[][];
  solution: number[][];
  isDaily?: boolean;
  challengeId?: string | null;
}

export interface SubmitResult {
  persisted: boolean;
  sessionId?: string;
  xpGained?: number;
  newXpTotal?: number;
  newLevel?: number;
  levelUp?: boolean;
  achievementsUnlocked?: string[];
  localPayload?: SubmitPayload;
  error?: string;
}

const PENDING_KEY = "sudoku:pending_sync";

/** Partidas completadas offline pendientes de envío al servidor. */
export function getPendingSyncCount(): number {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return 0;
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

function stashPending(payload: SubmitPayload): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const list: SubmitPayload[] = raw ? JSON.parse(raw) : [];
    list.push(payload);
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    // localStorage may be unavailable (private mode). Silent fail — UI still shows result.
  }
}

export const sudokuService = {
  async submitPuzzleResult(payload: SubmitPayload): Promise<SubmitResult> {
    // 1. Auth check at the TOP.
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      // Not authed — stash for later sync, return localPayload.
      stashPending(payload);
      return { persisted: false, localPayload: payload };
    }

    try {
      // 2. Daily challenge path uses a different endpoint.
      if (payload.isDaily && payload.challengeId) {
        const { data, error } = await supabase.functions.invoke("sudoku-daily-submit", {
          body: {
            challenge_id: payload.challengeId,
            time_ms: payload.timeMs,
            errors: payload.errors,
            hints_used: payload.hintsUsed,
            board_state: payload.boardState,
          },
        });
        if (error) throw error;
        return {
          persisted: true,
          xpGained: data?.xp_gained,
          achievementsUnlocked: data?.achievements_unlocked ?? [],
        };
      }

      // 3. Normal game path.
      const { data, error } = await supabase.functions.invoke("sudoku-save-game", {
        body: {
          puzzle_id: payload.puzzleId,
          difficulty: payload.difficulty,
          variant: payload.variant,
          time_ms: payload.timeMs,
          errors: payload.errors,
          hints_used: payload.hintsUsed,
          board_state: payload.boardState,
          solution: payload.solution,
        },
      });

      if (error) throw error;

      return {
        persisted: true,
        sessionId: data?.session_id,
        xpGained: data?.xp_gained,
        newXpTotal: data?.new_xp_total,
        newLevel: data?.new_level,
        levelUp: data?.level_up,
        achievementsUnlocked: data?.achievements_unlocked ?? [],
      };
    } catch (err) {
      // Network or server error — stash and surface.
      stashPending(payload);
      return {
        persisted: false,
        localPayload: payload,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /** Called once after successful login to flush any offline games. */
  async syncPending(): Promise<{ synced: number; failed: number }> {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return { synced: 0, failed: 0 };

    let list: SubmitPayload[];
    try {
      list = JSON.parse(raw);
    } catch {
      localStorage.removeItem(PENDING_KEY);
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remaining: SubmitPayload[] = [];

    for (const payload of list) {
      const result = await this.submitPuzzleResult(payload);
      if (result.persisted) synced++;
      else {
        failed++;
        if (result.localPayload) remaining.push(result.localPayload);
      }
    }

    if (remaining.length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));

    return { synced, failed };
  },
};
