import { useQuery } from "@tanstack/react-query";
import { Award, RefreshCw } from "lucide-react";
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
  /** Mensaje cuando no hay filas (por defecto según tipo). */
  emptyMessage?: string;
}

export function Leaderboard({ type, limit = 20, className }: LeaderboardProps) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["sudoku-leaderboard", type, limit],
    retry: (failureCount, err) => {
      const msg = String(err?.message ?? err ?? "");
      if (failureCount < 2 && (msg.includes("429") || msg.toLowerCase().includes("rate"))) return true;
      return failureCount < 1;
    },
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
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
        <p className="text-sm text-destructive">No se pudo cargar el ranking. Intentá de nuevo.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
          Reintentar
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    const defaultEmpty =
      type === "daily"
        ? "Sé el primero en completar el puzzle de hoy — la tabla se llena cuando hay resultados."
        : "Aún no hay datos de ranking global.";
    return (
      <p className="text-center text-sm text-muted-foreground">
        {emptyMessage ?? defaultEmpty}
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
