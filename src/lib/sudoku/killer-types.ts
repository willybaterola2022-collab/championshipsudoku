// Killer Sudoku types

export interface CagePosition {
  row: number;
  col: number;
}

export interface Cage {
  id: number;
  cells: CagePosition[];
  sum: number;
}

export interface KillerPuzzle {
  puzzle: number[][]; // typically all zeros (nothing given in killer)
  solution: number[][];
  cages: Cage[];
}
