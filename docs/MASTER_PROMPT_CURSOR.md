# MASTER PROMPT — Cursor

> Barbara: copiá el bloque de abajo y pegalo como **primer mensaje** en Cursor cuando abras el proyecto. Es el contrato completo. No lo mezcles con otras instrucciones — dejalo solo como primera instrucción.

---

## COPIAR DESDE ACÁ ↓

Estás trabajando en **Championship Sudoku**, segundo juego del ecosistema SKYNET P004 — Casual Games. Es proyecto hermano de Championship Chess. Tu rol es el **frontend owner**. El backend, edge functions, migraciones SQL y pipeline server son de Claude Code (otro agente) — **no los toques**.

### Antes de escribir una línea

Leé en este orden estos archivos del repo:

1. `CLAUDE.md` — contexto general + reglas no-negociables
2. `docs/HANDOFF_CURSOR.md` — tu rol, tu zona, cómo integrar, QA
3. `docs/ARCHITECTURE.md` — decisiones y stack
4. `docs/ENDPOINTS.md` — qué llama cada Edge Function (ya las creó Claude, no las rehagas)
5. `docs/PLAN.md` — sprints y Definition of Done
6. `docs/HANDOFF_V0.md` — prompts para v0.dev
7. El archivo hermano `../SUDOKU_PROJECT_DOCUMENTATION (1).md` tiene la spec original Lovable. Úsalo como referencia de features y UX, pero no como source of truth técnico — el source of truth es `CLAUDE.md` + `docs/`

### Tu zona (lo que SÍ podés tocar)

- `src/pages/**`
- `src/components/**` (excepto `src/components/ui/**` que son primitives shadcn)
- `src/hooks/**`
- `src/App.tsx` (agregar rutas, no cambiar providers)
- `src/index.css` (agregar temas de tablero, no tocar tokens base)
- Instalar dependencias nuevas con `npm install` si las necesitás (pero justificá en commit)

### Zona prohibida (no toques sin anotarlo en `docs/COORDINATION.md` primero)

- `supabase/**` — todo el backend
- `scripts/**` — quality gates
- `.github/workflows/**` — CI
- `src/lib/sudokuService.ts` — pipeline submit
- `src/contexts/AuthContext.tsx` — auth layer
- `src/integrations/supabase/client.ts` — Supabase singleton
- `src/lib/sudoku/**` — lógica pura del juego (tipos, generador, validador, killer). Ya están portados. **No los reescribas aunque no te gusten.**
- `CLAUDE.md` y todos los `docs/**` — fuentes de verdad de Claude Code

### Sprint 1 — qué construir (en este orden)

**Fase 1: Hooks** (usá `src/lib/sudoku/*` que ya existen)

1. `src/hooks/useSudokuGame.ts` — estado completo juego clásico:
   - Estado: `{ board, solution, difficulty, selectedCell, isNotesMode, timer, isPaused, isCompleted, errorCount, history, hintsUsed }`
   - Acciones: `newGame(difficulty)`, `loadGame()`, `hasSavedGame()`, `placeNumber(n)`, `eraseCell()`, `undo()`, `toggleNotes()`, `togglePause()`, `useHint()` (llama `supabase.functions.invoke('sudoku-hint', ...)`)
   - Auto-save en localStorage key `sudoku-game-state` en cada cambio
   - Al completar → llama `sudokuService.submitPuzzleResult()` (NO lo reescribas, solo usalo)

2. `src/hooks/useKillerSudokuGame.ts` — mismo patrón con `cages`. Key localStorage: `sudoku-killer-game-state`

3. `src/hooks/usePlayerProgress.ts`:
   - Lee/escribe Supabase vía `supabase.from('profiles').select(...)` si `user` presente
   - Fallback a localStorage key `sudoku-player-progress` si no hay auth
   - Shape: `{ level, xp, xpToNext, rank, streakDays, puzzlesSolved, bestTimes, achievements }`
   - Expone `syncLocalToSupabase()` para one-time al login

4. `src/hooks/use-mobile.tsx` — detect mobile viewport (< 768px)

**Fase 2: Componentes** (usá shadcn primitives: `npx shadcn-ui@latest add button dialog select progress toast`)

Componentes mínimos para Sprint 1:
- `src/components/Navbar.tsx`
- `src/components/sudoku/SudokuBoard.tsx`
- `src/components/sudoku/SudokuCell.tsx`
- `src/components/sudoku/NumPad.tsx`
- `src/components/sudoku/GameControls.tsx`
- `src/components/sudoku/DifficultySelector.tsx`
- `src/components/sudoku/Timer.tsx`
- `src/components/sudoku/ProgressBar.tsx`
- `src/components/sudoku/GameResult.tsx`
- `src/components/sudoku/XPBar.tsx`
- `src/components/sudoku/StreakCounter.tsx`
- `src/components/sudoku/BoardThemeSelector.tsx`

Para el diseño, usá los prompts de v0.dev en `docs/HANDOFF_V0.md`. Generá los bloques en v0, pegalos acá, integralos con los hooks.

**Fase 3: Páginas**
- `src/pages/Index.tsx` — landing con tablero hero interactivo (juega directo ahí)
- `src/pages/Play.tsx` — juego clásico full-screen con keyboard shortcuts (1-9, Backspace, Ctrl+Z, N)
- `src/pages/PlayKiller.tsx` — Killer Sudoku
- `src/pages/NotFound.tsx`

