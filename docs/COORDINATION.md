# COORDINATION Log

> **Append-only**. No editar entradas pasadas — agregá al final.
> Cada agente (Claude Code, Cursor, Barbara) escribe una entrada cuando empieza/termina un sprint o toca algo fuera de su zona.
> Formato: `## YYYY-MM-DD HH:MM — <agent> — <title>`

---

## 2026-04-12 — Claude Code — Sprint 0: Foundation complete

**Qué se hizo**:
- Scaffold completo del proyecto: `package.json`, `tsconfig`, `vite.config.ts`, `vercel.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.gitignore`, `.env.example`, `README.md`, `CLAUDE.md`
- 8 documentos en `docs/`: `PLAN`, `ARCHITECTURE`, `ENDPOINTS`, `SCHEMA`, `HANDOFF_CURSOR`, `HANDOFF_V0`, `COORDINATION`, `MASTER_PROMPT_CURSOR`
- Lógica pura del juego en `src/lib/sudoku/`: `types.ts`, `generator.ts`, `validator.ts`, `killer-types.ts`, `killer-generator.ts`
- Scaffold mínimo `src/`: `main.tsx`, `App.tsx`, `index.css`, `contexts/AuthContext.tsx`, `integrations/supabase/client.ts`, `lib/sudokuService.ts`
- Backend completo en `supabase/`: `config.toml`, 3 `_shared/` modules, 8 Edge Functions stub funcionales, 4 migraciones SQL
- Scripts de calidad en `scripts/`: `pre-push.sh`, `test-runner.sh`, `ef-validator.sh`
- CI en `.github/workflows/ci.yml`

**Qué NO se hizo** (pendiente explícito):
- `npm install` — Barbara debe ejecutar
- Crear repo GitHub — Barbara debe ejecutar
- Conectar Vercel project — Barbara debe ejecutar
- Aplicar migraciones SQL en Supabase — Claude próxima sesión con acceso a CLI
- Desplegar Edge Functions — Claude próxima sesión
- Componentes UI (`src/components/sudoku/**`) — Cursor Sprint 1
- Páginas (`src/pages/**`) — Cursor Sprint 1
- Hooks de React (`src/hooks/**`) — Cursor Sprint 1

**Decisiones tomadas sin consultar** (documentadas en `ARCHITECTURE.md`):
- D1: mismo Supabase que chess (`ahsullbcdrekmribkcbm`)
- D2: reimplementación desde spec, no migración desde Lovable
- D3: offline-first con sync al login
- D4: stack idéntico a chess
- D5: v0.dev + Cursor para frontend
- D6: pipeline save → grant-xp idéntico a chess
- D7: 8 EFs (no 43)
- D8: 2 crons (no 22)
- D9: zone ownership estricto
- D10: quality gates desde día 0

**Qué rompió**: Nada. Proyecto desde cero.

**Próximo owner**: Barbara (para pasos locales) + Cursor (para Sprint 1 frontend).

---

---

## 2026-04-12 — Cursor — Sprint 1 Fase 1+2+3: Frontend core completo

**Qué se hizo** (auditado por Claude Code, 2142 líneas nuevas):

- **Hooks** (4):
  - `useSudokuGame.ts` (486 líneas) — estado completo clásico, timer, pausa, undo, history, notes, hints con `supabase.functions.invoke('sudoku-hint')`, auto-save localStorage, llamada a `sudokuService.submitPuzzleResult()` al completar. Integra `onWin` callback con `usePlayerProgress`.
  - `useKillerSudokuGame.ts` (420 líneas) — mismo patrón con cages.
  - `usePlayerProgress.ts` (187 líneas) — XP, niveles, rangos, streak, 10 achievements, localStorage. **Solo local de momento, falta rama Supabase para Sprint 3.**
  - `useSudokuKeyboard.ts` (43 líneas) — hook extra no previsto pero útil: centraliza keyboard shortcuts (1-9, Backspace, Ctrl+Z, N).

- **Componentes** (13): Navbar + SudokuBoard, SudokuCell, NumPad, GameControls, DifficultySelector, BoardThemeSelector (4 temas), Timer, ProgressBar, GameResult, XPBar, StreakCounter, DailyCountdown, CageOverlay. Todos respetan design tokens.

- **Páginas** (3): Landing (146 líneas — tablero hero jugable en home), Play (123), PlayKiller (129). Rutas conectadas en App.tsx.

