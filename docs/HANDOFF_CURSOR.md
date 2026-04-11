# HANDOFF — Cursor (Frontend Owner)

> **Leé este doc entero antes de tocar código.**
> Cursor no tiene memoria persistente entre sesiones. Este doc es tu cinta y tu contrato. Si algo cambia, actualizalo.

## Qué sos y qué no sos

**Sos**: el dueño del frontend — páginas, componentes de UI, hooks de React, estilos.
**No sos**: backend, edge functions, migraciones SQL, pipeline server, auth context core, cliente de Supabase.

Si tenés que tocar algo fuera de tu zona, **escribilo primero en `docs/COORDINATION.md`** con fecha y razón. Si no, te pisás con Claude Code.

## Zone ownership (memorizala)

| Tuya | De Claude Code | Compartida (coordinar) |
|---|---|---|
| `src/pages/**` | `supabase/**` | `src/lib/sudoku/**` (lógica pura) |
| `src/components/**` | `scripts/**` | `src/index.css` |
| `src/hooks/**` | `.github/**` | `tailwind.config.ts` |
| `src/App.tsx` | `src/lib/sudokuService.ts` | `package.json` |
| `src/main.tsx` | `src/contexts/AuthContext.tsx` | |
| | `src/integrations/supabase/client.ts` | |

## Reglas no-negociables (aprendizajes de Championship Chess)

1. **Nunca decir "funciona" sin probarlo en la URL live en este momento**. Compilar no cuenta. Local dev no cuenta. Tests verdes no cuentan. Probar en `championshipsudoku.vercel.app` después de deploy. Si no está desplegado, entonces está pendiente.
2. **Nunca commitear `.env`**. Hay `.gitignore` desde día 0. Usar `.env.example` como template.
3. **Spanish en toda UI**. Playfair Display (títulos) + Inter (body). Dark mode always.
4. **Nada de emojis en UI**. Solo iconos Lucide.
5. **Mobile-first base 360px**. Probar en móvil antes de decir "listo".
6. **No hardcodear URLs de Supabase ni keys**. Todo por `import.meta.env.VITE_*`.
7. **No crear archivos `.md` de documentación sin que te lo pidan**. Este proyecto usa `docs/` y `CLAUDE.md` como fuentes de verdad. No generes `NOTES.md`, `TODO.md`, `CHANGELOG.md` sueltos.
8. **No intentes "limpiar" o refactorizar código de Claude** (EFs, migraciones, sudokuService, AuthContext, cliente Supabase). Si algo te molesta, lo anotas en `COORDINATION.md` y Claude lo revisa.
9. **`profiles.user_id` es la FK a `auth.users`**, no `profiles.id`. Siempre `.eq('user_id', user.id)`.
10. **Commits con prefijo**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. Un commit por cosa lógica, no megacommits.
11. **No toques hooks que ya funcionan para refactorizar**. Si funciona, no lo toques.
12. **Pedí el código a v0.dev en componentes aislados**, no páginas enteras. Luego integrás vos manualmente.

## Stack que vas a usar

- React 18 + Vite + TypeScript strict mode
- Tailwind 3.4 (config ya hecho, con tokens CSS vars)
- shadcn/ui (instalarás primitives a demanda con `npx shadcn-ui@latest add button dialog` etc.)
- React Router DOM 6.30
- TanStack Query 5.83 para server state
- Sonner para toasts (`import { toast } from "sonner"`)
- Framer Motion para animaciones complejas (solo donde aporta)
- Lucide React para iconos

## Lo que ya está hecho por Claude Code (no lo rehagas)

