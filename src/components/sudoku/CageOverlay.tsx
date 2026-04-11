import type { Cage } from "@/lib/sudoku/killer-types";
import { cn } from "@/lib/utils";

interface CageOverlayProps {
  cages: Cage[];
  className?: string;
}

export function CageOverlay({ cages, className }: CageOverlayProps) {
  const labelForFirst: Record<string, number> = {};
  for (const cage of cages) {
    const sorted = [...cage.cells].sort((a, b) => a.row - b.row || a.col - b.col);
    const first = sorted[0];
    labelForFirst[`${first.row}-${first.col}`] = cage.sum;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 grid grid-cols-9 grid-rows-9 rounded-md",
        className
      )}
    >
      {Array.from({ length: 81 }, (_, i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const sum = labelForFirst[`${row}-${col}`];
        return (
          <div key={`${row}-${col}`} className="relative">
            {sum != null && (
              <span className="absolute left-0.5 top-0.5 text-[10px] font-bold text-primary sm:text-xs">
                {sum}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
