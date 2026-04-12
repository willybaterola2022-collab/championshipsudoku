# CURSOR — SPRINT COMPLETO DE PROFUNDIDAD (NO NEGOCIABLE)

> Las tareas 1-5 anteriores ya están implementadas. Este archivo las reemplaza.
> Claude Code ejecutó TODO el backend. Acá está lo que falta en frontend.
> **Hacé todo en orden. Sin saltar. Sin negociar tiempos.**

## Estado backend (actualizado)

- 610 puzzles: 500 classic + 30 killer + 50 mini 6x6 + 30 diagonal 9x9
- 530 puzzles clasificados con solver (técnicas requeridas guardadas en BD)
- 15 puzzles marcados como "destacados" (3 por dificultad)
- Tabla `sudoku_unlocks` con 12 unlockables por nivel
- RPCs: `get_featured_sudoku_puzzles()`, `get_sudoku_unlocks(level)`
- Variantes: `classic`, `killer`, `mini6`, `diagonal` en tabla `sudoku_puzzles`
- Todo lo anterior (12 EFs, 4 crons, missions, speed) sigue activo

---

## BLOQUE A — Solver visible en producto

### A1. Mostrar técnicas en selector de dificultad

En `DifficultySelector.tsx`, para cada dificultad mostrar qué técnicas se necesitan:

```ts
const TECHNIQUE_INFO: Record<string, string> = {
  easy: "Singles — ideal para empezar",
  medium: "Singles + eliminación — equilibrado",
  hard: "Pares + eliminación avanzada",
  expert: "X-Wing, cadenas — para expertos",
  fiendish: "Técnicas avanzadas — solo veteranos",
};
```

Tooltip o texto debajo de cada opción en el select.

### A2. Badge de técnica en el tablero durante la partida

Mostrar un badge discreto arriba del tablero: "Puzzle nivel 2 — Requiere pares". Dato viene de la query al puzzle (si viene de `sudoku_puzzles` server-side) o del solver local:

```ts
import { solvePuzzleLogically, TECHNIQUE_LABELS } from "@/lib/sudoku/solver";
// Al generar o cargar puzzle:
const analysis = solvePuzzleLogically(puzzleGrid);
// analysis.techniquesUsed: ["naked_single", "naked_pair"]
// analysis.difficultyLabel: "Medio"
```

### A3. Filtrar puzzles por técnica en `/play`

Agregar filtro opcional: "Solo puzzles con pairs" / "Solo puzzles con X-Wing". Query:

```ts
const { data } = await supabase
  .from("sudoku_puzzles")
  .select("*")
  .contains("techniques_required", ["naked_pair"])
  .limit(1);
```

---

## BLOQUE B — Coach pedagógico

### B1. Refinar copy de los 3 niveles de hint

El hint ya funciona con `level: 1 | 2 | 3`. Mejorar la UI:

- **Antes del primer hint**: mostrar tooltip "3 niveles: zona → técnica → respuesta"
- **Nivel 1**: mostrar en un banner encima del tablero (no toast que desaparece). Color azul suave. Texto: lo que devuelve `data.zone`.
- **Nivel 2**: mismo banner, color amarillo. Texto: `data.technique` + `data.explanation`.
- **Nivel 3**: colocar número + banner verde con explicación completa.
- El banner persiste hasta que el jugador toca otra celda.

### B2. Telemetría de hints

Después de cada hint, guardar en localStorage qué nivel usó:

```ts
const hintLog = JSON.parse(localStorage.getItem("sudoku-hint-log") || "[]");
hintLog.push({ level: usedLevel, technique: data.technique, timestamp: Date.now() });
localStorage.setItem("sudoku-hint-log", JSON.stringify(hintLog.slice(-100)));
```

Mostrar en Profile: "Usaste 23 pistas este mes — 60% nivel 1, 30% nivel 2, 10% nivel 3" (indica que el jugador está mejorando si usa menos nivel 3).

---

## BLOQUE C — Post-partida: enseñar qué pasó

### C1. Técnicas usadas en GameResult

Al completar puzzle, correr el solver en el puzzle original:

```ts
const analysis = solvePuzzleLogically(originalPuzzle);
```

Mostrar en GameResult debajo del percentil:
- "Este puzzle requería: Single desnudo, Par desnudo"
- "Dificultad lógica: Medio (nivel 2)"
- Si `analysis.techniquesUsed` incluye algo avanzado: badge "Resolviste un puzzle con X-Wing"

### C2. Replay texto (lista de pasos)

El solver devuelve `stepsCount`. Para un replay más detallado, necesitás trackear los pasos:

