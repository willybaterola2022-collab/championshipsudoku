# Handoff sprints — Championship Sudoku (frontend) → Claude Code (backend / ops)

Documento de sincronización: qué quedó hecho en el cliente, qué sigue en servidor, variables de entorno y verificación.

## Última actualización (2026-04-12)

### Frontend entregado en lote

| Área | Cambio |
|------|--------|
| **UTM** | `src/lib/utm.ts` — `withAppUtm()` para enlaces Hub (`VITE_HUB_URL`) y Chess (`VITE_CHESS_APP_URL`). Tests en `src/lib/utm.test.ts`. |
| **Navbar** | Enlace opcional **Hub** + Ajedrez con UTM `utm_source=championshipsudoku&utm_medium=nav&utm_campaign=casual_games`. |
| **GameResult** | Modal con `@radix-ui/react-dialog` (focus trap, título/descripción accesibles). `footerExtra` para CTA extra (Daily → ranking). |
| **Daily** | `id="daily-leaderboard"` + `scroll-mt-24`; modal de victoria con enlace “Ver ranking de hoy”. |
| **Dificultad** | `DIFFICULTY_CONFIG.hint` por nivel; `title` en `<select>` y opciones. |
| **Resiliencia** | `ErrorBoundary` en `main.tsx`; `OfflineBanner` en `App.tsx`. |
| **Onboarding** | `FirstVisitHelp` en Landing (localStorage `sudoku-first-visit-help-v1`). |
| **Perfil** | Logros: `title` + `sr-only` con etiquetas legibles (`ACHIEVEMENT_LABELS`). |
| **Killer** | Texto de ayuda ampliado (reglas de jaulas / sin pistas IA). |
| **NumPad** | `aria-label` por dígito + `min-h/w` 44px. |
| **Login sync** | Tras `syncPending` con partidas sincronizadas → `refreshProfile()`. |
| **Motion** | `prefers-reduced-motion`: desactiva animaciones custom del tablero/modal. |

### Variables Vercel / `.env`

- `VITE_HUB_URL` — URL del portal Casual Games (muestra enlace “Hub”). Opcional.
- `VITE_CHESS_APP_URL` — ya documentado; ahora se envuelve con UTM.
- Supabase: sin cambio de contrato en este lote.

### Pendiente explícito — Claude Code / infra

1. **OAuth Google / redirects** en Supabase (URLs producción + preview).
2. **Edge `sudoku-daily-cron`** — si sigue 403, revisar secret/header y despliegue.
3. **Seed puzzles** (500+) y consistencia con generador del cliente.
4. **Rate limit** en funciones de waitlist / hints si aplica.
5. **`submitPuzzleResult` await** — el front ya llama; validar que XP/logros del servidor lleguen al perfil (coord con `refreshProfile` tras sync).
6. **E2E / Playwright** — no incluido en este lote; valorar CI cuando haya tiempo estable.

### QA manual

Seguir `docs/QA_LIVE_CHECKLIST.md` (Barbara). Tras deploy, comprobar Hub + Chess con UTM en analytics internos si existen.

### Zona de no invasión

No se modificó `sudokuService` core, `lib/sudoku/**` generador, ni Edge Functions en este batch.
