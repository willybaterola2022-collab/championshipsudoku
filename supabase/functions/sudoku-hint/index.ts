// sudoku-hint
// Auth: JWT required
// Rate: 10/min per user
// 3-level hint system: zone → technique → answer
// AI coach via _shared/llm.ts (Haiku primary → Gemini fallback → template).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callLLM } from "../_shared/llm.ts";
import { checkRateLimit, getIdentifier, getServiceClient } from "../_shared/rateLimit.ts";

interface Body {
  board: number[][];
  row: number;
  col: number;
  solution: number[][];
  level?: 1 | 2 | 3; // 1=zone, 2=technique, 3=answer (default 3 for backwards compat)
}

function boardToString(board: number[][]): string {
  return board.map((row) => row.map((v) => v || ".").join(" ")).join("\n");
}

function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
}

function detectBasicTechnique(board: number[][], row: number, col: number, value: number): string {
  // Count how many candidates the cell has
  const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let c = 0; c < 9; c++) if (board[row][c]) candidates.delete(board[row][c]);
  for (let r = 0; r < 9; r++) if (board[r][col]) candidates.delete(board[r][col]);
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (board[r][c]) candidates.delete(board[r][c]);

  if (candidates.size === 1) return "naked_single";

  // Check if value is unique in row/col/box (hidden single)
  let uniqueInRow = true, uniqueInCol = true, uniqueInBox = true;
  for (let c = 0; c < 9; c++) {
    if (c !== col && !board[row][c]) {
      const rowCands = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let cc = 0; cc < 9; cc++) if (board[row][cc]) rowCands.delete(board[row][cc]);
      for (let rr = 0; rr < 9; rr++) if (board[rr][c]) rowCands.delete(board[rr][c]);
      const bbr = Math.floor(row / 3) * 3, bbc = Math.floor(c / 3) * 3;
      for (let rr = bbr; rr < bbr + 3; rr++) for (let cc = bbc; cc < bbc + 3; cc++) if (board[rr][cc]) rowCands.delete(board[rr][cc]);
      if (rowCands.has(value)) uniqueInRow = false;
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && !board[r][col]) {
      const colCands = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let cc = 0; cc < 9; cc++) if (board[r][cc]) colCands.delete(board[r][cc]);
      for (let rr = 0; rr < 9; rr++) if (board[rr][col]) colCands.delete(board[rr][col]);
      const bbr = Math.floor(r / 3) * 3, bbc = Math.floor(col / 3) * 3;
      for (let rr = bbr; rr < bbr + 3; rr++) for (let cc = bbc; cc < bbc + 3; cc++) if (board[rr][cc]) colCands.delete(board[rr][cc]);
      if (colCands.has(value)) uniqueInCol = false;
    }
  }
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && !board[r][c]) {
        const boxCands = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let cc = 0; cc < 9; cc++) if (board[r][cc]) boxCands.delete(board[r][cc]);
        for (let rr = 0; rr < 9; rr++) if (board[rr][c]) boxCands.delete(board[rr][c]);
        const bbr2 = Math.floor(r / 3) * 3, bbc2 = Math.floor(c / 3) * 3;
        for (let rr = bbr2; rr < bbr2 + 3; rr++) for (let cc = bbc2; cc < bbc2 + 3; cc++) if (board[rr][cc]) boxCands.delete(board[rr][cc]);
        if (boxCands.has(value)) uniqueInBox = false;
      }
    }
  }

  if (uniqueInRow) return "hidden_single_row";
  if (uniqueInCol) return "hidden_single_col";
  if (uniqueInBox) return "hidden_single_box";
  return "advanced";
}

const TECHNIQUE_NAMES: Record<string, string> = {
  naked_single: "Single desnudo",
  hidden_single_row: "Single oculto en fila",
  hidden_single_col: "Single oculto en columna",
  hidden_single_box: "Single oculto en caja",
  advanced: "Técnica avanzada",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return jsonResponse(req, { error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return jsonResponse(req, { error: "Invalid token" }, 401);

    const service = getServiceClient();
    const id = getIdentifier(req, userData.user.id);
    const rl = await checkRateLimit(service, id, "sudoku-hint", 10);
    if (!rl.allowed) {
      return jsonResponse(req, { error: "Rate limit exceeded", retry_after_ms: rl.retry_after_ms }, 429);
    }

    const body = (await req.json()) as Body;
    if (!body.board || !body.solution || body.row == null || body.col == null) {
      return jsonResponse(req, { error: "Missing board, solution, row, or col" }, 400);
    }

    const value = body.solution[body.row]?.[body.col];
    if (!value || value < 1 || value > 9) {
      return jsonResponse(req, { error: "Invalid solution at cell" }, 400);
    }

    const level = body.level ?? 3;
    const technique = detectBasicTechnique(body.board, body.row, body.col, value);
    const techniqueName = TECHNIQUE_NAMES[technique] ?? "Técnica avanzada";
    const boxNum = getBoxIndex(body.row, body.col);

    // LEVEL 1: Zone only — no value, no technique name
    if (level === 1) {
      let zone = `Mirá la fila ${body.row + 1}`;
      if (technique === "hidden_single_col") zone = `Mirá la columna ${body.col + 1}`;
      else if (technique === "hidden_single_box") zone = `Mirá la caja ${boxNum}`;
      else if (technique === "naked_single") zone = `Esta celda tiene muy pocos candidatos. Mirá qué números faltan.`;

      return jsonResponse(req, {
        level: 1,
        zone,
        technique: null,
        value: null,
        explanation: null,
      });
    }

    // LEVEL 2: Technique — no value
    if (level === 2) {
      let hint = "";
      if (technique === "naked_single") {
        hint = `Es un single desnudo: eliminá todos los números que ya están en la fila ${body.row + 1}, columna ${body.col + 1} y caja ${boxNum}. Solo queda un candidato.`;
      } else if (technique.startsWith("hidden_single")) {
        const where = technique === "hidden_single_row" ? `fila ${body.row + 1}` :
                      technique === "hidden_single_col" ? `columna ${body.col + 1}` :
                      `caja ${boxNum}`;
        hint = `Es un single oculto: hay un número que solo puede ir en esta celda dentro de la ${where}. Buscá cuál.`;
      } else {
        hint = `Requiere una técnica avanzada. Probá analizar pares o cadenas de eliminación en la fila ${body.row + 1} y columna ${body.col + 1}.`;
      }

      return jsonResponse(req, {
        level: 2,
        zone: null,
        technique: techniqueName,
        value: null,
        explanation: hint,
      });
    }

    // LEVEL 3: Full answer + AI explanation
    const prompt = `Eres un coach de Sudoku experto. Explica en español, en UNA frase clara (máximo 40 palabras), por qué la celda fila ${body.row + 1}, columna ${body.col + 1} debe ser ${value}.

Técnica detectada: ${techniqueName}.

Tablero actual (. = vacío):
${boardToString(body.board)}

Responde SOLO la explicación. Usa el nombre de la técnica. No saludes.`;

    const explanation = await callLLM(
      [{ role: "user", content: prompt }],
      200,
      `Por ${techniqueName.toLowerCase()}: eliminando los números presentes en la fila ${body.row + 1}, columna ${body.col + 1} y caja ${boxNum}, solo queda el ${value}.`,
      "haiku"
    );

    return jsonResponse(req, {
      level: 3,
      zone: null,
      technique: techniqueName,
      value,
      explanation,
    });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
