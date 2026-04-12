/** Orden fijo en la grilla de perfil (mismas claves que achievements en BD). */
export const ACHIEVEMENT_KEYS = [
  "sudoku_first_puzzle",
  "sudoku_streak_3",
  "sudoku_streak_7",
  "sudoku_perfect",
  "sudoku_speed",
  "sudoku_10_puzzles",
  "sudoku_50_puzzles",
  "sudoku_hard",
  "sudoku_expert",
  "sudoku_killer",
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_KEYS)[number];

/** Claves que el backend puede devolver en `achievements_unlocked`. */
export const ACHIEVEMENT_LABELS: Record<AchievementKey, string> = {
  sudoku_first_puzzle: "Primer puzzle",
  sudoku_streak_3: "Racha 3 días",
  sudoku_streak_7: "Racha 7 días",
  sudoku_perfect: "Sin errores",
  sudoku_speed: "Velocidad",
  sudoku_10_puzzles: "10 resueltos",
  sudoku_50_puzzles: "50 resueltos",
  sudoku_hard: "Difícil",
  sudoku_expert: "Experto",
  sudoku_killer: "Killer",
};

export function labelForAchievementKey(key: string): string {
  return ACHIEVEMENT_LABELS[key as AchievementKey] ?? key;
}
