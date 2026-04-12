import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function utcDayKey(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

interface ActivityCalendarProps {
  userId: string;
  className?: string;
}

/** Últimos 30 días (UTC): círculo verde si hubo partida, gris si no, dorado hoy. */
export function ActivityCalendar({ userId, className }: ActivityCalendarProps) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["sudoku-activity-calendar", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sudoku_game_sessions")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .eq("completed", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeDays = new Set<string>();
  for (const r of rows ?? []) {
    const t = r.created_at as string;
    if (t) activeDays.add(t.slice(0, 10));
  }

  const days: { key: string; isToday: boolean }[] = [];
  const todayKey = utcDayKey(new Date());
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = utcDayKey(d);
    days.push({ key, isToday: key === todayKey });
  }

  if (isLoading) {
    return (
      <div className={cn("h-16 animate-pulse rounded-lg bg-muted", className)} data-placeholder />
    );
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs text-muted-foreground">Actividad (30 días, UTC)</p>
      <div className="flex flex-wrap gap-1">
        {days.map(({ key, isToday }) => {
          const played = activeDays.has(key);
          return (
            <span
              key={key}
              title={key}
              className={cn(
                "h-3 w-3 rounded-full border border-border/50",
                isToday && "ring-1 ring-primary",
                played ? "bg-emerald-500/80" : "bg-muted",
                isToday && played && "bg-amber-500/90"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