- **Extras**: `src/lib/utils.ts` (helper `cn` de shadcn), `src/vite-env.d.ts`.

- **index.css**: 3 temas de tablero agregados (minimal, contrast, neon) como CSS custom props.

- **.env.example**: agregada var opcional `VITE_CHESS_APP_URL` para link a Chess en Navbar (buena idea, aprobada).

**Qué rompió**: Nada. No tocó zona de Claude Code (EFs, migraciones, sudokuService, AuthContext, client supabase, docs). 100% dentro de su zona.

**Cosas a corregir en Sprint 2 (Claude + Cursor coordinado)**:

1. ⚠️ `useSudokuGame.ts:270-279` — `sudokuService.submitPuzzleResult()` se llama **sin await**, solo con `void`. Esto funciona pero **el resultado no se muestra al usuario**. XP ganado, level up, achievements del servidor se pierden. **Fix Sprint 3**: pasarlo por un callback + actualizar `usePlayerProgress` con el response real del server.

2. ⚠️ `usePlayerProgress.ts` — **solo localStorage**. Necesita rama Supabase en Sprint 3 (cuando haya auth):
   - Si `user` → leer de `profiles` + `user_achievements` + `sudoku_game_sessions` (last N)
   - Si no → comportamiento actual
   - Exponer `syncPending()` al loguearse (ya está en `sudokuService.syncPending`, solo llamarlo desde AuthContext al primer login)

3. ⚠️ `useKillerSudokuGame.ts:273-279` probable mismo patrón de submit sin await — revisar Sprint 3.

4. `useSudokuGame.ts:198-199` — `MAX_MISTAKES = 3` hardcoded. El `sudoku-grant-xp` EF acepta cualquier número de errores. Coherente. OK.

5. `Landing.tsx` usa nombre "Landing" (Cursor lo cambió de "Index"). OK — más descriptivo.

**Pendientes explícitos del Sprint 1 UI**:

- [ ] Compilar verde local (`npm install && npm run dev`) — Barbara ejecuta
- [ ] Deploy a Vercel (Barbara crea proyecto + env vars)
- [ ] QA manual 15/15 en URL live (Barbara verifica con ojos)

**Próximo owner**: **PARALELO**. Barbara ejecuta `npm install` + crea GitHub + Vercel. Claude Code arranca Sprint 2 (migraciones + EFs deploy) en paralelo, no necesita esperar.

---

## 2026-04-12 — Claude Code — Sprint 2 plan + Hub Casual Games

**Qué se hizo**:
- Auditoría completa del Sprint 1 de Cursor (arriba).
- Creado `docs/HUB_CASUALGAMES.md` con propuesta arquitectónica del hub + 10 juegos MVP rockstar + sprints hub.
- Reescrito `docs/PLAN.md` con sprints paralelos (Claude y Cursor trabajan al mismo tiempo, no en serie).

**Qué NO se hizo** (pendiente Sprint 2 que arranca cuando Barbara confirme):
- [ ] `supabase link --project-ref ahsullbcdrekmribkcbm`
- [ ] Aplicar 4 migraciones SQL
- [ ] Desplegar 8 Edge Functions
- [ ] Curl de verificación de cada contrato (8 EFs)
- [ ] Configurar auth providers (Google OAuth + email) en Supabase dashboard si no están ya
- [ ] Crear pg_cron job para `sudoku-daily-cron` (00:00 UTC)
- [ ] Pre-cargar 500 puzzles iniciales (100 por dificultad) vía script seed

**Dependencia de Barbara**: acceso/confirmación para que yo ejecute contra proyecto Supabase `ahsullbcdrekmribkcbm` (ya tengo contexto de chess, pero necesito green light).

**Qué NO hace Claude Code en Sprint 2** (de cursor):
- No tocar `src/components/**`, `src/pages/**`, `src/hooks/**`. Son de Cursor.
- Sí ajustar `src/lib/sudokuService.ts` si los contratos de EF cambian durante deploy (improbable).

**Próximo owner**: Barbara (green-light verbal) → Claude Code (Sprint 2 Supabase) + Cursor (Sprint 1 pulido QA + empezar hub en repo aparte).

---

<!-- Próximas entradas abajo. Formato: ## YYYY-MM-DD — <agent> — <title> -->

