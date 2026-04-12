import type { Difficulty } from "@/lib/sudoku/types";

/** Texto fijo por dificultad (Bloque A — coach visible). */
export const DIFFICULTY_TECHNIQUE_INFO: Record<Difficulty, string> = {
  easy: "Singles — ideal para empezar",
  medium: "Singles + eliminación — equilibrado",
  hard: "Pares + eliminación avanzada",
  expert: "X-Wing, cadenas — para expertos",
  fiendish: "Técnicas avanzadas — solo veteranos",
};
