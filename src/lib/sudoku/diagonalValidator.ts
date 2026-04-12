// Diagonal Sudoku validator.
// Extends standard 9x9 rules: the two main diagonals must also contain 1-9 unique.

import type { Board } from "./types";
import { getCellConflicts, type CellConflict } from "./validator";

/** Check diagonal conflicts for a cell on the main diagonal (r === c). */
function mainDiagonalConflicts(board: Board, row: number, col: number): CellConflict[] {
  if (row !== col) return [];
  const value = board[row][col].value;
  if (value == null) return [];
  const conflicts: CellConflict[] = [];
  for (let i = 0; i < 9; i++) {
    if (i !== row && board[i][i].value === value) {
      conflicts.push({ row: i, col: i });
    }
  }
  return conflicts;
}

/** Check diagonal conflicts for a cell on the anti-diagonal (r + c === 8). */
function antiDiagonalConflicts(board: Board, row: number, col: number): CellConflict[] {
  if (row + col !== 8) return [];
  const value = board[row][col].value;
  if (value == null) return [];
  const conflicts: CellConflict[] = [];
  for (let i = 0; i < 9; i++) {
    if (i !== row && board[i][8 - i].value === value) {
      conflicts.push({ row: i, col: 8 - i });
    }
  }
  return conflicts;
}

/** Get all conflicts for a cell in diagonal sudoku (standard + diagonal rules). */
export function getDiagonalCellConflicts(board: Board, row: number, col: number): CellConflict[] {
  const standard = getCellConflicts(board, row, col);
  const main = mainDiagonalConflicts(board, row, col);
  const anti = antiDiagonalConflicts(board, row, col);

  // Deduplicate
  const seen = new Set<string>();
  const all: CellConflict[] = [];
  for (const c of [...standard, ...main, ...anti]) {
    const key = `${c.row},${c.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(c);
    }
  }
  return all;
}

/** Returns true if the cell is on any diagonal. */
export function isOnDiagonal(row: number, col: number): boolean {
  return row === col || row + col === 8;
}

/** Update all errors for diagonal sudoku. */
export function updateAllErrorsDiagonal(board: Board): Board {
  const next = board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      isGiven: cell.isGiven,
      notes: { ...cell.notes },
      isError: false,
    }))
  );

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (next[r][c].value != null) {
        const conflicts = getDiagonalCellConflicts(next, r, c);
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
