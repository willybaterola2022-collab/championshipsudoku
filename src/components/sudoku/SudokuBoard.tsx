import { cn } from "@/lib/utils";
import type { Board } from "@/lib/sudoku/types";
import { SudokuCell } from "./SudokuCell";

interface SudokuBoardProps {
  board: Board;
  selectedCell: { row: number; col: number } | null;
  onSelectCell: (row: number, col: number) => void;
  sizeClassName?: string;
  animateStagger?: boolean;
  className?: string;
}

export function SudokuBoard({
  board,
  selectedCell,
  onSelectCell,
  sizeClassName = "w-[min(95vw,520px)] max-w-full",
  animateStagger = false,
  className,
}: SudokuBoardProps) {
  return (
    <div
      className={cn(
        "glow-gold mx-auto rounded-lg border border-[hsl(var(--sudoku-border-thick))] bg-card/40 p-1 shadow-xl",
        sizeClassName,
        className
      )}
    >
      <div className="grid aspect-square grid-cols-9 grid-rows-9 overflow-hidden rounded-md">
        {Array.from({ length: 81 }, (_, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          return (
            <SudokuCell
              key={`${row}-${col}`}
              board={board}
              row={row}
              col={col}
              selected={selectedCell}
              onSelect={onSelectCell}
              staggerDelayMs={animateStagger ? row * 20 + col * 3 : 0}
            />
          );
        })}
      </div>
    </div>
  );
}
