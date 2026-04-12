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
  /** Próximo nivel de pista (1–3) para la celda seleccionada. */
  hintLevelNext?: 1 | 2 | 3;
  showHints?: boolean;
  /** Si no hay pistas (p. ej. Killer), mostrar bombilla deshabilitada con este texto */
  hintUnavailableReason?: string;
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
  hintLevelNext = 1,
  showHints = true,
  hintUnavailableReason,
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
      {showHints ? (
        <button
          type="button"
          className={cn(btn)}
          disabled={disabled || hintsRemaining <= 0 || hintLoading}
          onClick={onHint}
          aria-label={`Pista nivel ${hintLevelNext} de 3`}
        >
          <Lightbulb className="h-7 w-7" />
          {hintsRemaining > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
              {hintsRemaining}
            </span>
          )}
        </button>
      ) : hintUnavailableReason ? (
        <button
          type="button"
          className={cn(btn, "cursor-not-allowed opacity-50")}
          disabled
          title={hintUnavailableReason}
          aria-label={hintUnavailableReason}
        >
          <Lightbulb className="h-7 w-7" />
        </button>
      ) : null}
    </div>
  );
}
