import { cn } from "@/lib/utils";
import type { Board } from "@/lib/sudoku/types";

interface NumPadProps {
  board: Board;
  onInput: (n: number) => void;
  disabled?: boolean;
  gridSize?: 6 | 9;
}

export function NumPad({ board, onInput, disabled, gridSize = 9 }: NumPadProps) {
  const nMax = gridSize;
  const counts = Array.from({ length: nMax }, (_, i) => i + 1).map((n) => {
    let c = 0;
    for (let r = 0; r < nMax; r++) {
      for (let col = 0; col < nMax; col++) {
        if (board[r][col].value === n) c++;
      }
    }
    return { n, c };
  });

  return (
    <div
      className={cn(
        "mx-auto grid max-w-sm gap-2 px-2 sm:gap-3",
        gridSize === 6 ? "grid-cols-3" : "grid-cols-3"
      )}
    >
      {counts.map(({ n, c }) => (
        <button
          key={n}
          type="button"
          disabled={disabled || c >= nMax}
          onClick={() => onInput(n)}
          aria-label={
            c >= nMax
              ? `Número ${n}, ya colocado ${nMax} veces`
              : `Escribir ${n} en la celda seleccionada`
          }
          className={cn(
            "glass aspect-square min-h-[44px] min-w-[44px] max-h-[80px] rounded-xl text-xl font-semibold text-foreground transition-all hover:border-primary/60 hover:shadow-[0_0_20px_hsla(43,90%,55%,0.2)] sm:text-2xl",
            c >= nMax && "cursor-not-allowed opacity-30"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
