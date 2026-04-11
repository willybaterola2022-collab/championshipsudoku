# Championship Sudoku — Arquitectura

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | React 18.3 | Misma que chess, ecosistema maduro |
| Lenguaje | TypeScript 5.8 | Type safety en pipeline crítico |
| Bundler | Vite 5.4 | Fast HMR, mismo que chess |
| Estilos | Tailwind 3.4 | Atomic CSS, design tokens vía CSS vars |
| UI primitives | shadcn/ui (Radix) | Accesibilidad out-of-the-box |
| Routing | React Router 6.30 | SPA navigation |
| Data | TanStack Query 5.83 | Server state cache, auto retry |
| Icons | Lucide | NO emojis en UI, SVG vector |
| Toasts | Sonner | UX consistente con chess |
| Backend client | supabase-js 2.100+ | Auth, DB, Edge Functions |
| Animaciones | Framer Motion | Solo donde aporta (GameResult overlay) |
| PWA | vite-plugin-pwa | Offline-first, install prompt |
| Tests | Vitest | Rápido, mismo que chess |
| Deploy | Vercel | Auto-deploy en push a main |

## Decisiones clave

### D1. Supabase compartido con Chess (`ahsullbcdrekmribkcbm`)

**Opciones consideradas**:
- A) Mismo proyecto chess ✅ elegido
- B) Proyecto Lovable existente (`brccicluqoqjyregygwt`)
- C) Proyecto nuevo limpio

**Razones A**:
- Un usuario = un perfil = un XP compartido → cross-play natural
- Auth Google + email ya configurado
- Secrets ya configurados (ANTHROPIC_API_KEY, GEMINI_API_KEY, INTERNAL_SECRET)
- Cero coste operativo adicional
- Infraestructura de rate limiting, health checks, `_shared` ya existente

**Mitigación de riesgos**:
- Todas las tablas nuevas con prefijo `sudoku_`
- Extensiones a `profiles` con columnas prefijadas `sudoku_*`
- Todas las EFs con prefijo `sudoku-`
- Actualización quirúrgica del trigger `protect_profile_critical_fields()` para permitir service_role en columnas sudoku

### D2. Reimplementación desde spec, no migración desde Lovable

**Razones**:
- Elimina completamente dependencia de Lovable AI Gateway
- Git history limpio desde día 0
- Patrones consistentes con chess (mismo estilo, misma estructura)
- La spec en `SUDOKU_PROJECT_DOCUMENTATION.md` es completa (types, generator backtracking, validator, killer, hooks)

### D3. Offline-first con sync al login

**Flujo**:
```
Primera visita → localStorage, sin backend, cero fricción
  ↓
Juega, gana XP local, desbloquea achievements locales
  ↓
Click "Guardar progreso" o "Ver leaderboard" → prompt login
  ↓
Google OAuth / email
  ↓
Auto-sync one-time: localStorage → Supabase
  ↓
Desde ahora: Supabase primary + localStorage como caché
```

**Por qué**: máxima conversión. Usuario prueba el juego sin ninguna barrera, y solo hace login cuando hay valor (guardar progreso, competir en ranking).

### D4. Stack idéntico a Chess (no experimentos)

No es momento de probar Next.js, Remix, Svelte, Deno edge runtime, etc. Usamos lo que ya sabemos que funciona en chess. **Second game = efficiency, no learning curve.**

### D5. Frontend: v0.dev para diseño, Cursor para integración

**Roles**:
- v0.dev genera componentes aislados (bloques de UI) con React + Tailwind + shadcn
- Cursor importa esos bloques, los conecta con hooks y servicios, los integra en páginas
- Claude Code no toca frontend salvo `sudokuService.ts`, `AuthContext.tsx`, y el cliente Supabase

**Por qué**: v0 es más rápido para iterar diseño visual que describir componentes por texto. Cursor es mejor para refactor y conexión de lógica existente.

### D6. Pipeline de pipeline de submit idéntico al de chess

