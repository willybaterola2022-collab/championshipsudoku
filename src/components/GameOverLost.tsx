import * as Dialog from "@radix-ui/react-dialog";
import { Skull } from "lucide-react";

interface GameOverLostProps {
  open: boolean;
  onNewGame: () => void;
}

export function GameOverLost({ open, onNewGame }: GameOverLostProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => v === false && onNewGame()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-6 shadow-2xl focus:outline-none">
          <div className="flex items-center gap-2 text-destructive">
            <Skull className="h-7 w-7 shrink-0" aria-hidden />
            <Dialog.Title className="font-serif text-2xl text-foreground">Sin vidas</Dialog.Title>
          </div>
          <Dialog.Description className="mt-3 text-sm text-muted-foreground">
            Llegaste a 3 errores. Podés empezar una partida nueva con el mismo nivel o cambiar la dificultad
            arriba.
          </Dialog.Description>
          <button
            type="button"
            onClick={onNewGame}
            className="mt-6 w-full min-h-[44px] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Nueva partida
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
