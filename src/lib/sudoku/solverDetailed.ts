// Detailed step-by-step solver for replay feature.
// Returns each placement with technique name and human-readable explanation.

import { type Technique, TECHNIQUE_LABELS, TECHNIQUE_DIFFICULTY } from "./solver";

export interface SolveStep {
  row: number;
  col: number;
  value: number;
  technique: Technique;
  label: string;
  explanation: string;
}

export interface DetailedSolveResult {
  solved: boolean;
  steps: SolveStep[];
  maxDifficulty: number;
  techniquesUsed: Technique[];
}

function isValid(grid: number[][], row: number, col: number, num: number, size = 9): boolean {
  for (let i = 0; i < size; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const boxH = size === 6 ? 2 : 3;
  const boxW = size === 6 ? 3 : 3;
  const br = Math.floor(row / boxH) * boxH;
  const bc = Math.floor(col / boxW) * boxW;
  for (let r = br; r < br + boxH; r++) {
    for (let c = bc; c < bc + boxW; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

type Candidates = Set<number>[][];

function initCandidates(grid: number[][], size = 9): Candidates {
  const c: Candidates = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<number>())
  );
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) {
      if (grid[r][col] !== 0) continue;
      for (let n = 1; n <= size; n++) {
        if (isValid(grid, r, col, n, size)) c[r][col].add(n);
      }
    }
  }
  return c;
}

function place(
  grid: number[][],
  cands: Candidates,
  r: number,
  c: number,
  val: number,
  size = 9
): void {
  grid[r][c] = val;
  cands[r][c].clear();
  for (let i = 0; i < size; i++) {
    cands[r][i].delete(val);
    cands[i][c].delete(val);
  }
  const boxH = size === 6 ? 2 : 3;
  const boxW = size === 6 ? 3 : 3;
  const br = Math.floor(r / boxH) * boxH;
  const bc = Math.floor(c / boxW) * boxW;
  for (let rr = br; rr < br + boxH; rr++) {
    for (let cc = bc; cc < bc + boxW; cc++) {
      cands[rr][cc].delete(val);
    }
  }
}

function boxIndex(r: number, c: number, size = 9): number {
  const boxH = size === 6 ? 2 : 3;
  const boxW = size === 6 ? 3 : 3;
  return Math.floor(r / boxH) * (size / boxW) + Math.floor(c / boxW) + 1;
}

export function solveDetailed(puzzle: number[][], size = 9): DetailedSolveResult {
  const grid = puzzle.map((r) => [...r]);
  const cands = initCandidates(grid, size);
  const steps: SolveStep[] = [];
  const usedTechniques = new Set<Technique>();

  for (let iter = 0; iter < 300; iter++) {
    let progress = false;

    // Naked singles
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0 && cands[r][c].size === 1) {
          const val = [...cands[r][c]][0];
          steps.push({
            row: r,
            col: c,
            value: val,
            technique: "naked_single",
            label: TECHNIQUE_LABELS.naked_single,
            explanation: `R${r + 1}C${c + 1} = ${val} — es el único candidato posible en esta celda`,
          });
          place(grid, cands, r, c, val, size);
          usedTechniques.add("naked_single");
          progress = true;
        }
      }
    }
    if (progress) continue;

    // Hidden singles in rows
    for (let r = 0; r < size; r++) {
      for (let n = 1; n <= size; n++) {
        const positions: number[] = [];
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push(c);
        }
        if (positions.length === 1) {
          const c = positions[0];
          steps.push({
            row: r,
            col: c,
            value: n,
            technique: "hidden_single",
            label: TECHNIQUE_LABELS.hidden_single,
            explanation: `R${r + 1}C${c + 1} = ${n} — es el único lugar para el ${n} en la fila ${r + 1}`,
          });
          place(grid, cands, r, c, n, size);
          usedTechniques.add("hidden_single");
          progress = true;
        }
      }
    }
    // Hidden singles in columns
    for (let c = 0; c < size; c++) {
      for (let n = 1; n <= size; n++) {
        const positions: number[] = [];
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push(r);
        }
        if (positions.length === 1) {
          const r = positions[0];
          if (grid[r][c] !== 0) continue;
          steps.push({
            row: r,
            col: c,
            value: n,
            technique: "hidden_single",
            label: TECHNIQUE_LABELS.hidden_single,
            explanation: `R${r + 1}C${c + 1} = ${n} — es el único lugar para el ${n} en la columna ${c + 1}`,
          });
          place(grid, cands, r, c, n, size);
          usedTechniques.add("hidden_single");
          progress = true;
        }
      }
    }
    // Hidden singles in boxes
    const boxH = size === 6 ? 2 : 3;
    const boxW = size === 6 ? 3 : 3;
    const numBoxes = (size / boxH) * (size / boxW);
    for (let box = 0; box < numBoxes; box++) {
      const br = Math.floor(box / (size / boxW)) * boxH;
      const bc = (box % (size / boxW)) * boxW;
      for (let n = 1; n <= size; n++) {
        const positions: Array<[number, number]> = [];
        for (let r = br; r < br + boxH; r++) {
          for (let c = bc; c < bc + boxW; c++) {
            if (grid[r][c] === 0 && cands[r][c].has(n)) positions.push([r, c]);
          }
        }
        if (positions.length === 1) {
          const [r, c] = positions[0];
          if (grid[r][c] !== 0) continue;
          steps.push({
            row: r,
            col: c,
            value: n,
            technique: "hidden_single",
            label: TECHNIQUE_LABELS.hidden_single,
            explanation: `R${r + 1}C${c + 1} = ${n} — es el único lugar para el ${n} en la caja ${boxIndex(r, c, size)}`,
          });
          place(grid, cands, r, c, n, size);
          usedTechniques.add("hidden_single");
          progress = true;
        }
      }
    }
    if (progress) continue;

    // Naked pairs (elimination only, no placement)
    for (let r = 0; r < size; r++) {
      const pairs: Array<{ c: number; vals: number[] }> = [];
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0 && cands[r][c].size === 2) {
          pairs.push({ c, vals: [...cands[r][c]] });
        }
      }
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          if (
            pairs[i].vals[0] === pairs[j].vals[0] &&
            pairs[i].vals[1] === pairs[j].vals[1]
          ) {
            for (let c = 0; c < size; c++) {
              if (c !== pairs[i].c && c !== pairs[j].c && grid[r][c] === 0) {
                const before = cands[r][c].size;
                cands[r][c].delete(pairs[i].vals[0]);
                cands[r][c].delete(pairs[i].vals[1]);
                if (cands[r][c].size < before) {
                  usedTechniques.add("naked_pair");
                  progress = true;
                }
              }
            }
          }
        }
      }
    }
    if (progress) continue;

    break;
  }

  const solved = grid.every((r) => r.every((v) => v !== 0));
  const techniques = [...usedTechniques] as Technique[];
  const maxDiff =
    techniques.length > 0
      ? Math.max(...techniques.map((t) => TECHNIQUE_DIFFICULTY[t]))
      : 0;

  return { solved, steps, maxDifficulty: maxDiff, techniquesUsed: techniques };
}
