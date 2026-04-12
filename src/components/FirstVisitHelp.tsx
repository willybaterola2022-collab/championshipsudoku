import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sudoku-first-visit-help-v1";

export function FirstVisitHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && dismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/85 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-6 w-6 shrink-0" aria-hidden />
              <Dialog.Title className="font-serif text-xl text-gradient-gold">Bienvenido</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Tres pasos para empezar: dificultad, números en el tablero, puzzle del día y cuenta.
          </Dialog.Description>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Elegí la dificultad arriba; el tablero se genera al instante.</li>
            <li>Tocá una celda y un número (o usá el teclado 1–9).</li>
            <li>
              El <strong className="text-foreground">puzzle del día</strong> da XP extra; tu progreso se guarda
              con cuenta.
            </li>
          </ol>
          <button
            type="button"
            onClick={dismiss}
            className="mt-6 w-full min-h-[44px] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Entendido
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
