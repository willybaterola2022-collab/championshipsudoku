# CURSOR — PRÓXIMAS TAREAS (leer PRIMERO)

> Este archivo reemplaza la necesidad de leer todo COORDINATION.md.
> Claude Code actualizó el backend. Acá está lo que falta en frontend.
> **No leas COORDINATION.md entero** — leé solo esto.

## Estado: backend LISTO, frontend PENDIENTE

Claude Code desplegó 12 Edge Functions, 4 crons, 530 puzzles, tablas para missions y speed mode. Todo live en Supabase. **Solo falta que vos construyas los componentes y hooks que lo consumen.**

---

## TAREA 1 — Hint 3 niveles (PRIORIDAD ALTA)

La EF `sudoku-hint` ahora acepta `level: 1 | 2 | 3` en el body.

**Cambio en `useSudokuGame.ts`** (línea ~446 aprox donde llama `sudoku-hint`):

```ts
// ANTES:
const { data } = await supabase.functions.invoke("sudoku-hint", {
  body: { board, row, col, solution },
});

// DESPUÉS: agregar level al body
const { data } = await supabase.functions.invoke("sudoku-hint", {
  body: { board, row, col, solution, level: hintLevel },
});
```

**Cambio en `GameControls.tsx`**: el botón Hint necesita 3 estados. Opción simple:

- Primer click → `level: 1` → muestra toast con `data.zone` ("Mirá la fila 3")
- Si clickea de nuevo la misma celda → `level: 2` → muestra toast con `data.explanation` ("Es un single desnudo...")
- Tercer click → `level: 3` → coloca el número + muestra explicación IA

Cada nivel consume 1 uso de hint. El response cambia según level:

```ts
// level 1: { level: 1, zone: "Mirá la fila 3", value: null }
// level 2: { level: 2, technique: "Single desnudo", explanation: "...", value: null }
// level 3: { level: 3, technique: "Single desnudo", value: 7, explanation: "..." }
```

Solo colocar el número cuando `data.value !== null` (level 3).

---

## TAREA 2 — Post-game stats en GameResult (PRIORIDAD ALTA)

Después de completar un puzzle, `sudoku_game_sessions` ahora tiene columna `percentile`.

**Opción A** (simple): leer el percentile de la sesión recién creada:

```ts
// Después de submitPuzzleResult(), hacer:
const { data: session } = await supabase
  .from("sudoku_game_sessions")
  .select("percentile")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// Mostrar en GameResult:
// "Más rápido que el {session.percentile}% de los jugadores"
```

**Opción B** (si querés más datos): llamar directamente el post-game (requiere internal secret, así que mejor usar Opción A).

**En `GameResult.tsx`**: agregar debajo del tiempo:

- `"Más rápido que el 78% de los jugadores"` (de `percentile`)
- Badge "Nuevo récord" si el tiempo es menor que `profile.sudoku_best_times[difficulty]`

---

## TAREA 3 — Weekly Missions (PRIORIDAD MEDIA)

### Hook `src/hooks/useWeeklyMissions.ts`:

```ts
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function useWeeklyMissions() {
  const { user } = useAuth();
  const weekStart = getMonday(new Date());

  return useQuery({
    queryKey: ["sudoku-weekly-missions", weekStart, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch missions for this week
      const { data: missions } = await supabase
        .from("sudoku_weekly_missions")
        .select("*")
        .eq("week_start", weekStart);

      if (!missions?.length) return [];

      // Fetch user progress
      const { data: progress } = await supabase
        .from("sudoku_mission_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("mission_id", missions.map(m => m.id));

      return missions.map(m => ({
        ...m,
        progress: progress?.find(p => p.mission_id === m.id) ?? null,
      }));
    },
  });
}
```

### Componente `src/components/sudoku/WeeklyMissions.tsx`:

