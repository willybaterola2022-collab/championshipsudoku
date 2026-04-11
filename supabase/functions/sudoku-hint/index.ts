// sudoku-hint
// Auth: JWT required
// Rate: 10/min per user
// AI hint coach via _shared/llm.ts (Haiku primary → Gemini fallback → template).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callLLM } from "../_shared/llm.ts";
import { checkRateLimit, getIdentifier, getServiceClient } from "../_shared/rateLimit.ts";

interface Body {
  board: number[][];
  row: number;
  col: number;
  solution: number[][];
}

function boardToString(board: number[][]): string {
  return board.map((row) => row.map((v) => v || ".").join(" ")).join("\n");
}

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

    // Rate limit
    const service = getServiceClient();
    const id = getIdentifier(req, userData.user.id);
    const rl = await checkRateLimit(service, id, "sudoku-hint", 10);
    if (!rl.allowed) {
      return jsonResponse(
        req,
        { error: "Rate limit exceeded", retry_after_ms: rl.retry_after_ms },
        429
      );
    }

    const body = (await req.json()) as Body;
    if (!body.board || !body.solution || body.row == null || body.col == null) {
      return jsonResponse(req, { error: "Missing board, solution, row, or col" }, 400);
    }

    const value = body.solution[body.row]?.[body.col];
    if (!value || value < 1 || value > 9) {
      return jsonResponse(req, { error: "Invalid solution at cell" }, 400);
    }

    const prompt = `Eres un coach de Sudoku experto. Explica en español, en UNA frase clara y concisa (máximo 30 palabras), la técnica que revela que la celda en la fila ${body.row + 1}, columna ${body.col + 1} debe ser ${value}.

Tablero actual (. = vacío):
${boardToString(body.board)}

Responde SOLO con la explicación de la técnica. No saludes, no menciones el número si no es necesario para la explicación. Usa términos como: single desnudo, par oculto, eliminación, cadena, casilla única en caja/fila/columna.`;

    const explanation = await callLLM(
      [{ role: "user", content: prompt }],
      200,
      `La celda en fila ${body.row + 1}, columna ${body.col + 1} debe ser ${value} por eliminación directa.`,
      "haiku"
    );

    // Simple technique detection from explanation
    const lower = explanation.toLowerCase();
    let technique = "Eliminación";
    if (lower.includes("single") || lower.includes("único")) technique = "Naked Single";
    else if (lower.includes("par oculto") || lower.includes("hidden")) technique = "Hidden Pair";
    else if (lower.includes("caja")) technique = "Box Elimination";
    else if (lower.includes("fila")) technique = "Row Elimination";
    else if (lower.includes("columna")) technique = "Column Elimination";

    return jsonResponse(req, { value, technique, explanation });
  } catch (err) {
    return jsonResponse(
      req,
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