Crear `src/lib/sudoku/solverDetailed.ts` que extiende el solver para devolver cada paso:

```ts
interface SolveStep {
  row: number;
  col: number;
  value: number;
  technique: Technique;
  explanation: string; // "Fila 3: solo queda el 7"
}
```

Mostrar como lista scrollable en GameResult:
- "Paso 1: R1C3 = 5 (Single desnudo)"
- "Paso 2: R4C7 = 8 (Single oculto en columna)"
- Click en un paso → resaltar la celda en un tablero estático miniatura

### C3. Comparación tu camino vs óptimo

Si el jugador completó en 45 movimientos y el solver lo hace en 28:
- "Tu camino: 45 pasos — Óptimo: 28 pasos"
- "Eficiencia: 62%"

Esto necesita que `useSudokuGame` cuente movimientos correctos (ya tiene `history.length`).

---

## BLOQUE D — Progresión que importa

### D1. Sistema de unlocks

Hook `src/hooks/useUnlocks.ts`:

```ts
export function useUnlocks() {
  const { profile } = useAuth();
  const level = profile?.level ?? 1;

  return useQuery({
    queryKey: ["sudoku-unlocks", level],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_sudoku_unlocks", { p_user_level: level });
      return data ?? [];
    },
  });
}
```

### D2. Pantalla de progresión

Nueva sección en Profile (o página `/progress`):

- Lista de unlocks agrupados por tipo (temas, variantes, dificultades, features)
- Cada item: icono + nombre + "Nivel X requerido" + barra de progreso hasta ese nivel
- Los desbloqueados: borde dorado + "Desbloqueado"
- Los bloqueados: gris + icono de candado + "Te faltan N niveles"

### D3. Bloquear variantes/dificultades por nivel

En el selector de dificultad y en la selección de variantes:
- Si `expert` requiere nivel 7 y el jugador es nivel 3: mostrar candado + tooltip "Desbloqueá al nivel 7"
- Si `diagonal` requiere nivel 5: igual
- `mini6` y `easy`/`medium`/`hard` están desde nivel 1

**Importante**: esto NO bloquea en modo offline (sin auth). Solo bloquea si hay perfil con nivel bajo. Sin auth = todo abierto (para no frustrar nuevos usuarios).

---

## BLOQUE E — Puzzles destacados

### E1. Sección "Destacados" en Landing

Debajo del tablero hero, sección "Puzzles destacados":

```ts
const { data: featured } = await supabase.rpc("get_featured_sudoku_puzzles", { p_limit: 5 });
```

5 cards en scroll horizontal:
- Badge con dificultad
- Título: "Destacado #1"
- Razón: "Requiere técnicas avanzadas"
- CTA: "Jugar" → navega a `/play` con ese puzzle pre-cargado

### E2. Badge en puzzle del día

Si el daily es un puzzle featured, mostrar badge dorado "Puzzle destacado" en `/daily`.

---

## BLOQUE F — Variantes nuevas (Mini 6x6 + Diagonal)

### F1. Selector de variante en Landing y /play

Agregar tabs o pills encima del tablero:

```
[Clásico] [Killer] [Mini 6x6] [Diagonal]
```

Cada tab filtra el tipo de puzzle que se genera/carga.

### F2. Mini Sudoku 6x6

**Board**: grid 6x6 con cajas 2x3 (2 filas × 3 columnas). Números 1-6.

**Cambios en componentes**:
- `SudokuBoard.tsx`: aceptar prop `gridSize: 6 | 9` (default 9). Ajustar CSS grid, bordes gruesos.
- `SudokuCell.tsx`: notas de 1-6 (no 1-9) si gridSize=6
- `NumPad.tsx`: mostrar solo 1-6 si gridSize=6 (grid 2x3 en vez de 3x3)
- `DifficultySelector.tsx`: mismas dificultades pero con menos givens para 6x6

**Generación**: si el jugador elige Mini, cargar un puzzle de la BD con `variant='mini6'`:

```ts
const { data } = await supabase
  .from("sudoku_puzzles")
  .select("puzzle, solution, difficulty")
  .eq("variant", "mini6")
  .eq("difficulty", selectedDifficulty)
  .order("times_played", { ascending: true })
  .limit(1)
  .single();
```

Si no hay puzzles server-side, generar client-side (necesita `generator6x6.ts` — SOLO SI el generador actual no soporta 6x6). Claude puede crear ese módulo si lo necesitás — anotá en COORDINATION.md.

### F3. Diagonal Sudoku 9x9

**Board**: grid 9x9 normal pero las 2 diagonales están resaltadas visualmente (fondo dorado sutil). Regla extra: las diagonales principales también deben tener 1-9 únicos.

