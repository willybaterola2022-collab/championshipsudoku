import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface FeaturedPuzzleRow {
  id: string;
  puzzle?: string;
  solution?: string;
  difficulty: string;
  variant?: string;
  techniques_required?: string[] | null;
  [key: string]: unknown;
}

export function useFeaturedPuzzles(limit = 5) {
  return useQuery({
    queryKey: ["featured-sudoku-puzzles", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_featured_sudoku_puzzles", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as FeaturedPuzzleRow[];
    },
  });
}
