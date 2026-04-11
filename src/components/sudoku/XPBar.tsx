import { cn } from "@/lib/utils";
import type { PlayerProgressState } from "@/hooks/usePlayerProgress";
import type { Rank } from "@/lib/sudoku/types";

interface XPBarProps {
  progress: PlayerProgressState;
  rank: Rank;
  className?: string;
}

export function XPBar({ progress, rank, className }: XPBarProps) {
  const pct = Math.min(100, Math.round((progress.xp / Math.max(1, progress.xpToNext)) * 100));
  return (
    <div className={cn("min-w-[140px] space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Nv. {progress.level} — {rank}
        </span>
        <span className="tabular-nums">
          {progress.xp}/{progress.xpToNext} XP
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
