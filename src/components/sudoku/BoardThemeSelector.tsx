import { cn } from "@/lib/utils";

export type BoardThemeId = "classic" | "minimal" | "contrast" | "neon";

const THEMES: { id: BoardThemeId; label: string }[] = [
  { id: "classic", label: "Clásico" },
  { id: "minimal", label: "Minimal" },
  { id: "contrast", label: "Contraste" },
  { id: "neon", label: "Neón" },
];

const STORAGE_KEY = "sudoku-board-theme";

export function readBoardTheme(): BoardThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as BoardThemeId | null;
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch {
    /* ignore */
  }
  return "classic";
}

export function writeBoardTheme(id: BoardThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

interface BoardThemeSelectorProps {
  value: BoardThemeId;
  onChange: (id: BoardThemeId) => void;
  className?: string;
}

export function BoardThemeSelector({ value, onChange, className }: BoardThemeSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === t.id
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 text-muted-foreground hover:border-primary/40"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
