import { cloneBoard, type Board, type CellNotes } from "@/lib/sudoku/types";
import { updateAllErrors } from "@/lib/sudoku/validator";

function isValidClassic(grid: number[][], row: number, col: number, num: number): boolean {
  const gridSize = 9;
  for (let i = 0; i < gridSize; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) {
      if (grid[rr][cc] === num) return false;
    }
  }
  return true;
}

/** Auto-notas candidatos válidos (9x9). Bloque G — no modifica validator.ts. */
export function autoFillNotesClassic(board: Board): Board {
  const next = cloneBoard(board);
  const nums = next.map((row) => row.map((c) => c.value ?? 0));

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (next[r][c].value !== null) continue;
      const notes: CellNotes = {};
      for (let n = 1; n <= 9; n++) {
        if (isValidClassic(nums, r, c, n)) notes[n] = true;
      }
      next[r][c] = { ...next[r][c], notes };
    }
  }
  return updateAllErrors(next);
}
