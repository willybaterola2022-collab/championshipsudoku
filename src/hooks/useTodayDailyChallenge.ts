import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/sudoku/types";

export interface DailyChallengeRow {
  id: string;
  puzzle_id: string;
  challenge_date: string;
  difficulty: Difficulty;
  bonus_xp: number;
  sudoku_puzzles: {
    id: string;
    puzzle: string;
    solution: string;
    difficulty: string;
  };
}

function utcToday(): string {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())).toISOString().slice(0, 10);
}

export function useTodayDailyChallenge() {
  const day = utcToday();
  return useQuery({
    queryKey: ["sudoku-daily-challenge", day],
    retry: 1,
    queryFn: async (): Promise<DailyChallengeRow | null> => {
      const { data: ch, error: e1 } = await supabase
        .from("sudoku_daily_challenges")
        .select("id, puzzle_id, challenge_date, difficulty, bonus_xp")
        .eq("challenge_date", day)
        .maybeSingle();

      if (e1) throw e1;
      if (!ch) return null;

      const { data: puzzle, error: e2 } = await supabase
        .from("sudoku_puzzles")
        .select("id, puzzle, solution, difficulty")
        .eq("id", ch.puzzle_id)
        .maybeSingle();

      if (e2) throw e2;
      if (!puzzle) return null;

      return {
        ...ch,
        sudoku_puzzles: puzzle,
      } as DailyChallengeRow;
    },
  });
}
