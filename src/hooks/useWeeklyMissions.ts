import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function getMondayUtcIso(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

export interface MissionWithProgress {
  id: string;
  week_start: string;
  title: string;
  description: string | null;
  target_value: number;
  xp_reward: number;
  progress: {
    mission_id: string;
    current_value: number;
    completed: boolean;
    claimed: boolean;
  } | null;
}

export function useWeeklyMissions() {
  const { user } = useAuth();
  const weekStart = getMondayUtcIso(new Date());

  return useQuery({
    queryKey: ["sudoku-weekly-missions", weekStart, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MissionWithProgress[]> => {
      const { data: missions, error: e1 } = await supabase
        .from("sudoku_weekly_missions")
        .select("*")
        .eq("week_start", weekStart);

      if (e1) throw e1;
      if (!missions?.length) return [];

      const ids = missions.map((m) => m.id as string);
      const { data: progressRows, error: e2 } = await supabase
        .from("sudoku_mission_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("mission_id", ids);

      if (e2) throw e2;

      return missions.map((m) => {
        const raw = m as Record<string, unknown>;
        const prog = progressRows?.find((p) => (p as { mission_id: string }).mission_id === raw.id) as
          | {
              mission_id: string;
              current_value?: number;
              completed?: boolean;
              claimed?: boolean;
            }
          | undefined;
        return {
          id: String(raw.id),
          week_start: String(raw.week_start),
          title: (raw.title as string) ?? "Misión",
          description: (raw.description as string | null) ?? null,
          target_value: Number(raw.target_value ?? 0),
          xp_reward: Number(raw.xp_reward ?? 0),
          progress: prog
            ? {
                mission_id: prog.mission_id,
                current_value: Number(prog.current_value ?? 0),
                completed: Boolean(prog.completed),
                claimed: Boolean(prog.claimed),
              }
            : null,
        };
      });
    },
  });
}
