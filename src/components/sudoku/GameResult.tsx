import * as Dialog from "@radix-ui/react-dialog";
import { Share2, Swords, X } from "lucide-react";
import type { ReactNode } from "react";
import type { SolveStep } from "@/lib/sudoku/solverDetailed";
import { shareResultImage, type ShareImageData } from "@/components/sudoku/ShareImage";

interface GameResultProps {
  open: boolean;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
  onClose: () => void;
  onShare?: () => void;
  /** Si está definido, "Compartir" genera imagen PNG + Web Share / portapapeles. */
  shareVisualData?: ShareImageData | null;
  /** Crear link de desafío (padre llama a la edge function). */
  onChallengeFriend?: () => void | Promise<void>;
  challengeBusy?: boolean;
  /** Modo zen: modal mínimo sin ranking ni compartir desafío. */
  zenMode?: boolean;
  /** Contenido opcional bajo el resumen (p. ej. enlace al ranking diario). */
  footerExtra?: ReactNode;
  /** Línea opcional (p. ej. comparación con mejor tiempo del día). */
  compareLine?: string;
  /** Percentil respecto a otros jugadores (misma dificultad / sesión). */
  percentile?: number | null;
  showPersonalBestBadge?: boolean;
  /** Análisis lógico del puzzle original (solver). */
  techniquesLine?: string;
  logicalDifficultyLabel?: string;
  showXWingBadge?: boolean;
  /** Pasos de replay texto (singles desnudos greedy). */
  replaySteps?: SolveStep[];
  /** Highlight paso en tablero miniatura (opcional). */
  highlightStepIndex?: number | null;
  onSelectStep?: (index: number) => void;
  moveCount?: number;
  optimalSteps?: number;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function GameResult({
  open,
  timeMs,
  mistakes,
  hintsUsed,
  onClose,
  onShare,
  shareVisualData,
  onChallengeFriend,
  challengeBusy,
  zenMode,
  footerExtra,
  compareLine,
  percentile,
  showPersonalBestBadge,
  techniquesLine,
  logicalDifficultyLabel,
  showXWingBadge,
  replaySteps,
  highlightStepIndex,
  onSelectStep,
  moveCount,
  optimalSteps,
}: GameResultProps) {
  const handleShareClick = async () => {
    if (shareVisualData) {
      const text = `Championship Sudoku — ${shareVisualData.difficulty} en ${shareVisualData.timeFormatted} · ${shareVisualData.errors} errores\nchampionshipsudoku.vercel.app`;
      await shareResultImage(shareVisualData, text);
      return;
    }
    onShare?.();
  };

  if (zenMode) {
    return (
      <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
          <Dialog.Content
            className="glass-strong fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-6 shadow-2xl focus:outline-none"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
            <Dialog.Title asChild>
              <h2 className="font-serif text-3xl text-gradient-gold">Completado</h2>
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Modo Zen — sin tiempo ni puntuación. Solo calma.
            </Dialog.Description>
            <div className="mt-8">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-medium"
              >
                Otro puzzle
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content
          className="glass-strong fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-6 shadow-2xl focus:outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
          <Dialog.Title asChild>
            <h2 className="font-serif text-3xl text-gradient-gold">¡Completado!</h2>
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Resumen de la partida
          </Dialog.Description>
          {showPersonalBestBadge ? (
            <p className="mt-3 inline-flex rounded-full border border-primary/50 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Nuevo récord personal
            </p>
          ) : null}
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tiempo</dt>
              <dd className="font-mono tabular-nums text-foreground">{fmt(timeMs)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Errores</dt>
              <dd className="tabular-nums text-foreground">{mistakes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pistas</dt>
              <dd className="tabular-nums text-foreground">{hintsUsed}</dd>
            </div>
            {percentile != null ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ranking</dt>
                <dd className="text-foreground">Más rápido que el {percentile}% de los jugadores</dd>
              </div>
            ) : null}
            {moveCount != null && optimalSteps != null ? (
              <div className="flex flex-col gap-1 border-t border-border/40 pt-4">
                <dt className="text-muted-foreground">Eficiencia de movimientos</dt>
                <dd className="text-sm text-foreground">
                  Tu camino: {moveCount} movimientos — Referencia solver: {optimalSteps} pasos
                  {moveCount > 0 && optimalSteps > 0 ? (
                    <span className="ml-1 text-muted-foreground">
                      · Eficiencia ~{Math.min(100, Math.round((optimalSteps / moveCount) * 100))}%
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          {techniquesLine ? (
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">Este puzzle requería</p>
              <p className="text-muted-foreground">{techniquesLine}</p>
              {logicalDifficultyLabel ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dificultad lógica: {logicalDifficultyLabel}
                </p>
              ) : null}
              {showXWingBadge ? (
                <span className="mt-2 inline-flex rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Incluye X-Wing u otra técnica avanzada
                </span>
              ) : null}
            </div>
          ) : null}
          {replaySteps && replaySteps.length > 0 ? (
            <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-border/50 p-2 text-left text-xs">
              <p className="mb-2 font-semibold text-foreground">Replay (primeros pasos)</p>
              <ol className="list-decimal space-y-1 pl-4">
                {replaySteps.slice(0, 24).map((s, i) => (
                  <li key={`${s.row}-${s.col}-${i}`}>
                    <button
                      type="button"
                      className={`text-left hover:underline ${highlightStepIndex === i ? "text-primary" : "text-muted-foreground"}`}
                      onClick={() => onSelectStep?.(i)}
                    >
                      Paso {i + 1}: R{s.row + 1}C{s.col + 1} = {s.value} ({s.explanation})
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {compareLine ? (
            <p className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-center text-sm text-muted-foreground">
              {compareLine}
            </p>
          ) : null}
          {footerExtra ? <div className="mt-6">{footerExtra}</div> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {(shareVisualData || onShare) && (
              <button
                type="button"
                onClick={() => void handleShareClick()}
                className="inline-flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
            )}
            {onChallengeFriend ? (
              <button
                type="button"
                disabled={challengeBusy}
                onClick={() => void onChallengeFriend()}
                className="inline-flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-200 disabled:opacity-60"
              >
                <Swords className="h-4 w-4" />
                {challengeBusy ? "Creando…" : "Desafiar a un amigo"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 min-h-[44px] items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-medium"
            >
              Seguir jugando
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
