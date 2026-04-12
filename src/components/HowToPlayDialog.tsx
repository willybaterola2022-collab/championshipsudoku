import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";
import { Link } from "react-router-dom";

interface HowToPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Al cerrar con “Entendido” o overlay */
  onDismiss: () => void;
}

export function HowToPlayDialog({ open, onOpenChange, onDismiss }: HowToPlayDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/85 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[61] max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-6 w-6 shrink-0" aria-hidden />
              <Dialog.Title className="font-serif text-xl text-gradient-gold">¿Cómo se juega?</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Cerrar"
                onClick={onDismiss}
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Reglas del sudoku, teclado, notas y deshacer.
          </Dialog.Description>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground">Reglas</h3>
              <p className="mt-1">
                Completá el tablero 9×9 con dígitos 1–9 sin repetir en la misma fila, columna ni recuadro 3×3.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground">Teclado y toque</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Tocá una celda y elegí un número en el teclado numérico (o teclas 1–9 en PC).</li>
                <li>
                  <strong className="text-foreground">N</strong> o botón lápiz: modo notas (candidatos en la celda).
                </li>
                <li>
                  <strong className="text-foreground">Retroceso</strong> o borrar: limpiar celda.
                </li>
                <li>
                  <strong className="text-foreground">Ctrl+Z</strong> / deshacer: revertí movimientos.
                </li>
              </ul>
            </section>
            <section>
              <h3 className="font-semibold text-foreground">Vidas y errores</h3>
              <p className="mt-1">Tres errores máximo en esta partida. Si se acaban, podés empezar una nueva.</p>
            </section>
            <p>
              <Link to="/daily" className="text-primary hover:underline" onClick={onDismiss}>
                Puzzle del día
              </Link>{" "}
              — reto único con XP extra y ranking.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 w-full min-h-[44px] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Entendido
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
