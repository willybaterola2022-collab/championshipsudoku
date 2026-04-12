import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SudokuUnlockRow {
  id?: string;
  unlock_type?: string;
  key?: string;
  name?: string;
  description?: string | null;
  required_level?: number;
  [key: string]: unknown;
}

export function useUnlocks() {
  const { profile } = useAuth();
  const level = profile?.level ?? 1;

  return useQuery({
    queryKey: ["sudoku-unlocks", level],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_sudoku_unlocks", { p_user_level: level });
      if (error) throw error;
      return (data ?? []) as SudokuUnlockRow[];
    },
  });
}

/** Si hay usuario autenticado, la dificultad requiere `requiredLevel`; si no, siempre abierto. */
export function isDifficultyLocked(
  userPresent: boolean,
  playerLevel: number,
  requiredLevel: number | undefined
): boolean {
  if (!userPresent) return false;
  if (requiredLevel == null) return false;
  return playerLevel < requiredLevel;
}
