import { ChevronDown, Flame } from "lucide-react";
import { useState } from "react";
import { StreakRewards, useStreakMilestones } from "@/components/sudoku/StreakRewards";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  days: number;
  className?: string;
  /** Si hoy ya hubo partida (no perder racha). */
  playedToday?: boolean;
}

export function StreakCounter({ days, className, playedToday }: StreakCounterProps) {
  const { next } = useStreakMilestones(days);
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex min-w-0 flex-col gap-2 text-sm text-muted-foreground", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex flex-wrap items-center gap-2 text-left hover:text-foreground"
        aria-expanded={open}
      >
        <Flame className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
        <span className="min-w-0">
          Racha: <span className="font-semibold text-foreground">{days}</span> días
          {next ? (
            <>
              {" "}
              <span className="text-muted-foreground">
                — Próximo: {next.reward} a los {next.days} días
              </span>
            </>
          ) : null}
        </span>
        {playedToday ? (
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">Hoy ✓</span>
        ) : (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
            Jugá hoy para no perderla
          </span>
        )}
        <ChevronDown
          className={cn("ml-auto h-4 w-4 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <StreakRewards streakDays={days} compact /> : null}
    </div>
  );
}