**Cambios en componentes**:
- `SudokuBoard.tsx`: si `variant='diagonal'`, agregar clase CSS a las celdas diagonales (`r === c` y `r + c === 8`)
- `SudokuCell.tsx`: prop `isDiagonal?: boolean` → fondo distinto
- `validator.ts`: NO MODIFICAR (está en zona compartida). En vez de eso, crear `src/lib/sudoku/diagonalValidator.ts` que extiende el validator con checks de diagonal.

**CSS** para celdas diagonales:

```css
.sudoku-cell-diagonal {
  background: hsla(43, 90%, 55%, 0.08);
  border-color: hsla(43, 90%, 55%, 0.15);
}
```

### F4. Ruta /play/mini y /play/diagonal

```tsx
<Route path="/play/mini" element={<PlayMini />} />
<Route path="/play/diagonal" element={<PlayDiagonal />} />
```

O mejor: un solo `/play` con query param `?variant=mini6` que cambia el comportamiento.

---

## BLOQUE G — Visual polish

### G1. Pencil marks automáticos

Botón en GameControls: icono `Wand2` de Lucide. Al clickear: recorre todas las celdas vacías y rellena notas con candidatos válidos.

```ts
function autoFillNotes(board: Board, gridSize = 9): Board {
  const next = cloneBoard(board);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (next[r][c].value !== null) continue;
      const notes: CellNotes = {};
      for (let n = 1; n <= gridSize; n++) {
        // Check row, col, box
        let valid = true;
        for (let i = 0; i < gridSize; i++) {
          if (next[r][i].value === n || next[i][c].value === n) { valid = false; break; }
        }
        if (valid) {
          const boxH = gridSize === 6 ? 2 : 3;
          const boxW = gridSize === 6 ? 3 : 3;
          const br = Math.floor(r / boxH) * boxH, bc = Math.floor(c / boxW) * boxW;
          for (let rr = br; rr < br + boxH && valid; rr++)
            for (let cc = bc; cc < bc + boxW && valid; cc++)
              if (next[rr][cc].value === n) valid = false;
        }
        if (valid) notes[n] = true;
      }
      next[r][c] = { ...next[r][c], notes };
    }
  }
  return next;
}
```

**Unlock**: solo si nivel >= 2 (check contra `get_sudoku_unlocks`). Sin auth = siempre disponible.

### G2. Calendario de actividad (30 días)

Componente `src/components/sudoku/ActivityCalendar.tsx`:

- 30 círculos en fila (o grid 5x6)
- Query: `supabase.from("sudoku_game_sessions").select("created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo)`
- Agrupar por fecha → Set de fechas activas
- Cada círculo: verde si jugó, gris si no, dorado si es hoy
- Mostrar en Profile

### G3. Stats con Recharts

En Profile, gráfico de línea:

```ts
// Query últimas 30 sesiones agrupadas por fecha
const { data } = await supabase
  .from("sudoku_game_sessions")
  .select("time_ms, difficulty, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: true })
  .limit(50);
```

- Eje X: fecha
- Eje Y: tiempo promedio (ms → min:seg)
- Líneas por dificultad (colores distintos)
- Tooltip con detalle

---

## ORDEN DE EJECUCIÓN (no negociable)

1. **A1 + A2** — técnicas en selector + badge en tablero
2. **B1** — refinar copy hints (banner en vez de toast)
3. **C1 + C2** — técnicas en GameResult + replay texto
4. **F1 + F2 + F3** — variantes Mini + Diagonal (selector + board + rutas)
5. **D1 + D2 + D3** — unlocks (hook, pantalla, bloqueos)
6. **E1 + E2** — puzzles destacados en Landing + Daily
7. **G1 + G2 + G3** — pencil marks, calendario, Recharts

## LO QUE NO TOCAR

- `supabase/**`
- `src/lib/sudokuService.ts`
- `src/contexts/AuthContext.tsx`
- `src/lib/sudoku/generator.ts`, `validator.ts` (crear archivos NUEVOS si necesitás variantes, NO modificar estos)
- `solver.ts` — solo importarlo, no editarlo

## DESPUÉS DE CADA BLOQUE

1. `npm run typecheck` verde
2. `npm run build` verde
3. Commit con `feat: <bloque y qué>`
4. Push a main
5. Verificar en https://championshipsudoku.vercel.app

## SI ALGO DEL BACKEND NO EXISTE

Anotá en `docs/COORDINATION.md` qué necesitás y seguí con el siguiente bloque. Claude lo resuelve.
