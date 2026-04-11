# Championship Sudoku — API Contracts (Edge Functions)

> All endpoints live under `https://ahsullbcdrekmribkcbm.supabase.co/functions/v1/`
> All responses include CORS headers via `_shared/cors.ts`
> All responses that fail return `{ error: string, code?: string }` + appropriate HTTP status

## 1. sudoku-save-game

Guarda una partida completada, verifica server-side, y encadena a `sudoku-grant-xp`.

```
POST /functions/v1/sudoku-save-game
Auth: Authorization: Bearer <JWT>
Content-Type: application/json

Body:
{
  "puzzle_id": "uuid | null",       // null si el puzzle fue generado client-side
  "difficulty": "easy" | "medium" | "hard" | "expert" | "fiendish",
  "variant": "classic" | "killer",
  "time_ms": 247000,
  "errors": 2,
  "hints_used": 1,
  "board_state": [[5,3,4,...],...],  // 9x9 tablero final del usuario
  "solution": [[5,3,4,...],...]      // 9x9 solución real
}

Response 200:
{
  "session_id": "uuid",
  "verified": true,
  "xp_gained": 60,
  "new_xp_total": 1340,
  "new_level": 5,
  "achievements_unlocked": ["sudoku_first_puzzle"]
}

Response 400: { "error": "Solution does not match board_state" }
Response 401: { "error": "Authentication required" }
```

**Lógica**:
1. Parse JWT → `user_id`
2. Verify `board_state === solution` celda por celda
3. Verify `isComplete(board_state)` (sin nulos, sin errores)
4. INSERT `sudoku_game_sessions` con `completed=true`, `perfect=(errors===0)`
5. Fetch internally: `sudoku-grant-xp` con `x-internal-secret`
6. Return combined response

## 2. sudoku-validate-game

Valida un tablero contra la solución sin persistir nada. Uso: hint coach, debugging, preview.

```
POST /functions/v1/sudoku-validate-game
Auth: Authorization: Bearer <JWT>

Body:
{
  "board": [[5,3,0,...],...],     // 0 o null = vacío
  "solution": [[5,3,4,...],...]
}

Response 200:
{
  "valid": true,
  "complete": false,
  "conflicts": [
    { "row": 2, "col": 5, "expected": 7, "actual": 9 }
  ],
  "empty_cells": 23
}
```

## 3. sudoku-grant-xp (INTERNAL ONLY)

**No invocar desde cliente**. Solo desde otras EFs vía `x-internal-secret` header.

```
POST /functions/v1/sudoku-grant-xp
Headers:
  x-internal-secret: <INTERNAL_SECRET>

Body:
{
  "user_id": "uuid",
  "session_id": "uuid",
  "difficulty": "medium",
  "variant": "classic",
  "time_ms": 247000,
  "errors": 2,
  "hints_used": 1,
  "is_daily": false
}

Response 200:
{
  "xp_gained": 60,
  "new_xp_total": 1340,
  "new_level": 5,
  "level_up": true,
  "achievements_unlocked": ["sudoku_first_puzzle"]
}

Response 409: { "error": "XP already granted for this session" }
```

**Cálculo XP base**:
- easy=30, medium=50, hard=80, expert=120, fiendish=200

**Bonuses multiplicativos** (se componen):
- perfect (errors===0): +20%
- speed (time_ms < 300000): +15%
- no_hints (hints_used===0): +10%
- killer variant: +30%
- is_daily: +50 flat

**Nivel**: `xpToNext = floor(100 * 1.4^(level-1))`, cap 50

**Idempotencia**: INSERT `xp_grants(user_id, 'sudoku_puzzle_solved', session_id, xp_granted)` con unique constraint. Si ya existe, devuelve 409.

## 4. sudoku-hint

AI hint coach. Devuelve el número correcto + explicación en español de la técnica.

