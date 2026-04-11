# Master Prompt Cursor — Sprint 3 + Sprint 4

> Barbara: este es el prompt para la SEGUNDA sesión de Cursor. Se lo pegás mañana cuando abrás el proyecto.
> Cursor ya cerró Sprint 1 (frontend core). Esto es lo siguiente.

---

## COPIAR DESDE ACÁ ↓

Estás de vuelta en **Championship Sudoku**. Cerraste Sprint 1 con 2142 líneas de frontend core (13 componentes, 4 hooks, 3 páginas). Ahora arranca Sprint 3 + Sprint 4 en paralelo.

### Contexto que cambió desde tu última sesión

Claude Code ya desplegó el backend en producción (Sprint 2):
- Las 8 Edge Functions están live en `https://ahsullbcdrekmribkcbm.supabase.co/functions/v1/`
- Las 4 migraciones SQL aplicadas
- 500 puzzles seed cargados (100 por dificultad)
- Cron `sudoku-daily-cron` activo
- Detalle completo en `docs/COORDINATION.md` con URLs y comandos ejecutados

**Implicación**: las llamadas a `supabase.functions.invoke('sudoku-hint', ...)` y `sudokuService.submitPuzzleResult()` ahora devuelven datos reales. Antes eran fire-and-forget que fallaban silenciosamente.

### Antes de escribir código, releé

1. `docs/COORDINATION.md` — estado real del backend post-Sprint 2
2. `docs/ENDPOINTS.md` — contratos exactos (usá los nombres de campos exactos del response)
3. `docs/HANDOFF_CURSOR.md` — zona ownership (sin cambios)
4. `CLAUDE.md` — reglas no-negociables (sin cambios)

### Tu zona (igual que antes)

Podés tocar: `src/pages/**`, `src/components/**` (no `ui/**`), `src/hooks/**`, `src/App.tsx`, `src/index.css`.
NO toques: `supabase/**`, `scripts/**`, `.github/**`, `src/lib/sudokuService.ts`, `src/contexts/AuthContext.tsx`, `src/integrations/supabase/client.ts`, `src/lib/sudoku/**`, nada en `docs/**`.

### Sprint 3 — Auth + Perfil + Sync (prioridad 1)

#### 3.1 Fix del pipeline submit (no await)

En `src/hooks/useSudokuGame.ts` línea ~270 y `src/hooks/useKillerSudokuGame.ts` el equivalente, la llamada a `sudokuService.submitPuzzleResult()` está con `void` y **no captura el response**. Esto hace que XP real del servidor se pierda. Arreglalo así:

```ts
// Antes:
void sudokuService.submitPuzzleResult({ ... });

// Después:
const result = await sudokuService.submitPuzzleResult({
  puzzleId: null,
  difficulty,
  variant: "classic",
  timeMs: timerSeconds * 1000,
  errors: nextMistakes,
  hintsUsed,
  boardState: boardToNumbers(updated),
  solution,
});
if (result.persisted && result.xpGained) {
  toast.success(`+${result.xpGained} XP`);
  if (result.levelUp) toast.message(`¡Nivel ${result.newLevel}!`);
  if (result.achievementsUnlocked?.length) {
    result.achievementsUnlocked.forEach(key =>
      toast.message("Logro desbloqueado", { description: key })
    );
  }
}
// NOTE: usePlayerProgress debe actualizarse con el XP del server, no el local calculado
```

Hacé el mismo fix en `useHint()` cuando el puzzle se completa por el hint.

#### 3.2 Página `/login`

Crear `src/pages/Login.tsx`:

- Card centrado glass, max-w-md
- Logo "Championship Sudoku" Playfair gold
- Botón "Continuar con Google" (usa `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile' } })`)
- Divider "o"
- Form email + password (react-hook-form + zod)
  - Tab "Entrar" usa `supabase.auth.signInWithPassword`
  - Tab "Crear cuenta" usa `supabase.auth.signUp`
