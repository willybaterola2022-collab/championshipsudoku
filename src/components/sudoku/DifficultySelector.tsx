import type { Difficulty } from "@/lib/sudoku/types";
import { DIFFICULTY_CONFIG } from "@/lib/sudoku/types";
import { DIFFICULTY_TECHNIQUE_INFO } from "@/lib/sudoku/techniqueInfo";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
  className?: string;
  /** Si está definido, la dificultad está bloqueada (ej. nivel insuficiente). */
  locked?: Partial<Record<Difficulty, number>>;
}

const ORDER: Difficulty[] = ["easy", "medium", "hard", "expert", "fiendish"];

export function DifficultySelector({ value, onChange, disabled, className, locked }: DifficultySelectorProps) {
  return (
    <div className={cn("relative space-y-1", className)}>
      <select
        className="glass-strong w-full appearance-none rounded-lg border border-border/60 py-2 pl-3 pr-10 text-sm font-medium text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-primary disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Difficulty)}
        aria-label="Dificultad"
        title={`${DIFFICULTY_CONFIG[value].hint} · ~${DIFFICULTY_CONFIG[value].estimatedMinutes} · ${DIFFICULTY_CONFIG[value].audience}`}
      >
        {ORDER.map((d) => {
          const req = locked?.[d];
          const isLocked = req != null;
          return (
            <option key={d} value={d} disabled={isLocked}>
              {isLocked ? "🔒 " : ""}
              {DIFFICULTY_CONFIG[d].label}
              {isLocked ? ` (nivel ${req})` : ""}
            </option>
          );
        })}
      </select>
      <span className="pointer-events-none absolute right-3 top-[0.65rem] text-xs text-muted-foreground">▾</span>
      <p className="max-w-md text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{DIFFICULTY_CONFIG[value].label}</span>
        {": "}
        {DIFFICULTY_TECHNIQUE_INFO[value]}
        {" · "}
        {DIFFICULTY_CONFIG[value].hint} (~{DIFFICULTY_CONFIG[value].estimatedMinutes})
      </p>
    </div>
  );
}
