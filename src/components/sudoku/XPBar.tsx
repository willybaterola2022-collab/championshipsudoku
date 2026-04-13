import { cn } from "@/lib/utils";
import type { PlayerProgressState } from "@/hooks/usePlayerProgress";
import type { Rank } from "@/lib/sudoku/types";

interface XPBarProps {
  progress: PlayerProgressState;
  rank: Rank;
  className?: string;
  /** XP de tutorial guardado en cliente (pendiente de API). */
  tutorialXpPending?: number;
}

export function XPBar({ progress, rank, className, tutorialXpPending = 0 }: XPBarProps) {
  const xp = Number.isFinite(progress.xp) ? progress.xp : 0;
  const next = Number.isFinite(progress.xpToNext) && progress.xpToNext > 0 ? progress.xpToNext : 1;
  const pct = Math.min(100, Math.round((xp / next) * 100));
  return (
    <div className={cn("min-w-[140px] space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Nv. {progress.level} — {rank}
        </span>
        <span className="tabular-nums">
          {xp}/{next} XP
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {tutorialXpPending > 0 ? (
        <p className="text-[10px] leading-tight text-amber-200/90">
          +{tutorialXpPending} XP tutorial (local, pendiente sync)
        </p>
      ) : null}
    </div>
  );
}
