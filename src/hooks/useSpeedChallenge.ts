import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Difficulty } from "@/lib/sudoku/types";

export interface SpeedChallengePayload {
  challenge_id: string;
  puzzle_id?: string;
  puzzle: number[][] | string;
  solution: number[][] | string;
  difficulty: string;
  starts_at: string;
  ends_at: string;
  completions?: number;
}

export function parseSpeedGrid(v: number[][] | string): number[][] {
  if (typeof v === "string") return JSON.parse(v) as number[][];
  return v;
}

export function useSpeedChallenge() {
  return useQuery({
    queryKey: ["speed-challenge-current"],
    queryFn: async (): Promise<SpeedChallengePayload | null> => {
      const { data, error } = await supabase.rpc("get_current_speed_challenge");
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
      if (!row) return null;
      const id = row.challenge_id ?? row.id;
      if (!id) return null;
      return {
        challenge_id: String(id),
        puzzle_id: row.puzzle_id as string | undefined,
        puzzle: row.puzzle as number[][] | string,
        solution: row.solution as number[][] | string,
        difficulty: String(row.difficulty ?? "medium"),
        starts_at: String(row.starts_at ?? ""),
        ends_at: String(row.ends_at ?? ""),
        completions: typeof row.completions === "number" ? row.completions : undefined,
      };
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function mapSpeedDifficulty(d: string): Difficulty {
  const x = d.toLowerCase();
  if (x === "easy" || x === "medium" || x === "hard" || x === "expert" || x === "fiendish") {
    return x;
  }
  return "medium";
}

export function useSpeedLeaderboard(challengeId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ["speed-leaderboard", challengeId, limit],
    enabled: Boolean(challengeId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_speed_leaderboard", {
        p_challenge_id: challengeId,
        p_limit: limit,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });
}
