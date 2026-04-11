# Championship Sudoku — Plan de Ejecución (Sprints PARALELOS)

> Última actualización: 2026-04-12 (post-auditoría Sprint 1 Cursor)
> Estado: Sprint 0 + Sprint 1 Fase 1-3 cerrados. Pipeline ready-to-parallelize.

## Principio operativo

**Claude Code y Cursor no se bloquean entre sí.** Cada uno opera en su zona y se coordinan via `docs/COORDINATION.md`. Barbara es green-light humano, no cuello de botella técnico.

Los sprints se ejecutan **en paralelo**, no en serie. Solo hay dependencia dura en los puntos marcados con 🔒.

---

## Estado actual (2026-04-12)

### ✅ Sprint 0 — Foundation (Claude Code)
- Scaffold completo: config, docs, lógica pura, backend integration stubs
- 8 EFs escritas (código funcional, no stubs vacíos)
- 4 migraciones SQL listas
- Scripts quality gates + CI

### ✅ Sprint 1 Fase 1-3 — Frontend core (Cursor)
- 4 hooks (useSudokuGame, useKillerSudokuGame, usePlayerProgress, useSudokuKeyboard)
- 13 componentes sudoku + Navbar
- 3 páginas (Landing, Play, PlayKiller) con rutas en App.tsx
- 3 temas de tablero en index.css
- **2142 líneas de frontend nuevas**
- **Ninguna zona prohibida tocada**

### 🟡 Pendientes Sprint 1 Fase 4 (Barbara, local/manual)
- [ ] `npm install` local
- [ ] `.env.local` con valores reales Supabase
- [ ] `npm run dev` verde
- [ ] Git init + repo GitHub + primer push
- [ ] Vercel project + env vars via CLI (no dashboard por JWT truncation)
- [ ] Primer deploy verde

### 🟡 Pendientes Sprint 1 Fase 5 (QA)
- [ ] 15/15 items QA Checklist (`CLAUDE.md` sección QA) en **URL live**, no localhost

---

## Sprints en curso (desde 2026-04-12)

### Sprint 2 — Backend live (Claude Code) 🟢 LISTO PARA ARRANCAR

**Bloqueo**: 🔒 Barbara debe dar green-light para que Claude actúe contra Supabase `ahsullbcdrekmribkcbm`.

- [ ] `supabase link --project-ref ahsullbcdrekmribkcbm`
- [ ] Aplicar 4 migraciones con `supabase db push` (o SQL directo vía service_role si hay dependencias circulares)
- [ ] Desplegar las 8 Edge Functions: `supabase functions deploy sudoku-save-game` x8
- [ ] Verificar secrets en proyecto: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `INTERNAL_SECRET` (ya configurados por chess)
- [ ] Curl verificación de cada EF (8 requests) con contratos documentados en `docs/ENDPOINTS.md`
- [ ] Configurar pg_cron: `sudoku-daily-cron` a 00:00 UTC (requiere ya tener puzzles cargados)
- [ ] Health check verde: `curl .../sudoku-health-check` devuelve `{ ok: true, checks: { db: true, ... } }`
- [ ] Anotar todo en `docs/COORDINATION.md` con fecha + comandos + resultados

**Paralelizable con**: Sprint 3 de Cursor, Barbara pasos locales, Sprint H1 de hub.

**DoD Sprint 2**: las 8 EFs responden en producción al contrato documentado, health check OK, migraciones aplicadas sin romper chess.

### Sprint 3 — Auth + Supabase sync (Cursor + Claude) 🟡 PARCIAL AHORA, COMPLETO POST-SPRINT-2

**Bloqueo**: 🔒 depende de que Sprint 2 tenga las EFs live (sin ellas, `sudokuService.submitPuzzleResult` devuelve error y el usuario juega solo local).

**Cursor**:
- [ ] Agregar página `src/pages/Login.tsx` (Google + email)
- [ ] Agregar página `src/pages/Profile.tsx` (XP, logros, historial desde Supabase)
- [ ] Modificar `usePlayerProgress.ts` para **rama híbrida**:
  - Si `useAuth().user` → leer `profiles` + `user_achievements` + últimas `sudoku_game_sessions` de Supabase
  - Si no → comportamiento actual (localStorage)
- [ ] Llamar `sudokuService.syncPending()` al primer login exitoso (en `AuthContext` `onAuthStateChange` cuando cambia de null → user)
- [ ] Fix `useSudokuGame.ts:270` y `useKillerSudokuGame.ts` análogo: pasar respuesta del server al componente y mostrar XP real ganado (no solo el local)

**Claude Code**:
- [ ] Configurar auth providers en Supabase dashboard si Google OAuth no está habilitado
- [ ] Verificar que el trigger de auto-create profile de chess funciona para usuarios nuevos de sudoku
- [ ] Solo si Cursor pide cambio de contrato: ajustar `sudokuService.ts`

**Paralelizable con**: Sprint H1 (hub estático), Sprint 4 de Cursor (Daily page UI).

**DoD Sprint 3**: usuario loguea → ve su XP real de la BD → juega → completa → ve XP actualizado con el response del server → logout → localStorage sigue funcionando.

### Sprint 4 — Daily + Leaderboard + Polish (Cursor + Claude) 🟢 PUEDE ARRANCAR EN PARALELO CON SPRINT 3

**Cursor**:
- [ ] Página `src/pages/Daily.tsx`: puzzle del día + countdown + leaderboard top 20 + tu posición
- [ ] Hook `useDailyChallenge()` que llama `rpc('get_sudoku_daily')` o EF específica
- [ ] Componente `<Leaderboard>` reutilizable (será el mismo en Hub)
- [ ] Toast de achievement unlock con animación cuando backend devuelve `achievements_unlocked: [...]`