Rutas en `src/App.tsx` (el scaffold ya tiene `<Routes>`):
- `/` → `Index`
- `/play` → `Play`
- `/play/killer` → `PlayKiller`
- `*` → `NotFound`

**Fase 4: Estilos**
- `src/index.css` — agregar 4 temas de tablero: `.board-theme-classic`, `.board-theme-minimal`, `.board-theme-contrast`, `.board-theme-neon` con CSS custom props `--sudoku-cell-*` (ver spec original)
- Animaciones ya están en `tailwind.config.ts`: `animate-cell-pop`, `animate-cell-error`, `animate-fade-in`, `animate-glow-pulse`

### Reglas no-negociables

1. **Nunca decir "funciona" sin probarlo en la URL live en este momento**. Compilar no cuenta. Local dev no cuenta. Probar en `championshipsudoku.vercel.app` después de deploy.
2. **Nunca commitear `.env`**. Usar `.env.example` como template.
3. **Spanish en toda UI**. Playfair Display (títulos) + Inter (body). Dark mode always.
4. **Sin emojis en UI**. Solo iconos Lucide.
5. **Mobile-first base 360px**.
6. **No hardcodear URLs Supabase ni keys**. Todo por `import.meta.env.VITE_*`.
7. **No crear archivos `.md` sueltos**. Usar `docs/COORDINATION.md` append-only para logs.
8. **No refactorizar código de Claude** (EFs, migraciones, sudokuService, AuthContext, cliente Supabase). Si algo te molesta, anotalo en `COORDINATION.md`.
9. **`profiles.user_id` es FK a `auth.users`**, no `profiles.id`. Siempre `.eq('user_id', user.id)`.
10. **Commits con prefijo**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
11. **No touches hooks que funcionan para refactorizar por estética**. Si funciona, no lo toques.
12. **v0.dev solo para componentes aislados**, no páginas enteras.
13. **Antes de cualquier push**, correr `npm run typecheck && npm run build`. Si falla, no pusheás.
14. **`profiles.xp` nunca se actualiza desde cliente**. Solo vía `sudokuService.submitPuzzleResult()` → EF `sudoku-grant-xp` → UPDATE service-role.

### Definition of Done Sprint 1

Antes de decir "Sprint 1 terminado":

- [ ] `npm run typecheck` verde
- [ ] `npm run build` verde
- [ ] URL live en Vercel (Barbara la conecta)
- [ ] Jugar clásico en `/play` sin errores
- [ ] Jugar Killer en `/play/killer` sin errores
- [ ] Los 15 items del QA Checklist (ver `CLAUDE.md` sección QA Checklist) **verificados en URL live**, no localhost
- [ ] Entrada nueva en `docs/COORDINATION.md` con qué se hizo y qué quedó pendiente
- [ ] Mensaje a Barbara: "Sprint 1 done — <URL> — 15/15 QA — pendientes: <lista>"

### Lo que NO construyas (fuera de alcance este sprint)

- Auth / login (Sprint 2 con Claude)
- Supabase persistence (Sprint 2)
- Daily puzzle page (Sprint 3)
- Profile page (Sprint 3)
- Leaderboard (Sprint 3)
- 1v1 multiplayer (Fase 4 post-tracción)
- Story mode (NUNCA en este proyecto)
- Stripe (Fase 4)
- Analytics / Sentry / PostHog (Fase 4)
- Push notifications (Fase 4)

### Cómo coordinarte con Claude Code

- Si necesitás que una EF devuelva un campo extra → abrí entrada en `docs/COORDINATION.md` con la petición, no la toques vos
- Si encontrás un bug en el backend → idem
- Si necesitás una tabla nueva → idem
- Si querés cambiar el schema DB → idem

Claude Code lee `docs/COORDINATION.md` al empezar cada sesión y responde a los pendientes abiertos.

### Si te trabás

- Spec técnica: `docs/ENDPOINTS.md`, `docs/SCHEMA.md`
- Spec de features/UX: `../SUDOKU_PROJECT_DOCUMENTATION (1).md`
- Duda de ownership: **es de Claude Code** (más seguro)
- Duda de diseño: usá `docs/HANDOFF_V0.md` como guía o pedile a v0.dev

### Empezá ahora

1. `npm install`
2. `cp .env.example .env.local` (pedile a Barbara los valores reales)
3. `npm run dev` — verificá que arranque sin errores
4. Leé `src/lib/sudoku/*.ts` para entender la API pública (no los cambies)
5. Empezá por `useSudokuGame.ts` → `SudokuBoard.tsx` → `SudokuCell.tsx` → `NumPad.tsx` → `Play.tsx`
6. Probá incrementalmente en `npm run dev`
7. Commit por feature completo, no megacommits
8. Al final del sprint, deploy via Vercel + QA 15/15 en URL live

**Objetivo del Sprint 1**: URL pública donde cualquiera pueda jugar Sudoku clásico y Killer sin login. Offline-first. PWA instalable.

Cuando termines, actualizá `docs/COORDINATION.md` con una entrada nueva y avisá a Barbara.

## COPIAR HASTA ACÁ ↑

---

## Notas para Barbara (no copiar a Cursor)

- Si Cursor se desvía, recordale que lea `docs/HANDOFF_CURSOR.md` otra vez
- Si Cursor quiere refactorizar algo de Claude, redirigilo a `docs/COORDINATION.md`
- Si Cursor pregunta por feature fuera de alcance, recordale "Fase 4 post-tracción"
- Al final del Sprint 1, verificá con tu propios ojos los 15 items del QA Checklist en la URL live antes de dar por cerrado
