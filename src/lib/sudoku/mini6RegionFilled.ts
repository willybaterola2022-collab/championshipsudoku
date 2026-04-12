import type { Board } from "@/lib/sudoku/types";

const N = 6;
const BOX_H = 2;
const BOX_W = 3;

export function isRowFilledMini6(board: Board, row: number): boolean {
  for (let c = 0; c < N; c++) if (board[row][c].value == null) return false;
  return true;
}

export function isColFilledMini6(board: Board, col: number): boolean {
  for (let r = 0; r < N; r++) if (board[r][col].value == null) return false;
  return true;
}

export function isBoxFilledMini6(board: Board, boxRow: number, boxCol: number): boolean {
  const r0 = boxRow * BOX_H;
  const c0 = boxCol * BOX_W;
  for (let r = r0; r < r0 + BOX_H; r++) {
    for (let c = c0; c < c0 + BOX_W; c++) {
      if (board[r][c].value == null) return false;
    }
  }
  return true;
}