### Infraestructura
- `package.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `tailwind.config.ts`, `postcss.config.js`
- `.gitignore`, `.env.example`
- `index.html` con meta tags y fonts

### Lógica del juego (pura, sin React)
- `src/lib/sudoku/types.ts` — tipos: `Board`, `Cell`, `Difficulty`, `HistoryEntry`, `DIFFICULTY_CONFIG`
- `src/lib/sudoku/generator.ts` — `generatePuzzle(difficulty)` con solución única
- `src/lib/sudoku/validator.ts` — `getCellConflicts()`, `updateAllErrors()`, `checkCompletion()`
- `src/lib/sudoku/killer-types.ts` — tipos Killer
- `src/lib/sudoku/killer-generator.ts` — generador de jaulas

**Usá estos directamente en tus hooks. No los copies ni los muevas.**

### Backend integration
- `src/integrations/supabase/client.ts` — cliente Supabase singleton
- `src/contexts/AuthContext.tsx` — provider con `useAuth()` → `{ user, session, profile, loading, refreshProfile }`
- `src/lib/sudokuService.ts` — pipeline `submitPuzzleResult()`. **Llamalo al completar un puzzle.**

### Edge Functions (ya desplegadas por Claude)
No las llamás directo. Usá `sudokuService` que las orquesta. Solo `sudoku-hint` y `sudoku-leaderboard` se llaman directo desde hooks específicos.

## Lo que tenés que hacer (Sprint 1)

### 1. Hooks (port desde spec Lovable)
- `src/hooks/useSudokuGame.ts` — estado completo del juego clásico
  - `{ board, solution, difficulty, selectedCell, isNotesMode, timer, isPaused, isCompleted, errorCount, history, hintsUsed }`
  - Actions: `newGame(difficulty)`, `loadGame()`, `hasSavedGame()`, `placeNumber(n)`, `eraseCell()`, `undo()`, `toggleNotes()`, `togglePause()`, `useHint()`
  - Auto-save en localStorage key `sudoku-game-state` en cada cambio
- `src/hooks/useKillerSudokuGame.ts` — mismo patrón con `cages`. Key: `sudoku-killer-game-state`
- `src/hooks/usePlayerProgress.ts`:
  - Primary: Supabase si hay auth (lee/escribe via `sudokuService`)
  - Fallback: localStorage key `sudoku-player-progress`
  - Shape: `{ level, xp, xpToNext, streakDays, puzzlesSolved, bestTimes, achievements, weeklyActivity }`
  - Función `syncLocalToSupabase()` para one-time al login

### 2. Componentes base
- `src/components/Navbar.tsx` — sticky top, logo, nav links, user menu
- `src/components/sudoku/SudokuBoard.tsx` — grid 9x9 con bordes gruesos cada 3 celdas, glow dorado
- `src/components/sudoku/SudokuCell.tsx` — celda con value, notas 3x3, estados (selected, error, given, highlight-row-col-box, same-number)
- `src/components/sudoku/NumPad.tsx` — 3x3 botones, deshabilita completados
- `src/components/sudoku/GameControls.tsx` — 4 botones circulares 72px: Undo, Erase, Notes, Hint (con badge de pistas restantes)
- `src/components/sudoku/DifficultySelector.tsx` — dropdown con 5 dificultades
- `src/components/sudoku/Timer.tsx` — cronómetro pausable con blur
- `src/components/sudoku/ProgressBar.tsx` — % celdas completadas
- `src/components/sudoku/GameResult.tsx` — overlay de victoria con stats y share
- `src/components/sudoku/XPBar.tsx` — barra de XP + nivel + rango
- `src/components/sudoku/StreakCounter.tsx` — indicador racha
- `src/components/sudoku/BoardThemeSelector.tsx` — 4 temas (classic, minimal, contrast, neon)

### 3. Páginas
- `src/pages/Index.tsx` — landing con hero tablero interactivo + CTA jugar + stats rápidos
- `src/pages/Play.tsx` — juego clásico pantalla completa con keyboard shortcuts (1-9, Backspace, Ctrl+Z, N)
- `src/pages/PlayKiller.tsx` — Killer Sudoku con cage overlay
- `src/pages/Daily.tsx` (Sprint 2) — puzzle del día + countdown + leaderboard
- `src/pages/Profile.tsx` (Sprint 2) — stats, logros, historial
- `src/pages/Login.tsx` (Sprint 2) — Google + email
- `src/pages/NotFound.tsx`

### 4. Router + App shell
- `src/App.tsx` ya está scaffoldado por Claude. Agregá tus rutas ahí.
- `src/main.tsx` ya incluye `<AuthProvider>`, `<QueryClientProvider>`, `<Toaster>`.

### 5. Estilos
- `src/index.css` — agregá los 4 temas de tablero (classic/minimal/contrast/neon) con CSS custom props `--sudoku-cell-*`
- Animaciones ya están en `tailwind.config.ts`: `cell-pop`, `cell-error`, `fade-in`, `glow-pulse`

## Cómo usar `sudokuService` (no lo reescribas)

```ts
import { sudokuService } from "@/lib/sudokuService";
import { useAuth } from "@/contexts/AuthContext";

