import * as Dialog from "@radix-ui/react-dialog";
import { Share2, X } from "lucide-react";
import type { ReactNode } from "react";

interface GameResultProps {
  open: boolean;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
  onClose: () => void;
  onShare?: () => void;
  /** Contenido opcional bajo el resumen (p. ej. enlace al ranking diario). */
  footerExtra?: ReactNode;
  /** Línea opcional (p. ej. comparación con mejor tiempo del día). */
  compareLine?: string;
  /** Percentil respecto a otros jugadores (misma dificultad / sesión). */
  percentile?: number | null;
  showPersonalBestBadge?: boolean;
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
  footerExtra,
  compareLine,
  percentile,
  showPersonalBestBadge,
}: GameResultProps) {
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
          </dl>
          {compareLine ? (
            <p className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-center text-sm text-muted-foreground">
              {compareLine}
            </p>
          ) : null}
          {footerExtra ? <div className="mt-6">{footerExtra}</div> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="inline-flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
            )}
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
