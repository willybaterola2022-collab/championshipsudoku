import { Lock, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnlocks, type SudokuUnlockRow } from "@/hooks/useUnlocks";
import { cn } from "@/lib/utils";

function groupLabel(type: string | undefined): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("theme")) return "Temas";
  if (t.includes("variant")) return "Variantes";
  if (t.includes("diff")) return "Dificultades";
  if (t.includes("feature")) return "Funciones";
  return "Otros";
}

export function UnlockProgressSection() {
  const { profile } = useAuth();
  const level = profile?.level ?? 1;
  const { data: rows, isLoading } = useUnlocks();

  const grouped = useMemo(() => {
    const m = new Map<string, SudokuUnlockRow[]>();
    for (const r of rows ?? []) {
      const g = groupLabel(r.unlock_type as string | undefined);
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(r);
    }
    return m;
  }, [rows]);

  if (isLoading) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" data-placeholder />
    );
  }

  if (!rows?.length) {
    return (
      <p className="text-sm text-muted-foreground" data-placeholder>
        Progresión de desbloqueos no disponible (reintentá más tarde).
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([groupName, items]) => (
        <div key={groupName}>
          <h3 className="mb-2 font-serif text-lg text-primary">{groupName}</h3>
          <ul className="space-y-2">
            {items.map((row) => {
              const req = (row.required_level as number | undefined) ?? 1;
              const unlocked = level >= req;
              const gap = Math.max(0, req - level);
              const name = (row.name as string | undefined) || (row.key as string) || "Desbloqueo";
              const desc = (row.description as string | null) ?? "";

              return (
                <li
                  key={`${row.key}-${row.id}`}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                    unlocked ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-muted/20 opacity-90"
                  )}
                >
                  {unlocked ? (
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{name}</p>
                    {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      {unlocked ? "Desbloqueado" : `Nivel ${req} requerido · te faltan ${gap} nivel(es)`}
                    </p>
                  </div>
                  <div className="w-full min-w-[120px] sm:w-32">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          unlocked ? "bg-amber-500/80" : "bg-primary/40"
                        )}
                        style={{ width: `${Math.min(100, (level / req) * 100)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