- 3 cards horizontales (mobile: vertical stack)
- Cada card: título, descripción, barra de progreso (current_value / target_value), XP reward
- Si `completed && !claimed` → botón "Reclamar" que llama `supabase.functions.invoke("sudoku-claim-mission", { body: { mission_id } })`
- Si `claimed` → badge "Reclamado" en verde

**Dónde ponerlo**: en Landing.tsx o Profile.tsx, debajo del XP bar. Solo visible si hay user autenticado.

---

## TAREA 4 — Speed Mode página /speed (PRIORIDAD MEDIA)

### Nuevo `src/pages/Speed.tsx`:

```ts
// Hook para obtener challenge actual
const { data } = await supabase.rpc("get_current_speed_challenge");
// data: { challenge_id, puzzle, solution, difficulty, starts_at, ends_at, completions }
```

Página con:
- Header: "Speed Challenge" + countdown hasta `ends_at` (reusá DailyCountdown adaptado)
- Badge: "Dificultad: Medio" + "N jugadores completaron"
- Tablero: mismo que `/play` pero con puzzle del challenge (parse `data.puzzle` y `data.solution` como JSON)
- Al completar: `supabase.functions.invoke("sudoku-speed-submit", { body: { challenge_id, time_ms, errors } })`
- Mostrar rank devuelto: "Puesto #3 de 45"
- Debajo: leaderboard con `supabase.rpc("get_speed_leaderboard", { p_challenge_id, p_limit: 20 })`

**Ruta**: en App.tsx agregar `<Route path="/speed" element={<Speed />} />`
**Navbar**: agregar link "Speed" entre "Diario" y "Perfil"

---

## TAREA 5 — Daily: mostrar día + dificultad (TRIVIAL)

En `/daily`, el daily ahora varía por día de la semana. Mostrar:

```tsx
const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const today = new Date();
// daily.difficulty viene de la query a sudoku_daily_challenges
<p>{dayNames[today.getUTCDay()]} — {daily.difficulty} (+{daily.bonus_xp} XP)</p>
```

---

## TAREAS OPCIONALES (si hay tiempo)

### 6. Pencil marks automáticos

Botón en GameControls: "Auto-notas". Al clickear, recorre todas las celdas vacías y calcula candidatos válidos por fila/col/box. Puro frontend, sin backend.

```ts
function autoFillNotes(board: Board): Board {
  const next = cloneBoard(board);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (next[r][c].value !== null) continue;
      const notes: CellNotes = {};
      for (let n = 1; n <= 9; n++) {
        if (getCellConflicts(/* board with n placed */).length === 0) notes[n] = true;
      }
      next[r][c].notes = notes;
    }
  }
  return updateAllErrors(next);
}
```

### 7. Calendario actividad (30 días)

Componente con 30 círculos en fila. Verde si jugó ese día, gris si no. Datos de `sudoku_game_sessions` agrupados por fecha.

### 8. Stats con Recharts en Profile

Recharts ya está instalado. Gráfico de línea con tiempo promedio por dificultad (últimos 30 días).

---

## Estado implementación (Cursor)

Tareas 1–5 cubiertas en código: hint con `level` 1–3 + `nextHintLevel` / `aria-label`, `useWinPostGameStats` + `GameResult`, `useWeeklyMissions` + `WeeklyMissions` (Landing + Profile), `/speed` + Navbar + `speedMeta` en `useSudokuGame`, daily con línea día UTC + dificultad. Si un RPC no existe en tu proyecto Supabase, la UI de Speed muestra error recuperable.

## LO QUE NO TOCAR

- `supabase/**` — no tocar EFs ni migraciones
- `src/lib/sudokuService.ts` — no modificar
- `src/contexts/AuthContext.tsx` — no modificar
- `src/lib/sudoku/generator.ts`, `validator.ts`, `solver.ts` — no modificar

## DESPUÉS DE CADA TAREA

1. `npm run typecheck` verde
2. `npm run build` verde
3. Commit con `feat: <qué>` o `fix: <qué>`
4. Push a main (auto-deploy a Vercel)
5. Verificar en https://championshipsudoku.vercel.app
