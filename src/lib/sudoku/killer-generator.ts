// Killer Sudoku cage generator. Given a solved grid, split it into cages
// of 2-5 adjacent cells where the cage values are all distinct.

import { Cage, CagePosition, KillerPuzzle } from "./killer-types";
import { generatePuzzle } from "./generator";
import { Difficulty } from "./types";

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function neighbors(r: number, c: number): CagePosition[] {
  const out: CagePosition[] = [];
  if (r > 0) out.push({ row: r - 1, col: c });
  if (r < 8) out.push({ row: r + 1, col: c });
  if (c > 0) out.push({ row: r, col: c - 1 });
  if (c < 8) out.push({ row: r, col: c + 1 });
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate cages covering the whole 9x9 board. Each cage 2-5 cells, unique values. */
export function generateCages(solution: number[][]): Cage[] {
  const assigned = new Set<string>();
  const cages: Cage[] = [];
  let nextId = 1;

  const positions: CagePosition[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push({ row: r, col: c });

  for (const seed of positions) {
    if (assigned.has(key(seed.row, seed.col))) continue;

    const targetSize = 2 + Math.floor(Math.random() * 4); // 2..5
    const cells: CagePosition[] = [seed];
    const values = new Set<number>([solution[seed.row][seed.col]]);
    assigned.add(key(seed.row, seed.col));

    while (cells.length < targetSize) {
      const frontier: CagePosition[] = [];
      for (const cell of cells) {
        for (const n of neighbors(cell.row, cell.col)) {
          if (!assigned.has(key(n.row, n.col)) && !values.has(solution[n.row][n.col])) {
            frontier.push(n);
          }
        }
      }
      if (frontier.length === 0) break;
      const pick = shuffle(frontier)[0];
      cells.push(pick);
      values.add(solution[pick.row][pick.col]);
      assigned.add(key(pick.row, pick.col));
    }

    const sum = cells.reduce((acc, p) => acc + solution[p.row][p.col], 0);
    cages.push({ id: nextId++, cells, sum });
  }

  return cages;
}

export function generateKillerPuzzle(difficulty: Difficulty = "medium"): KillerPuzzle {
  const { solution } = generatePuzzle(difficulty);
  const cages = generateCages(solution);
  // In killer, no givens — all cells are blank; cage sums are the only clues.
  const puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
  return { puzzle, solution, cages };
}

/** Validate killer cage rule: no duplicates and sum matches when cage is fully filled. */
export function validateKillerCage(
  values: (number | null)[][],
  cages: Cage[]
): boolean {
  for (const cage of cages) {
    const seen = new Set<number>();
    let sum = 0;
    let full = true;
    for (const p of cage.cells) {
      const v = values[p.row][p.col];
      if (v == null) {
        full = false;
        continue;
      }
      if (seen.has(v)) return false;
      seen.add(v);
      sum += v;
    }
    if (full && sum !== cage.sum) return false;
  }
  return true;
}