**Claude Code**:
- [ ] Script seed: generar 500 puzzles iniciales (100 por dificultad) y cargarlos con INSERT batch en `sudoku_puzzles`
- [ ] Verificar que `sudoku-daily-cron` ejecuta y crea el registro de hoy
- [ ] Verificar que `get_sudoku_daily_leaderboard` RPC devuelve resultados
- [ ] Opcional: cron `sudoku-health-check` cada 6h → alerta email si falla 2 veces seguidas

**Paralelizable con**: Sprint H1 + Sprint H2 (hub).

**DoD Sprint 4**: puzzle del día único para todos, ranking se puebla cuando alguien juega, Barbara logra entrar al top 10 jugando.

---

## Sprints Hub (en paralelo, empiezan cuando Sprint 1 Sudoku esté en URL live)

### Sprint H1 — Hub estático (Cursor, nuevo repo) 🟢 INDEPENDIENTE

**Puede arrancar en cuanto Sudoku tenga su URL live** (no depende de Sprint 2/3/4 de sudoku).

Ver `docs/HUB_CASUALGAMES.md` sección "Sprint H1".

- [ ] Nuevo repo `casualgames-hub` con mismo stack
- [ ] Home con 2 juegos live + 10 tiles coming soon
- [ ] 10 juegos MVP propuestos (ver HUB_CASUALGAMES.md) — Barbara confirma/ajusta la lista
- [ ] Waitlist CTA (stub en localStorage)
- [ ] Deploy en Vercel

**DoD H1**: URL pública del hub con grid de 12 juegos.

### Sprint H2 — Hub backend waitlist (Claude) 🟡 POST-H1

- [ ] Migración: tabla `hub_waitlist` en `ahsullbcdrekmribkcbm`
- [ ] EF `hub-waitlist-subscribe` con Zod + rate limit
- [ ] EF `hub-waitlist-count` público (social proof)
- [ ] Cursor reemplaza stub por EFs reales

**DoD H2**: emails reales se capturan y el contador es visible en el hub.

### Sprint H3 — Hub membresía preview (Cursor) 🟢 PARALELIZABLE

- [ ] Página `/membresia` con 3 tiers (Free / Plus / Founder anual)
- [ ] Status "Coming Soon"
- [ ] CTA → waitlist

**NO implementar Stripe**. Eso es Fase 6+.

---

## Roadmap siguiente juego post-sudoku

### Sprint W1 — Championship Wordle Sprint 0 (Claude + Cursor)

Arrancar **en cuanto Sudoku esté en producción estable con el pipeline funcionando end-to-end** (no antes).

Este sprint no está detallado todavía — se detallará cuando Sprint 4 de Sudoku cierre.

---

## Vista general: ¿quién hace qué ahora mismo?

| Agente | Qué hace ahora | Bloqueado por |
|---|---|---|
| **Barbara** | `npm install` + git + Vercel + green-light Supabase para Claude | Nadie |
| **Cursor** | QA Sprint 1 en local, fixes si algo no compila, empezar a planificar Sprint 3 UI | Nada; puede arrancar hub en paralelo cuando quiera |
| **Claude Code** | Esperar green-light Barbara → Sprint 2 Supabase (migraciones + deploy EFs + curl verificación) | 🔒 Green-light Barbara |

**Paralelismo máximo posible**:
- Barbara ejecuta local + GitHub + Vercel (10 min)
- Claude Code arranca Sprint 2 Supabase cuando Barbara dice "go"
- Cursor empieza Sprint H1 hub estático mientras tanto
- Todo converge en Sprint 3-4 cuando backend está live

---

## Métricas de éxito (sin cambios vs versión anterior)

| Sprint | Métrica | Target |
|---|---|---|
| 1 | Sitio jugable local | `npm run dev` verde + Landing con tablero clickeable |
| 1 | Sitio jugable live | URL Vercel + QA 15/15 |
| 2 | Backend live | 8 EFs respondiendo + health check verde |
| 3 | Pipeline E2E | Usuario auth → partida → XP real en perfil → logout |
| 4 | Primer usuario real | 1 entrada en `sudoku_daily_completions` de alguien que no seas vos |
| H1 | Hub live | URL pública con 12 juegos visibles |
| H2 | Waitlist funcional | 10 emails reales capturados |

## Riesgos activos (actualizado post-auditoría)

| Riesgo | Estado | Mitigación |
|---|---|---|
| Migraciones conflictan con chess | 🟡 Abierto | Aplicar una por una, validar con SELECT antes del siguiente step |
| Trigger `protect_profile` rompe updates sudoku | 🟢 Mitigado | Migración 001 recrea el trigger incluyendo campos sudoku_* |
| Cursor sin memoria entre sesiones | 🟢 Mitigado | `docs/HANDOFF_CURSOR.md` + `CLAUDE.md` como cinta; confirmado: Cursor los leyó y operó dentro de su zona |
| Doble pipeline XP (local + server) | 🟡 Abierto | Fix en Sprint 3: mostrar siempre el valor del server cuando auth, local solo cuando offline |
| Cursor pisa zona Claude | 🟢 No pasó | Cursor respetó zone ownership en 2142 líneas |
| Vercel env var JWT truncated | 🟢 Mitigado | `SETUP_BARBARA.md` insiste en CLI |
| Generador lento en móvil | 🟡 Abierto | Sprint 4 pre-generación server-side |
| Hub hace promesas que luego no cumplen | 🟢 Mitigado | Los 10 tiles son "Próximamente", sin fechas, sin números inventados |
