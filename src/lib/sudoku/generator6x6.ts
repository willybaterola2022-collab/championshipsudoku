// Mini Sudoku 6x6 generator with unique-solution guarantee.
// Grid is 6x6 with 2x3 boxes. Numbers 1-6.

export interface Generated6x6 {
  puzzle: number[][];
  solution: number[][];
  givenCount: number;
}

function emptyGrid(): number[][] {
  return Array.from({ length: 6 }, () => Array(6).fill(0));
}

function cloneGrid(g: number[][]): number[][] {
  return g.map((r) => [...r]);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 6; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  // 2x3 box
  const br = Math.floor(row / 2) * 2;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 2; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[][]): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c] === 0) {
        for (const n of shuffle([1, 2, 3, 4, 5, 6])) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid: number[][], limit = 2): number {
  let count = 0;
  function solve(): boolean {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r][c] === 0) {
          for (let n = 1; n <= 6; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (solve()) {
                grid[r][c] = 0;
                return true;
              }
              grid[r][c] = 0;
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

const GIVEN_RANGES: Record<string, [number, number]> = {
  easy: [18, 22],
  medium: [14, 17],
  hard: [11, 13],
  expert: [9, 10],
};

export function generate6x6(difficulty: "easy" | "medium" | "hard" | "expert" = "medium"): Generated6x6 {
  const solution = emptyGrid();
  fillGrid(solution);

  const [min, max] = GIVEN_RANGES[difficulty] ?? [14, 17];
  const target = min + Math.floor(Math.random() * (max - min + 1));

  const puzzle = cloneGrid(solution);
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) positions.push([r, c]);
  const shuffled = shuffle(positions);

  let givens = 36;
  for (const [r, c] of shuffled) {
    if (givens <= target) break;
    const saved = puzzle[r][c];
    puzzle[r][c] = 0;
    const test = cloneGrid(puzzle);
    if (countSolutions(test, 2) === 1) {
      givens--;
    } else {
      puzzle[r][c] = saved;
    }
  }

  return { puzzle, solution, givenCount: givens };
}
