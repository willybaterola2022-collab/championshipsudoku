// Pure types for Sudoku game logic. No React, no Supabase.
// Shared between classic and killer variants.

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "fiendish";
export type Variant = "classic" | "killer";

export type CellValue = number | null;

export interface CellNotes {
  [key: number]: boolean; // 1..9 → true/false
}

export interface Cell {
  value: CellValue;
  isGiven: boolean;
  notes: CellNotes;
  isError: boolean;
}

export type Board = Cell[][]; // always 9x9

export interface HistoryEntry {
  row: number;
  col: number;
  previousValue: CellValue;
  previousNotes: CellNotes;
  newValue: CellValue;
  newNotes: CellNotes;
}

export interface DifficultyConfig {
  label: string;
  givenMin: number;
  givenMax: number;
  baseXp: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Fácil", givenMin: 35, givenMax: 40, baseXp: 30 },
  medium: { label: "Medio", givenMin: 28, givenMax: 34, baseXp: 50 },
  hard: { label: "Difícil", givenMin: 24, givenMax: 27, baseXp: 80 },
  expert: { label: "Experto", givenMin: 22, givenMax: 23, baseXp: 120 },
  fiendish: { label: "Diabólico", givenMin: 17, givenMax: 21, baseXp: 200 },
};

export const RANKS = [
  "Novato",
  "Aprendiz",
  "Iniciado",
  "Estratega",
  "Táctico",
  "Experto",
  "Maestro",
  "Gran Maestro",
  "Leyenda",
  "Iluminado",
  "Oráculo",
] as const;

export type Rank = (typeof RANKS)[number];

export function getRankForLevel(level: number): Rank {
  const idx = Math.min(Math.floor((level - 1) / 5), RANKS.length - 1);
  return RANKS[idx];
}

export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function createEmptyCell(): Cell {
  return { value: null, isGiven: false, notes: {}, isError: false };
}

export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, createEmptyCell));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      isGiven: cell.isGiven,
      notes: { ...cell.notes },
      isError: cell.isError,
    }))
  );
}

export function boardToNumbers(board: Board): number[][] {
  return board.map((row) => row.map((c) => c.value ?? 0));
}

export function numbersToBoard(numbers: number[][], givens?: number[][]): Board {
  return numbers.map((row, r) =>
    row.map((val, c) => {
      const isGiven = givens ? givens[r][c] !== 0 : val !== 0;
      return {
        value: val === 0 ? null : val,
        isGiven,
        notes: {},
        isError: false,
      };
    })
  );
}
