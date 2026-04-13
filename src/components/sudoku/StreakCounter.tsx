import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  days: number;
  className?: string;
  /** Si hoy ya hubo partida (no perder racha). */
  playedToday?: boolean;
}

export function StreakCounter({ days, className, playedToday }: StreakCounterProps) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}>
      <Flame className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
      <span>
        Racha: <span className="font-semibold text-foreground">{days}</span> días
      </span>
      {playedToday ? (
        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">Hoy ✓</span>
      ) : (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
          Jugá hoy para no perderla
        </span>
      )}
    </div>
  );
}
