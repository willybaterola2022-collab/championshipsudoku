/**
 * Pasos de resolución aproximados (sin modificar solver.ts).
 * Prioriza singles desnudos visibles; el resumen completo sigue en solvePuzzleLogically.
 */

import {
  solvePuzzleLogically,
  TECHNIQUE_LABELS,
  type Technique,
} from "@/lib/sudoku/solver";

export interface SolveStep {
  row: number;
  col: number;
  value: number;
  technique: Technique;
  explanation: string;
}

function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

/** Lista de pasos greedy (singles desnudos donde el candidato es único en la celda). */
export function getDetailedSolveSteps(puzzle: number[][]): SolveStep[] {
  const steps: SolveStep[] = [];
  const grid = puzzle.map((r) => [...r]);
  const maxPasses = 200;

  for (let pass = 0; pass < maxPasses; pass++) {
    let placed = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) continue;
        const candidates: number[] = [];
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(grid, r, c, n)) candidates.push(n);
        }
        if (candidates.length === 1) {
          const val = candidates[0];
          grid[r][c] = val;
          steps.push({
            row: r,
            col: c,
            value: val,
            technique: "naked_single",
            explanation: `R${r + 1}C${c + 1}: solo puede ser ${val} (single desnudo)`,
          });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (!placed) break;
  }

  return steps;
}

export function formatTechniquesLine(techniques: Technique[]): string {
  return techniques.map((t) => TECHNIQUE_LABELS[t] ?? t).join(", ");
}

export { solvePuzzleLogically, TECHNIQUE_LABELS };