- Estados: loading, error con toast, redirect a `/profile` al éxito
- Link "Volver a jugar" → `/`

Ruta en `App.tsx`: `<Route path="/login" element={<Login />} />`

#### 3.3 Página `/profile`

Crear `src/pages/Profile.tsx`:

- Si no hay `useAuth().user` → redirect a `/login`
- Header: avatar (Lucide User fallback) + display_name + nivel + rango
- Stats grid 4 cards:
  - XP total (del server)
  - Sudokus resueltos (total + breakdown por dificultad)
  - Racha actual (con best streak)
  - Mejor tiempo por dificultad (tabla)
- Achievements grid: 10 cards circulares, oro si unlocked, gris si no
- Botón "Cerrar sesión" → `supabase.auth.signOut()` → redirect `/`
- Link "Volver a jugar" → `/`

Datos: usá `usePlayerProgress()` actualizado (ver 3.4).

#### 3.4 `usePlayerProgress` híbrido

Reescribí `src/hooks/usePlayerProgress.ts` para tener dos ramas:

```ts
export function usePlayerProgress() {
  const { user, profile } = useAuth();

  if (user && profile) {
    // Rama Supabase: profile viene del AuthContext ya fetcheado
    // XP/level/rating/streak vienen de profile.xp, profile.level, etc.
    // Achievements: fetch user_achievements join achievements where category='sudoku'
    // bestTimes/puzzlesSolved: fetch last 50 sudoku_game_sessions agrupadas
    return { progress: {...}, rank, recordWin: noop /* servidor lo hace */ };
  }

  // Rama localStorage (el comportamiento actual, sin cambios)
  return currentLocalStorageImpl();
}
```

**Importante**: cuando hay `user`, `recordWin` NO debe actualizar nada local — el servidor es fuente de verdad. El XP aparece cuando `profile` se refetcha (usá `refreshProfile()` del AuthContext después de `submitPuzzleResult`).

#### 3.5 Sync al primer login

En `AuthContext.tsx` (ya existe, NO lo reescribas), hay un handler `onAuthStateChange`. **NO lo toques**. En vez de eso, creá un efecto en tu hook `usePlayerProgress` o en un nuevo `useLoginSync()` que cuando el user cambia de null → algo, llama `sudokuService.syncPending()` una vez:

```ts
// Nuevo hook: src/hooks/useLoginSync.ts
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { sudokuService } from "@/lib/sudokuService";
import { toast } from "sonner";

export function useLoginSync() {
  const { user } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;
    sudokuService.syncPending().then(({ synced }) => {
      if (synced > 0) {
        toast.success(`Sincronizadas ${synced} partidas offline`);
      }
    });
  }, [user]);
}
```

Llamalo en `App.tsx` adentro de un componente envoltorio (no top-level directo para tener context). O en `Profile.tsx` — da igual.

### Sprint 4 — Daily + Leaderboard (prioridad 2, paralelizable con 3)

#### 4.1 Hook `useDailyChallenge`

Nuevo `src/hooks/useDailyChallenge.ts`:

```ts
// Fetch today's challenge + solve it inline like a regular game
// Call sudoku-daily-submit instead of sudoku-save-game when completed
```

Fetch del challenge con `supabase.from('sudoku_daily_challenges').select('*, sudoku_puzzles(*)').eq('challenge_date', today).single()`.

#### 4.2 Componente `<Leaderboard>`

Nuevo `src/components/sudoku/Leaderboard.tsx`:

- Props: `{ type: "daily" | "all_time_solved", limit?: number }`
- Llama `supabase.functions.invoke('sudoku-leaderboard', { body: { type, limit: 20 } })`
- Renderiza tabla con rank, display_name, time_ms (formateado mm:ss), errors
- Top 3 con iconos Lucide Award (gold/silver/bronze color)
- Si `useAuth().user` y el user no está en top 20, mostrar su fila al final con separador "..."
- Estados: loading skeleton, empty "Sé el primero en completar el puzzle de hoy", error toast

#### 4.3 Página `/daily`

