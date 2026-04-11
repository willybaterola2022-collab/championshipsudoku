import { Share2, X } from "lucide-react";

interface GameResultProps {
  open: boolean;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
  onClose: () => void;
  onShare?: () => void;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function GameResult({ open, timeMs, mistakes, hintsUsed, onClose, onShare }: GameResultProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong relative w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-3xl text-gradient-gold">¡Completado!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Resumen de la partida</p>
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
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-medium"
          >
            Seguir jugando
          </button>
        </div>
      </div>
    </div>
  );
}
