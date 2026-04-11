import { useEffect } from "react";

interface Handlers {
  onDigit: (n: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
  enabled: boolean;
}

export function useSudokuKeyboard({ onDigit, onErase, onUndo, onToggleNotes, enabled }: Handlers) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        onDigit(Number(e.key));
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
  }, [enabled, onDigit, onErase, onToggleNotes, onUndo]);
}
