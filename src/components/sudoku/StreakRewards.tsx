import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FALLBACK: { days: number; reward: string; description: string }[] = [
  { days: 3, reward: "+50 XP", description: "Jugaste 3 días seguidos" },
  { days: 7, reward: "Tema exclusivo", description: "Tema Racha desbloqueado" },
  { days: 14, reward: "Badge", description: "Constante" },
  { days: 30, reward: "Badge dorado", description: "Dedicación dorada" },
  { days: 60, reward: "Título especial", description: "Maestro de la constancia" },
  { days: 100, reward: "Título legendario", description: "Centurión" },
];

function normalizeRows(data: unknown): { days: number; reward: string; description: string }[] {
  if (!Array.isArray(data) || data.length === 0) return FALLBACK;
  return data.map((row: Record<string, unknown>) => ({
    days: Number(row.days ?? row.day_threshold ?? 0),
    reward: String(row.reward ?? row.reward_label ?? row.title ?? "—"),
    description: String(row.description ?? row.desc ?? ""),
  })).filter((r) => r.days > 0);
}

interface StreakRewardsProps {
  streakDays: number;
  className?: string;
  compact?: boolean;
}

export function StreakRewards({ streakDays, className, compact }: StreakRewardsProps) {
  const { data: raw } = useQuery({
    queryKey: ["sudoku-streak-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_sudoku_streak_rewards");
      if (error) return null;
      return data;
    },
    staleTime: 60_000,
  });

  const milestones = normalizeRows(raw);
  const next = milestones.find((m) => streakDays < m.days);

  return (
    <div className={cn("rounded-xl border border-border/50 bg-muted/20 p-4", className)}>
      {!compact ? (
        <p className="mb-3 text-sm font-semibold text-foreground">Recompensas por racha</p>
      ) : null}
      {next ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Próximo: <span className="text-primary">{next.reward}</span> a los {next.days} días
          {compact ? "" : ` — ${next.description}`}
        </p>
      ) : (
        <p className="mb-3 text-xs text-green-400">¡Alcanzaste todos los hitos visibles!</p>
      )}
      <ul className="space-y-3">
        {milestones.map((m) => {
          const reached = streakDays >= m.days;
          const isNext = !reached && next?.days === m.days;
          return (
            <li
              key={m.days}
              className={cn(
                "flex gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm",
                reached && "border-primary/40 bg-primary/5",
                isNext && "animate-pulse border-primary/60 shadow-[0_0_12px_rgba(212,168,67,0.25)]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  reached ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {reached ? <Check className="h-4 w-4" /> : m.days}
              </span>
              <div>
                <p className="font-medium text-foreground">{m.reward}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                {!reached ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Faltan {Math.max(0, m.days - streakDays)} días
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
