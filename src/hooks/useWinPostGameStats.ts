import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/sudoku/types";

export interface WinPostGameStats {
  percentile: number | null;
  isPersonalBest: boolean;
}

/**
 * Tras victoria: percentil desde la última fila de `sudoku_game_sessions` y PB vs snapshot de `sudoku_best_times` antes del refresh post-submit.
 */
export function useWinPostGameStats(opts: {
  userId: string | undefined;
  isCompleted: boolean;
  difficulty: Difficulty;
  timeMs: number;
}) {
  const { userId, isCompleted, difficulty, timeMs } = opts;

  const { data: bestTimesFromServer } = useQuery({
    queryKey: ["profile-sudoku-best", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("sudoku_best_times")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.sudoku_best_times ?? {}) as Partial<Record<Difficulty, number>>;
    },
  });

  /** Mejores tiempos previos a esta partida (snapshot al ganar). */
  const [bestSnapshot, setBestSnapshot] = useState<Partial<Record<Difficulty, number>> | null>(null);
  useEffect(() => {
    if (!isCompleted) {
      setBestSnapshot(null);
      return;
    }
    if (bestTimesFromServer !== undefined) {
      setBestSnapshot((prev) => (prev !== null ? prev : bestTimesFromServer));
    }
  }, [isCompleted, bestTimesFromServer]);

  const { data: sessionRow } = useQuery({
    queryKey: ["latest-sudoku-session-percentile", userId, isCompleted],
    enabled: Boolean(userId) && isCompleted,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 500));
      const { data, error } = await supabase
        .from("sudoku_game_sessions")
        .select("percentile, time_ms, difficulty")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { percentile: number | null; time_ms: number; difficulty: string } | null;
    },
    staleTime: 0,
    retry: 5,
    retryDelay: (n) => 400 * (n + 1),
  });

  const stats: WinPostGameStats = useMemo(() => {
    const prevBest = bestSnapshot?.[difficulty];
    const isPersonalBest =
      isCompleted && (prevBest == null || (typeof prevBest === "number" && timeMs < prevBest));
    const percentile =
      sessionRow?.percentile != null && Number.isFinite(sessionRow.percentile)
        ? Math.round(sessionRow.percentile)
        : null;
    return { percentile, isPersonalBest };
  }, [bestSnapshot, difficulty, isCompleted, sessionRow?.percentile, timeMs]);

  return stats;
}
