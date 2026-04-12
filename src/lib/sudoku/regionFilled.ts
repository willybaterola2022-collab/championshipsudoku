import type { Board } from "@/lib/sudoku/types";

export function isRowFilled(board: Board, row: number): boolean {
  for (let c = 0; c < 9; c++) if (board[row][c].value == null) return false;
  return true;
}

export function isColFilled(board: Board, col: number): boolean {
  for (let r = 0; r < 9; r++) if (board[r][col].value == null) return false;
  return true;
}

export function isBoxFilled(board: Board, boxRow: number, boxCol: number): boolean {
  const r0 = boxRow * 3;
  const c0 = boxCol * 3;
  for (let r = r0; r < r0 + 3; r++) {
    for (let c = c0; c < c0 + 3; c++) {
      if (board[r][c].value == null) return false;
    }
  }
  return true;
}
