import type { Difficulty } from "@/lib/sudoku/types";
import { DIFFICULTY_CONFIG } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
  className?: string;
}

const ORDER: Difficulty[] = ["easy", "medium", "hard", "expert", "fiendish"];

export function DifficultySelector({ value, onChange, disabled, className }: DifficultySelectorProps) {
  const hint = DIFFICULTY_CONFIG[value].hint;
  return (
    <div className={cn("relative", className)}>
      <select
        className="glass-strong appearance-none rounded-lg border border-border/60 py-2 pl-3 pr-10 text-sm font-medium text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-primary disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Difficulty)}
        aria-label="Dificultad"
        title={hint}
      >
        {ORDER.map((d) => (
          <option key={d} value={d} title={DIFFICULTY_CONFIG[d].hint}>
            {DIFFICULTY_CONFIG[d].label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        ▾
      </span>
    </div>
  );
}
