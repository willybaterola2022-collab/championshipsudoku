// Validación 6×6 (cajas 2×3). No modifica validator.ts clásico.

import { Board, cloneBoard } from "./types";

const N = 6;
const BOX_H = 2;
const BOX_W = 3;

export interface CellConflict {
  row: number;
  col: number;
}

export function getCellConflictsMini6(board: Board, row: number, col: number): CellConflict[] {
  const value = board[row][col].value;
  if (value == null) return [];

  const conflicts: CellConflict[] = [];

  for (let c = 0; c < N; c++) {
    if (c !== col && board[row][c].value === value) {
      conflicts.push({ row, col: c });
    }
  }
  for (let r = 0; r < N; r++) {
    if (r !== row && board[r][col].value === value) {
      conflicts.push({ row: r, col });
    }
  }

  const boxRow = Math.floor(row / BOX_H) * BOX_H;
  const boxCol = Math.floor(col / BOX_W) * BOX_W;
  for (let r = boxRow; r < boxRow + BOX_H; r++) {
    for (let c = boxCol; c < boxCol + BOX_W; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        conflicts.push({ row: r, col: c });
      }
    }
  }

  return conflicts;
}

export function updateAllErrorsMini6(board: Board): Board {
  const next = cloneBoard(board);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      next[r][c].isError = false;
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (next[r][c].value != null) {
        const conflicts = getCellConflictsMini6(next, r, c);
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

export function checkCompletionMini6(board: Board): boolean {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (board[r][c].value == null) return false;
      if (board[r][c].isError) return false;
    }
  }
  return true;
}
