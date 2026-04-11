// Pure validation logic. No side effects.

import { Board, cloneBoard } from "./types";

export interface CellConflict {
  row: number;
  col: number;
}

/** Returns list of conflicts for a given cell (row, col, box duplicates). */
export function getCellConflicts(board: Board, row: number, col: number): CellConflict[] {
  const value = board[row][col].value;
  if (value == null) return [];

  const conflicts: CellConflict[] = [];

  // Row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === value) {
      conflicts.push({ row, col: c });
    }
  }
  // Column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === value) {
      conflicts.push({ row: r, col });
    }
  }
  // Box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        conflicts.push({ row: r, col: c });
      }
    }
  }

  return conflicts;
}

/** Returns a new board with `isError` recomputed for every cell. */
export function updateAllErrors(board: Board): Board {
  const next = cloneBoard(board);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      next[r][c].isError = false;
    }
  }
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (next[r][c].value != null) {
        const conflicts = getCellConflicts(next, r, c);
        if (conflicts.length > 0) {
          next[r][c].isError = true;
          for (const { row, col } of conflicts) {
            next[row][col].isError = true;
          }
        }
      }
    }
  }
  return next;
}

/** True if board is completely filled and has zero conflicts. */
export function checkCompletion(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value == null) return false;
      if (board[r][c].isError) return false;
    }
  }
  return true;
}

/** Count filled cells (for progress bar). */
export function countFilled(board: Board): number {
  let n = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value != null) n++;
    }
  }
  return n;
}

/** True if board value matches solution at (row, col). */
export function matchesSolution(board: Board, solution: number[][], row: number, col: number): boolean {
  return board[row][col].value === solution[row][col];
}
