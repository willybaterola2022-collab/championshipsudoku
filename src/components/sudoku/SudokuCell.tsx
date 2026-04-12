import { cn } from "@/lib/utils";
import type { Board } from "@/lib/sudoku/types";

interface SudokuCellProps {
  board: Board;
  row: number;
  col: number;
  selected: { row: number; col: number } | null;
  onSelect: (row: number, col: number) => void;
  staggerDelayMs?: number;
}

export function SudokuCell({
  board,
  row,
  col,
  selected,
  onSelect,
  staggerDelayMs = 0,
}: SudokuCellProps) {
  const cell = board[row][col];
  const isSelected = selected?.row === row && selected?.col === col;

  let highlight = false;
  let sameNumber = false;
  if (selected) {
    const sv = board[selected.row][selected.col].value;
    if (sv != null && cell.value === sv) sameNumber = true;
    if (selected.row === row || selected.col === col) highlight = true;
    const br = Math.floor(row / 3);
    const bc = Math.floor(col / 3);
    const sbr = Math.floor(selected.row / 3);
    const sbc = Math.floor(selected.col / 3);
    if (br === sbr && bc === sbc) highlight = true;
  }

  const thickRight = (col + 1) % 3 === 0 && col < 8;
  const thickBottom = (row + 1) % 3 === 0 && row < 8;

  return (
    <button
      type="button"
      aria-label={`Celda ${row + 1}-${col + 1}`}
      style={{ animationDelay: `${staggerDelayMs}ms` }}
      className={cn(
        "relative flex aspect-square min-h-0 min-w-0 items-center justify-center border border-[hsl(var(--sudoku-border-thin))] text-lg font-semibold transition-colors sm:text-xl",
        "outline-none focus-visible:z-[2] focus-visible:ring-2 focus-visible:ring-[hsl(var(--sudoku-cell-selected))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--sudoku-border-thin))]",
        thickRight && "border-r-[3px] border-r-[hsl(var(--sudoku-border-thick))]",
        thickBottom && "border-b-[3px] border-b-[hsl(var(--sudoku-border-thick))]",
        cell.isError && "animate-cell-error bg-[hsla(var(--sudoku-cell-error)/0.35)] text-destructive",
        !cell.isError && cell.isGiven && "bg-[hsla(var(--sudoku-cell)/0.95)] text-[hsl(var(--sudoku-cell-given))]",
        !cell.isError &&
          !cell.isGiven &&
          cell.value != null &&
          "animate-cell-pop text-[hsl(var(--sudoku-cell-user))]",
        !cell.isError && !cell.isGiven && cell.value == null && "bg-[hsl(var(--sudoku-cell))]",
        isSelected && "z-[1] ring-2 ring-[hsl(var(--sudoku-cell-selected))] ring-offset-0",
        !isSelected && sameNumber && "bg-[hsla(var(--sudoku-cell-same-number)/0.5)]",
        !isSelected && highlight && !sameNumber && "bg-[hsla(var(--sudoku-cell-highlight)/0.6)]",
        "active:scale-[0.97]"
      )}
      onClick={() => onSelect(row, col)}
    >
      {cell.value != null ? (
        <span>{cell.value}</span>
      ) : (
        <div className="sudoku-notes grid h-full w-full grid-cols-3 grid-rows-3 gap-px p-0.5 text-[9px] font-normal leading-none text-muted-foreground sm:text-[10px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className="flex items-center justify-center">
              {cell.notes[n] ? n : ""}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
