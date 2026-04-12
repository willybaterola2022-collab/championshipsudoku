# Championship Sudoku

Sudoku clásico y Killer con pistas de IA, puzzle diario, XP, rachas y leaderboard. Parte del ecosistema SKYNET P004 — Casual Games.

- **Stack**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Supabase (compartido con Championship Chess, ref `ahsullbcdrekmribkcbm`)
- **Deploy**: Vercel (auto en push a `main`)
- **Live**: [championshipsudoku.vercel.app](https://championshipsudoku.vercel.app)
- **Repo**: [willybaterola2022-collab/championshipsudoku](https://github.com/willybaterola2022-collab/championshipsudoku)

## Quick start

```bash
npm install
cp .env.example .env.local   # editar con valores reales
npm run dev
```

## Fuente de verdad

**Antes de tocar cualquier cosa, leé en este orden:**

1. [`CLAUDE.md`](./CLAUDE.md) — Reglas para Claude Code (backend, infra)
2. [`docs/MASTER_PROMPT_CURSOR.md`](./docs/MASTER_PROMPT_CURSOR.md) — Master prompt y contrato con Cursor (frontend)
3. [`docs/PLAN.md`](./docs/PLAN.md) — Plan de sprints y fases
4. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Decisiones arquitectónicas
5. [`docs/ENDPOINTS.md`](./docs/ENDPOINTS.md) — Contratos de las 8 Edge Functions
6. [`docs/SCHEMA.md`](./docs/SCHEMA.md) — Tablas, RLS, triggers
7. [`docs/HANDOFF_V0.md`](./docs/HANDOFF_V0.md) — Guía para diseñar componentes con v0.dev
8. [`docs/COORDINATION.md`](./docs/COORDINATION.md) — Log append-only de cambios entre agentes

## Zone ownership (crítico, no pisarse)

| Zona | Owner | Archivos |
|---|---|---|
| Backend / EFs / migraciones | Claude Code | `supabase/**`, `scripts/**`, `CLAUDE.md` |
| Frontend / páginas / componentes | Cursor | `src/pages/**`, `src/components/**`, `src/hooks/**` |
| Lógica del juego | Compartido (coordinar) | `src/lib/sudoku/**` |
| Servicio pipeline | Claude Code | `src/lib/sudokuService.ts` |
| Diseño/UI | v0.dev → Cursor | componentes sueltos importados |

## Regla de oro

**Nada se considera hecho hasta que esté verificado en live.** Compilar ≠ funciona. Ver [`CLAUDE.md`](./CLAUDE.md) sección "QA Checklist".
