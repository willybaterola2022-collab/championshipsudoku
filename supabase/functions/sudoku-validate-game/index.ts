// sudoku-validate-game
// Auth: JWT required
// Stateless solution check. No DB writes. Used for debugging, hint previews, etc.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";

interface Body {
  board: number[][];
  solution: number[][];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as Body;
    if (!body.board || !body.solution) {
      return jsonResponse(req, { error: "Missing board or solution" }, 400);
    }

    const conflicts: Array<{ row: number; col: number; expected: number; actual: number }> = [];
    let emptyCells = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = body.board[r]?.[c] ?? 0;
        const s = body.solution[r]?.[c] ?? 0;
        if (!v) {
          emptyCells++;
          continue;
        }
        if (v !== s) conflicts.push({ row: r, col: c, expected: s, actual: v });
      }
    }

    return jsonResponse(req, {
      valid: conflicts.length === 0,
      complete: emptyCells === 0 && conflicts.length === 0,
      conflicts,
      empty_cells: emptyCells,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
