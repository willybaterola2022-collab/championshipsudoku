import { useEffect } from "react";

interface Handlers {
  onDigit: (n: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
  enabled: boolean;
  /** Default 9. Use 6 para Mini Sudoku. */
  maxDigit?: number;
}

export function useSudokuKeyboard({
  onDigit,
  onErase,
  onUndo,
  onToggleNotes,
  enabled,
  maxDigit = 9,
}: Handlers & { maxDigit?: number }) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;

      const d = Number(e.key);
      if (!Number.isNaN(d) && d >= 1 && d <= maxDigit) {
        e.preventDefault();
        onDigit(d);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onErase();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
        return;
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onToggleNotes();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, maxDigit, onDigit, onErase, onToggleNotes, onUndo]);
}
