import { Eraser, Lightbulb, Pencil, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameControlsProps {
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
  notesActive: boolean;
  canUndo: boolean;
  hintsRemaining: number;
  hintLoading?: boolean;
  showHints?: boolean;
  disabled?: boolean;
}

export function GameControls({
  onUndo,
  onErase,
  onToggleNotes,
  onHint,
  notesActive,
  canUndo,
  hintsRemaining,
  hintLoading,
  showHints = true,
  disabled,
}: GameControlsProps) {
  const btn =
    "glass relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-border/60 text-foreground transition-all hover:border-primary/50 active:scale-95 disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <button type="button" className={cn(btn)} disabled={disabled || !canUndo} onClick={onUndo} aria-label="Deshacer">
        <Undo2 className="h-7 w-7" />
      </button>
      <button type="button" className={cn(btn)} disabled={disabled} onClick={onErase} aria-label="Borrar">
        <Eraser className="h-7 w-7" />
      </button>
      <button
        type="button"
        className={cn(btn, notesActive && "animate-glow-pulse border-primary/80")}
        disabled={disabled}
        onClick={onToggleNotes}
        aria-label="Notas"
      >
        <Pencil className="h-7 w-7" />
      </button>
      {showHints && (
        <button
          type="button"
          className={cn(btn)}
          disabled={disabled || hintsRemaining <= 0 || hintLoading}
          onClick={onHint}
          aria-label="Pista"
        >
          <Lightbulb className="h-7 w-7" />
          {hintsRemaining > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
              {hintsRemaining}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
