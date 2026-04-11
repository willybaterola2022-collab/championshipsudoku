import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export type LeaderboardType = "daily" | "all_time_solved";

interface Entry {
  rank: number;
  user_id: string;
  display_name: string;
  time_ms: number;
  errors: number;
  completed_at?: string;
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface LeaderboardProps {
  type: LeaderboardType;
  limit?: number;
  className?: string;
}

export function Leaderboard({ type, limit = 20, className }: LeaderboardProps) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sudoku-leaderboard", type, limit],
    queryFn: async () => {
      const { data: res, error: err } = await supabase.functions.invoke<{
        entries?: Entry[];
        total?: number;
      }>("sudoku-leaderboard", {
        body: { type, limit },
      });
      if (err) throw err;
      return res;
    },
  });

  const entries = data?.entries ?? [];

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el ranking. Intentá más tarde.
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Sé el primero en completar el puzzle de hoy.
      </p>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Jugador</th>
            <th className="py-2 pr-2">Tiempo</th>
            <th className="py-2">Errores</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={`${e.user_id}-${e.rank}`}
              className={cn(
                "border-b border-border/40",
                user?.id === e.user_id && "bg-primary/10"
              )}
            >
              <td className="py-2 pr-2 font-medium">
                <span className="inline-flex items-center gap-1">
                  {e.rank === 1 && <Award className="h-4 w-4 text-amber-400" />}
                  {e.rank === 2 && <Award className="h-4 w-4 text-slate-300" />}
                  {e.rank === 3 && <Award className="h-4 w-4 text-amber-700" />}
                  {e.rank}
                </span>
              </td>
              <td className="py-2 pr-2">{e.display_name || "Anónimo"}</td>
              <td className="tabular-nums py-2 pr-2">{fmtTime(e.time_ms)}</td>
              <td className="py-2">{e.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