```
sudokuService.submitPuzzleResult()
  → auth check at top (if no JWT, save to localStorage)
  → invoke sudoku-save-game (JWT, verifies solution server-side)
    → internally chains to sudoku-grant-xp (x-internal-secret)
      → INSERT xp_grants (idempotent via unique constraint)
      → UPDATE profiles
      → INSERT user_achievements if unlocked
  → return { session_id, xp_gained, achievements_unlocked, new_level }
```

**Por qué**: patrón probado en chess. Idempotencia previene doble XP en retries. Internal secret previene grant-xp desde cliente. Auth al top previene llamadas fallidas cuando el usuario está logged out.

### D7. EFs proporcionales (8, no 43)

| EF | Justificación |
|---|---|
| sudoku-save-game | Pipeline crítico |
| sudoku-validate-game | Stateless, útil para hint coach |
| sudoku-grant-xp | Idempotencia XP |
| sudoku-hint | AI coach (Anthropic directo) |
| sudoku-daily-cron | Puzzle del día |
| sudoku-daily-submit | Submit diario + ranking |
| sudoku-leaderboard | Read público |
| sudoku-health-check | CI + monitoring |

**Fuera de alcance**: coach-narrator, training-planner, PvP, agents autónomos, newspaper, CEO reports, Stripe, push, retention emails. Todo eso se agrega si hay tracción real.

### D8. Crons mínimos (2, no 22)

| Cron | Schedule | EF |
|---|---|---|
| daily puzzle | 00:00 UTC | sudoku-daily-cron |
| health check | every 6h | sudoku-health-check |

Nada más. Proporcional.

### D9. Zone ownership estricto

Ver `CLAUDE.md` sección "Zone ownership". Regla de oro: si no es tuya, no la tocas sin anotarlo en `docs/COORDINATION.md` primero.

### D10. Quality gates desde día 0

- `scripts/pre-push.sh` → bloquea si typecheck, build, o ef-validator fallan
- `.github/workflows/ci.yml` → mismo en CI
- No hay "arreglamos la calidad después" → se empieza con gates activos

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Vercel)                       │
│  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌─────────────┐  │
│  │  Pages   │→ │Components │→ │  Hooks  │→ │  lib/sudoku │  │
│  │          │  │           │  │         │  │  (pure)     │  │
│  └──────────┘  └───────────┘  └────┬────┘  └─────────────┘  │
│                                     │                         │
│  ┌────────────┐  ┌──────────────────┴────┐                   │
│  │AuthContext │  │   sudokuService       │                   │
│  └─────┬──────┘  └──────────┬────────────┘                   │
│        │                    │                                │
└────────┼────────────────────┼────────────────────────────────┘
         │                    │
         │    Supabase JS     │
         ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (ahsullbcdrekmribkcbm)                 │
│  ┌─────────────┐   ┌──────────────────────────────────────┐ │
│  │    Auth     │   │       Edge Functions (Deno)          │ │
│  │Google+Email │   │  ┌──────────────┐  ┌──────────────┐  │ │
│  └─────────────┘   │  │ save-game    │→ │ grant-xp     │  │ │
│                    │  │ validate     │  │ (internal)   │  │ │
│                    │  │ hint         │  └──────────────┘  │ │
│                    │  │ daily-cron   │                     │ │
│                    │  │ daily-submit │                     │ │
│                    │  │ leaderboard  │                     │ │
│                    │  │ health-check │                     │ │
│                    │  └──────┬───────┘                     │ │
│                    │         │ _shared/                    │ │
│                    │         ↓                              │ │
│                    │    cors + llm + rateLimit              │ │
│                    └──────────┬───────────────────────────┘ │
│                               │                               │
│  ┌────────────────────────────┴─────────────────────────┐  │
│  │                   PostgreSQL (RLS)                    │  │
│  │  profiles │ sudoku_puzzles │ sudoku_game_sessions   │  │
│  │  xp_grants │ sudoku_daily_challenges │ completions  │  │
│  │  achievements │ user_achievements                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                               ↑
                    pg_cron (2 jobs)
                    daily puzzle + health
```
