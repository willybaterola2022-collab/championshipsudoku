import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWeeklyMissions } from "@/hooks/useWeeklyMissions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function WeeklyMissions() {
  const qc = useQueryClient();
  const { data: missions, isLoading, error } = useWeeklyMissions();

  const claim = async (missionId: string) => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke<{
        claimed?: boolean;
        xp_reward?: number;
        already?: boolean;
      }>("sudoku-claim-mission", { body: { mission_id: missionId } });
      if (fnErr) throw fnErr;
      if (data?.already) {
        toast.message("Ya reclamado");
      } else {
        toast.success(`+${data?.xp_reward ?? 0} XP`);
      }
      await qc.invalidateQueries({ queryKey: ["sudoku-weekly-missions"] });
      await qc.invalidateQueries({ queryKey: ["profile-sudoku-best"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reclamar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando misiones…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudieron cargar las misiones semanales.
      </p>
    );
  }

  if (!missions?.length) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="weekly-missions-heading">
      <h2 id="weekly-missions-heading" className="font-serif text-lg text-primary">
        Misiones de la semana
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {missions.map((m) => {
          const p = m.progress;
          const target = Math.max(1, m.target_value);
          const cur = p?.current_value ?? 0;
          const pct = Math.min(100, Math.round((cur / target) * 100));
          const done = p?.completed ?? false;
          const claimed = p?.claimed ?? false;

          return (
            <div
              key={m.id}
              className="glass rounded-xl border border-border/60 p-4 text-sm shadow-sm"
            >
              <p className="font-semibold text-foreground">{m.title}</p>
              {m.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
              ) : null}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {cur} / {target} · +{m.xp_reward} XP
              </p>
              {done && !claimed ? (
                <button
                  type="button"
                  onClick={() => void claim(m.id)}
                  className={cn(
                    "mt-3 w-full rounded-lg border border-primary bg-primary/15 py-2 text-xs font-semibold text-primary",
                    "min-h-[44px]"
                  )}
                >
                  Reclamar
                </button>
              ) : claimed ? (
                <p className="mt-3 text-center text-xs font-medium text-emerald-500">Reclamado</p>
              ) : (
                <p className="mt-3 text-center text-xs text-muted-foreground">En progreso</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
