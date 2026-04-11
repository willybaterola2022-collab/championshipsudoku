import { cn } from "@/lib/utils";
import type { Board } from "@/lib/sudoku/types";

interface NumPadProps {
  board: Board;
  onInput: (n: number) => void;
  disabled?: boolean;
}

export function NumPad({ board, onInput, disabled }: NumPadProps) {
  const counts = Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
    let c = 0;
    for (let r = 0; r < 9; r++) {
      for (let col = 0; col < 9; col++) {
        if (board[r][col].value === n) c++;
      }
    }
    return { n, c };
  });

  return (
    <div className="mx-auto grid max-w-sm grid-cols-3 gap-2 px-2 sm:gap-3">
      {counts.map(({ n, c }) => (
        <button
          key={n}
          type="button"
          disabled={disabled || c >= 9}
          onClick={() => onInput(n)}
          className={cn(
            "glass aspect-square max-h-[80px] rounded-xl text-xl font-semibold text-foreground transition-all hover:border-primary/60 hover:shadow-[0_0_20px_hsla(43,90%,55%,0.2)] sm:text-2xl",
            c >= 9 && "cursor-not-allowed opacity-30"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
