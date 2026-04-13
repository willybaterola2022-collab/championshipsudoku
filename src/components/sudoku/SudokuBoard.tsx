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
  diagonal?: boolean;
  /** Default 9. Use 6 para Mini Sudoku (2×3 cajas). */
  gridSize?: 6 | 9;
  /** Tutorial: una celda con anillo dorado pulsante. */
  pulseTarget?: { row: number; col: number } | null;
}

export function SudokuBoard({
  board,
  selectedCell,
  onSelectCell,
  sizeClassName = "w-[min(95vw,520px)] max-w-full",
  animateStagger = false,
  className,
  diagonal = false,
  gridSize = 9,
  pulseTarget = null,
}: SudokuBoardProps) {
  const n = gridSize;
  const cells = n * n;
  return (
    <div
      className={cn(
        "glow-gold mx-auto rounded-lg border border-[hsl(var(--sudoku-border-thick))] bg-card/40 p-1 shadow-xl",
        sizeClassName,
        className
      )}
    >
      <div
        className={cn(
          "grid aspect-square overflow-hidden rounded-md",
          n === 6 ? "grid-cols-6 grid-rows-6" : "grid-cols-9 grid-rows-9"
        )}
      >
        {Array.from({ length: cells }, (_, i) => {
          const row = Math.floor(i / n);
          const col = i % n;
          return (
            <SudokuCell
              key={`${row}-${col}`}
              board={board}
              row={row}
              col={col}
              selected={selectedCell}
              onSelect={onSelectCell}
              staggerDelayMs={animateStagger ? row * 20 + col * 3 : 0}
              diagonal={diagonal}
              gridSize={gridSize}
              pulseTarget={Boolean(pulseTarget && pulseTarget.row === row && pulseTarget.col === col)}
            />
          );
        })}
      </div>
    </div>
  );
}
