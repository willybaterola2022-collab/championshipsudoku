import { cloneBoard, type Board, type CellNotes } from "@/lib/sudoku/types";
import { updateAllErrorsMini6 } from "@/lib/sudoku/mini6Validator";

const N = 6;
const BOX_H = 2;
const BOX_W = 3;

function isValidMini6(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < N; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / BOX_H) * BOX_H;
  const bc = Math.floor(col / BOX_W) * BOX_W;
  for (let rr = br; rr < br + BOX_H; rr++) {
    for (let cc = bc; cc < bc + BOX_W; cc++) {
      if (grid[rr][cc] === num) return false;
    }
  }
  return true;
}

export function autoFillNotesMini6(board: Board): Board {
  const next = cloneBoard(board);
  const nums = next.map((row) => row.map((c) => c.value ?? 0));

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (next[r][c].value !== null) continue;
      const notes: CellNotes = {};
      for (let n = 1; n <= N; n++) {
        if (isValidMini6(nums, r, c, n)) notes[n] = true;
      }
      next[r][c] = { ...next[r][c], notes };
    }
  }
  return updateAllErrorsMini6(next);
}
