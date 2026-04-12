// Logical Sudoku solver that applies human techniques in order.
// Used to classify puzzles by difficulty based on which techniques are required.
// Does NOT use backtracking — only deterministic logic.

export type Technique =
  | "naked_single"
  | "hidden_single"
  | "naked_pair"
  | "hidden_pair"
  | "pointing_pair"
  | "box_line_reduction"
  | "naked_triple"
  | "x_wing"
  | "swordfish"
  | "xy_wing"
  | "forcing_chain";

export const TECHNIQUE_DIFFICULTY: Record<Technique, number> = {
  naked_single: 1,
  hidden_single: 1,
  naked_pair: 2,
  hidden_pair: 2,
  pointing_pair: 2,
  box_line_reduction: 2,
  naked_triple: 3,
  x_wing: 4,
  swordfish: 5,
  xy_wing: 4,
  forcing_chain: 5,
};

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  naked_single: "Single desnudo",
  hidden_single: "Single oculto",
  naked_pair: "Par desnudo",
  hidden_pair: "Par oculto",
  pointing_pair: "Par apuntador",
  box_line_reduction: "Reducción caja-línea",
  naked_triple: "Triple desnudo",
  x_wing: "X-Wing",
  swordfish: "Swordfish",
  xy_wing: "XY-Wing",
  forcing_chain: "Cadena forzada",
};

type Candidates = Set<number>[][];

function initCandidates(grid: number[][]): Candidates {
  const c: Candidates = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
  for (let r = 0; r < 9; r++) {
    for (let col = 0; col < 9; col++) {
      if (grid[r][col] !== 0) continue;
      for (let n = 1; n <= 9; n++) {
        if (isValid(grid, r, col, n)) c[r][col].add(n);
      }
    }
  }
  return c;
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (grid[r][c] === num) return false;
  return true;
}

function place(grid: number[][], cands: Candidates, r: number, c: number, val: number): void {
  grid[r][c] = val;
  cands[r][c].clear();
  for (let i = 0; i < 9; i++) {
    cands[r][i].delete(val);
    cands[i][c].delete(val);
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) cands[rr][cc].delete(val);
}

function solveNakedSingles(grid: number[][], cands: Candidates): boolean {
  let progress = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && cands[r][c].size === 1) {
        const val = [...cands[r][c]][0];
        place(grid, cands, r, c, val);
        progress = true;
      }
    }
  }
  return progress;
}

function solveHiddenSingles(grid: number[][], cands: Candidates): boolean {
  let progress = false;
  // Rows
  for (let r = 0; r < 9; r++) {
    for (let n = 1; n <= 9; n++) {
      const positions: number[] = [];
      for (let c = 0; c < 9; c++) if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push(c);
      if (positions.length === 1) { place(grid, cands, r, positions[0], n); progress = true; }
    }
  }
  // Columns
  for (let c = 0; c < 9; c++) {
    for (let n = 1; n <= 9; n++) {
      const positions: number[] = [];
      for (let r = 0; r < 9; r++) if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push(r);
      if (positions.length === 1) { place(grid, cands, positions[0], c, n); progress = true; }
    }
  }
  // Boxes
  for (let box = 0; box < 9; box++) {
    const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
    for (let n = 1; n <= 9; n++) {
      const positions: Array<[number, number]> = [];
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) {
        if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push([r, c]);
      }
      if (positions.length === 1) { place(grid, cands, positions[0][0], positions[0][1], n); progress = true; }
    }
  }
  return progress;
}

function solveNakedPairs(grid: number[][], cands: Candidates): boolean {
  let progress = false;
  // Rows
  for (let r = 0; r < 9; r++) {
    const pairs: Array<{ c: number; vals: number[] }> = [];
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && cands[r][c].size === 2) pairs.push({ c, vals: [...cands[r][c]] });
    }
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        if (pairs[i].vals[0] === pairs[j].vals[0] && pairs[i].vals[1] === pairs[j].vals[1]) {
          for (let c = 0; c < 9; c++) {
            if (c !== pairs[i].c && c !== pairs[j].c && grid[r][c] === 0) {
              const before = cands[r][c].size;
              cands[r][c].delete(pairs[i].vals[0]);
              cands[r][c].delete(pairs[i].vals[1]);
              if (cands[r][c].size < before) progress = true;
            }
          }
        }
      }
    }
  }
  return progress;
}