function GameComponent() {
  const { user } = useAuth();

  async function onPuzzleComplete() {
    const result = await sudokuService.submitPuzzleResult({
      puzzleId: null,               // null si generado client-side
      difficulty: "medium",
      variant: "classic",
      timeMs: timer,
      errors: errorCount,
      hintsUsed: hintsUsed,
      boardState: board.map(row => row.map(c => c.value ?? 0)),
      solution: solution,
    });

    if (result.persisted) {
      // Supabase OK — mostrar XP gained, achievements, level up
      toast.success(`+${result.xpGained} XP`);
    } else {
      // No auth — guardar en localStorage para sync posterior
      localStorage.setItem("pending_sync", JSON.stringify(result.localPayload));
    }
  }
}
```

## Cómo llamar a `sudoku-hint` directo

```ts
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("sudoku-hint", {
  body: { board: currentBoard, row: selectedRow, col: selectedCol, solution },
});
// data: { value, technique, explanation }
```

## Cómo llamar al leaderboard

```ts
const { data } = await supabase.functions.invoke("sudoku-leaderboard", {
  body: { type: "daily", limit: 20 },
});
// data.entries: [{ rank, user_id, display_name, time_ms, errors, completed_at }]
```

## QA antes de declarar "listo"

Antes de decir "terminé el Sprint 1" en `COORDINATION.md`, verificá en la URL live (no en localhost):

1. Tablero renderiza 9x9
2. Clickeás celda → se selecciona y resalta
3. NumPad inserta números
4. Errores se pintan en rojo
5. Undo revierte
6. Notas toggleables
7. Pausar oscurece el tablero
8. Completar un puzzle muestra overlay
9. Keyboard: 1-9, Backspace, Ctrl+Z funcionan
10. Mobile: se ve bien en 360px
11. PWA: prompt de instalar en móvil
12. Sin `console.log` en producción
13. Sin errores en consola del browser
14. Lighthouse mobile > 85
15. Rutas funcionan: `/`, `/play`, `/play/killer`, `/404`

## Cuando termines

1. Actualizá `docs/COORDINATION.md` con una entrada: fecha + qué hiciste + qué quedó pendiente + qué rompiste (si algo)
2. `npm run typecheck && npm run build` verde
3. Commit con mensaje semántico
4. Push — CI correrá solo
5. Verificá Vercel deploy verde
6. Probá en URL live los 15 items
7. Reportá a Barbara con 1 frase: "Sprint 1 done — URL verde, 15/15 QA, pendiente X para Sprint 2"

## Si te trabás

- Si algo del backend no funciona, **no intentes arreglarlo**. Anotalo en `COORDINATION.md` y decile a Barbara que Claude Code lo resuelva.
- Si la spec de un componente no está clara, lee `SUDOKU_PROJECT_DOCUMENTATION (1).md` en la carpeta padre — tiene toda la especificación Lovable original.
- Si tenés duda de ownership, **es de Claude Code** (es más seguro).

## Recursos

- Spec original Lovable: `../SUDOKU_PROJECT_DOCUMENTATION (1).md`
- Plan: `docs/PLAN.md`
- Arquitectura: `docs/ARCHITECTURE.md`
- API contracts: `docs/ENDPOINTS.md`
- Schema DB: `docs/SCHEMA.md`
- Brand/diseño: `docs/HANDOFF_V0.md`
