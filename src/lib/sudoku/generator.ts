// Sudoku puzzle generator with unique-solution guarantee.
// Backtracking algorithm with randomization.

import { Difficulty, DIFFICULTY_CONFIG } from "./types";

type Grid = number[][];

function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fill grid with a random valid solution. Returns true if filled. */
function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** Count solutions up to `limit`. Used to verify uniqueness. */
function countSolutions(grid: Grid, limit = 2): number {
  let count = 0;
  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve()) {
                grid[row][col] = 0;
                return true;
              }
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }
  solve();
  return count;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  givenCount: number;
}

/** Generate a puzzle with unique solution for the requested difficulty. */
export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const solution = emptyGrid();
  fillGrid(solution);

  const config = DIFFICULTY_CONFIG[difficulty];
  const targetGivens = Math.floor(
    config.givenMin + Math.random() * (config.givenMax - config.givenMin + 1)
  );

  const puzzle = cloneGrid(solution);

  // Cell positions randomized
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  const shuffled = shuffle(positions);

  let givens = 81;
  for (const [r, c] of shuffled) {
    if (givens <= targetGivens) break;
    const saved = puzzle[r][c];
    puzzle[r][c] = 0;
    const test = cloneGrid(puzzle);
    if (countSolutions(test, 2) === 1) {
      givens--;
    } else {
      puzzle[r][c] = saved;
    }
  }

  return { puzzle, solution, difficulty, givenCount: givens };
}