function solvePointingPairs(grid: number[][], cands: Candidates): boolean {
  let progress = false;
  for (let box = 0; box < 9; box++) {
    const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
    for (let n = 1; n <= 9; n++) {
      const positions: Array<[number, number]> = [];
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) {
        if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push([r, c]);
      }
      if (positions.length < 2 || positions.length > 3) continue;
      const allSameRow = positions.every(p => p[0] === positions[0][0]);
      const allSameCol = positions.every(p => p[1] === positions[0][1]);
      if (allSameRow) {
        const row = positions[0][0];
        for (let c = 0; c < 9; c++) {
          if (c >= bc && c < bc + 3) continue;
          if (grid[row][c] === 0 && cands[row][c].has(n)) { cands[row][c].delete(n); progress = true; }
        }
      }
      if (allSameCol) {
        const col = positions[0][1];
        for (let r = 0; r < 9; r++) {
          if (r >= br && r < br + 3) continue;
          if (grid[r][col] === 0 && cands[r][col].has(n)) { cands[r][col].delete(n); progress = true; }
        }
      }
    }
  }
  return progress;
}

function solveXWing(grid: number[][], cands: Candidates): boolean {
  let progress = false;
  for (let n = 1; n <= 9; n++) {
    // Row-based X-Wing
    const rowPositions: Map<number, number[]> = new Map();
    for (let r = 0; r < 9; r++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++) if (grid[r][c] === 0 && cands[r][c].has(n)) cols.push(c);
      if (cols.length === 2) rowPositions.set(r, cols);
    }
    const rows = [...rowPositions.keys()];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const ci = rowPositions.get(rows[i])!;
        const cj = rowPositions.get(rows[j])!;
        if (ci[0] === cj[0] && ci[1] === cj[1]) {
          for (let r = 0; r < 9; r++) {
            if (r === rows[i] || r === rows[j]) continue;
            for (const c of ci) {
              if (grid[r][c] === 0 && cands[r][c].has(n)) { cands[r][c].delete(n); progress = true; }
            }
          }
        }
      }
    }
  }
  return progress;
}

export interface SolveResult {
  solved: boolean;
  techniquesUsed: Technique[];
  maxDifficulty: number;
  difficultyLabel: string;
  stepsCount: number;
}

export function solvePuzzleLogically(puzzle: number[][]): SolveResult {
  const grid = puzzle.map(r => [...r]);
  const cands = initCandidates(grid);
  const used = new Set<Technique>();
  let steps = 0;
  const maxIter = 200;

  for (let iter = 0; iter < maxIter; iter++) {
    let progress = false;

    if (solveNakedSingles(grid, cands)) { used.add("naked_single"); progress = true; steps++; }
    if (progress) continue;

    if (solveHiddenSingles(grid, cands)) { used.add("hidden_single"); progress = true; steps++; }
    if (progress) continue;

    if (solveNakedPairs(grid, cands)) { used.add("naked_pair"); progress = true; steps++; }
    if (progress) continue;

    if (solvePointingPairs(grid, cands)) { used.add("pointing_pair"); progress = true; steps++; }
    if (progress) continue;

    if (solveXWing(grid, cands)) { used.add("x_wing"); progress = true; steps++; }
    if (progress) continue;

    break;
  }

  const solved = grid.every(r => r.every(v => v !== 0));
  const techniques = [...used] as Technique[];
  const maxDiff = techniques.length > 0
    ? Math.max(...techniques.map(t => TECHNIQUE_DIFFICULTY[t]))
    : 0;

  let label = "Fácil";
  if (maxDiff >= 4) label = "Experto";
  else if (maxDiff >= 3) label = "Difícil";
  else if (maxDiff >= 2) label = "Medio";

  if (!solved && maxDiff < 5) {
    label = "Diabólico";
  }

  return {
    solved,
    techniquesUsed: techniques,
    maxDifficulty: maxDiff,
    difficultyLabel: label,
    stepsCount: steps,
  };
}