```
POST /functions/v1/sudoku-hint
Auth: Authorization: Bearer <JWT>
Rate limit: 10/min per user

Body:
{
  "board": [[5,3,0,...],...],
  "row": 2,
  "col": 5,
  "solution": [[5,3,4,...],...]
}

Response 200:
{
  "value": 7,
  "technique": "Naked Single",
  "explanation": "En la fila 3, solo falta el 7 y todas las demás celdas ya tienen valor. Por eliminación, esta celda debe ser 7."
}

Response 429: { "error": "Rate limit exceeded", "retry_after_ms": 3200 }
```

**Lógica**:
1. Extrae `value = solution[row][col]`
2. Llama `_shared/llm.ts → callLLM()` con prompt en español, modelo Haiku, fallback a template
3. Si LLM falla, devuelve `{ value, technique: "Eliminación directa", explanation: "La celda correcta es <value>." }`

## 5. sudoku-daily-cron

Cron job diario a las 00:00 UTC. Selecciona puzzle del día e inserta en `sudoku_daily_challenges`.

```
POST /functions/v1/sudoku-daily-cron
Headers:
  x-internal-secret: <INTERNAL_SECRET>

Body: none

Response 200:
{
  "challenge_date": "2026-04-12",
  "puzzle_id": "uuid",
  "difficulty": "medium",
  "already_existed": false
}
```

**Idempotente**: Si ya existe registro para `CURRENT_DATE`, devuelve `already_existed: true` sin error. Unique constraint en `challenge_date` protege contra race conditions.

## 6. sudoku-daily-submit

Enviar resultado del puzzle diario. Calcula ranking.

```
POST /functions/v1/sudoku-daily-submit
Auth: Authorization: Bearer <JWT>
Rate limit: 30/hour per user

Body:
{
  "challenge_id": "uuid",
  "time_ms": 247000,
  "errors": 2,
  "board_state": [[...]]
}

Response 200:
{
  "solved": true,
  "rank_today": 12,
  "total_completions": 145,
  "xp_gained": 100,
  "percentile": 92
}

Response 409: { "error": "Already completed today", "already_claimed": true }
```

## 7. sudoku-leaderboard

Read público de rankings.

```
POST /functions/v1/sudoku-leaderboard
Auth: none
Rate limit: 30/min per IP

Body:
{
  "type": "daily" | "all_time_solved" | "all_time_perfect",
  "difficulty": "easy" | "medium" | "hard" | "expert" | "fiendish" | null,
  "limit": 20
}

Response 200:
{
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "display_name": "user123",
      "time_ms": 152000,
      "errors": 0,
      "completed_at": "2026-04-12T14:23:11Z"
    }
  ],
  "total": 145,
  "as_of": "2026-04-12T15:00:00Z"
}
```

## 8. sudoku-health-check

Endpoint público de health para Vercel + CI + monitoring externo.

```
GET /functions/v1/sudoku-health-check
Auth: none

Response 200:
{
  "ok": true,
  "checks": {
    "db": true,
    "sudoku_puzzles_count": 5000,
    "daily_exists_today": true,
    "llm": true
  },
  "timestamp": "2026-04-12T15:00:00Z"
}

Response 503:
{
  "ok": false,
  "checks": { "db": false, ... },
  "error": "Database unreachable"
}
```

## CORS (compartido)

Allowed origins (via `_shared/cors.ts`):
- `https://championshipsudoku.vercel.app`
- `https://championshipchess.vercel.app`
- `*.vercel.app` (previews)
- `http://localhost:5173`
- `http://localhost:8080`

## Rate limiting (compartido)

Usamos `_shared/rateLimit.ts` + tabla `edge_function_calls` de chess (reuso directo). Patrón:

```ts
const { allowed, retry_after_ms } = await checkRateLimit(supabase, user_id ?? ip, "sudoku-hint", 10);
if (!allowed) return new Response(JSON.stringify({ error: "Rate limit exceeded", retry_after_ms }), { status: 429, headers: corsHeaders });
```