Nuevo `src/pages/Daily.tsx`:

- Header: "Puzzle del día" + fecha en español
- Countdown al próximo puzzle (componente `DailyCountdown` ya existe, reusalo)
- Badge "+50 XP bonus"
- Card: dificultad + tablero preview pequeño + botón "Jugar el puzzle del día"
- Al clickear: embed el tablero real (reusá `useDailyChallenge` + `SudokuBoard` + `NumPad` + `GameControls`)
- Al completar: llamar `sudoku-daily-submit` (no el save-game regular)
- Debajo: `<Leaderboard type="daily" />`

Ruta en `App.tsx`: `<Route path="/daily" element={<Daily />} />`

#### 4.4 Toast de achievements del server

En Play.tsx (y donde completas puzzle), capturar el response del pipeline y mostrar toasts de:
- XP ganado
- Level up (con animación/confetti opcional)
- Achievements unlocked (uno por uno con delay 500ms entre cada uno)

### Definition of Done conjunta Sprint 3 + 4

- [ ] `/login` funcional con Google OAuth (asumí que Claude habilitó el provider; si no, email/password alcanza)
- [ ] `/profile` muestra datos reales del server cuando hay auth
- [ ] `/daily` muestra puzzle del día + ranking
- [ ] Al completar puzzle logueado, toast muestra XP real del server (no local)
- [ ] Al loguear por primera vez, `syncPending()` descarga partidas offline
- [ ] `npm run typecheck` verde
- [ ] `npm run build` verde
- [ ] QA manual en `http://localhost:8080`:
  - Jugar sin login → ganar puzzle → ver XP local → hacer login → ver que la partida se sincronizó
  - Login → ir a `/profile` → ver stats → jugar → ver que XP subió
  - Ir a `/daily` → ver puzzle del día → completarlo → ver tu rank
- [ ] Entrada nueva en `docs/COORDINATION.md`: "2026-04-13 — Cursor — Sprint 3+4 UI completo" con qué se hizo y qué falta

### Lo que NO tenés que hacer

- NO deployar nada — eso lo hace Claude Code cuando mergeas
- NO tocar `supabase/**` — es zona prohibida
- NO modificar `sudokuService.ts` salvo que Claude lo pida en `docs/COORDINATION.md`
- NO agregar Sentry, PostHog, Stripe, push notifications — es prematuro
- NO crear páginas nuevas sin pedir en `docs/COORDINATION.md` primero
- NO instalar dependencias pesadas sin justificar en `docs/COORDINATION.md`

### Si te trabás

- Si una EF devuelve algo diferente al contrato de `ENDPOINTS.md` → anotalo en `COORDINATION.md`, no lo parchées
- Si el schema de BD no coincide con lo documentado → idem
- Si algo requiere cambio fuera de tu zona → idem

### Empezá ahora

1. `git pull origin main` (trae el trabajo de Claude del backend)
2. `npm install` (por si Claude agregó deps)
3. Leé `docs/COORDINATION.md` entrada del 2026-04-12 de Claude Code Sprint 2
4. Empezá por el fix del pipeline submit (Sprint 3.1) — es de 15 minutos y destraba todo lo demás
5. Después Sprint 3.2-3.5 en orden
6. Sprint 4 lo hacés después o en paralelo si te aburrís de auth

Cuando termines, append entrada en `docs/COORDINATION.md` y avisá a Barbara con 1 frase.

## COPIAR HASTA ACÁ ↑

---

## Notas para Barbara (no copiar a Cursor)

- Este prompt asume que Sprint 2 de Claude está aplicado. Claude actualiza `COORDINATION.md` con los resultados reales — si lo leés y algún paso falló, avisame antes de pasar este prompt a Cursor
- Cursor puede trabajar offline con `localhost` mientras Barbara resuelve GitHub/Vercel — no necesita el dominio live
- Sprint 3 + 4 combinados son ~1-2 sesiones de Cursor (estimado 500-800 líneas nuevas)
