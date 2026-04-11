# Championship Sudoku — Context for Claude Code

> **If you are Cursor**, stop here and open `docs/MASTER_PROMPT_CURSOR.md`.
> **If you are Claude Code**, this is your source of truth.

## Project

- **Name**: Championship Sudoku
- **Part of**: SKYNET P004 — Casual Games (sister project of Championship Chess)
- **Supabase project**: `ahsullbcdrekmribkcbm` (SHARED with Championship Chess)
- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno) + PostgreSQL with RLS
- **Live URL**: `https://championshipsudoku.vercel.app` (to be created)
- **Repo**: `github.com/willybaterola2022-collab/championshipsudoku` (to be created)

## Non-negotiable rules (SKYNET global + project-specific)

These rules come from hard lessons learned in Championship Chess. Read before writing any code.

1. **NEVER say "it works" without an E2E live test in production at that exact moment.** Not "it compiles", not "local dev runs", not "tests pass" — LIVE production test. (`feedback_live_test_mandatory`)
2. **NEVER commit `.env` or secrets.** `.gitignore` is in place from day 0. Use `.env.example` as template. For Vercel, set env vars via CLI, not dashboard (dashboard truncates JWTs). (`feedback_env_gitignore`, `feedback_vercel_env_key`)
3. **APIs with fallback always.** LLM calls go through `_shared/llm.ts`: Anthropic → Gemini → template. Never hit a single provider with no fallback. (`feedback_api_fallback_mandatory`)
4. **Never blame another agent without verifying root cause.** If something looks wrong, read the code, run the curl, check the logs — then decide. (`feedback_never_blame_without_proof`)
5. **Deployed ≠ connected.** An Edge Function that exists but is not called by the frontend is dead code. Every new EF must be wired and verified live. (`feedback_pipeline_gap`)
6. **No false conclusions.** Don't report something as broken without reading the actual code. (`feedback_no_false_conclusions`)
7. **Backend OK ≠ product OK.** Test the canonical user-facing URL after every deploy. (`feedback_verify_user_facing`)
8. **`profiles.user_id` is the FK to `auth.users`, NOT `profiles.id`.** Always `.eq('user_id', user.id)`.
9. **Column naming**: `sudoku_puzzles.solution` (NOT `moves`), `xp_grants.xp_granted` (NOT `xp_amount`), `sudoku_daily_challenges.challenge_date` (NOT `date`).
10. **All XP flows through `sudoku-grant-xp` EF with idempotency via `xp_grants` unique constraint.** Never update `profiles.xp` directly from client.
11. **Spanish language for all user-facing copy.** Playfair Display + Inter.
12. **Commit prefixes**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. Co-author line: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
13. **Pre-push hook mandatory** — bloquea si typecheck, build o ef-validator fallan.
14. **Deploy proactivo**: commit → push → verify Vercel deploy → curl healthcheck → report.
15. **Ser CONCRETO y directo** — no dar 4 opciones cuando solo hay que hacer 1.

## Zone ownership — DO NOT CROSS LINES

### Claude Code owns
- `supabase/functions/**` — all edge functions
- `supabase/migrations/**` — all SQL migrations
- `supabase/config.toml` — function config
- `src/lib/sudokuService.ts` — game submission pipeline
- `src/integrations/supabase/client.ts` — Supabase client
- `src/contexts/AuthContext.tsx` — auth layer
- `scripts/**` — quality gates
- `.github/workflows/**` — CI
- `CLAUDE.md`, `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/ENDPOINTS.md`, `docs/SCHEMA.md`

### Cursor owns
- `src/pages/**` — all page components
- `src/components/**` — all UI components (except shared shadcn primitives Claude sets up)
- `src/hooks/**` — React hooks (useSudokuGame, useKillerSudokuGame, usePlayerProgress)
- `src/App.tsx`, `src/main.tsx` after initial scaffold

### Shared (coordinate via `docs/COORDINATION.md`)
- `src/lib/sudoku/**` — pure game logic (types, generator, validator, killer-generator)
- `src/index.css` — design tokens
- `tailwind.config.ts` — design system
- `package.json` — dependencies

## Architecture

### Game Result Pipeline (post-puzzle)
```
Client (sudokuService.ts)
  1. submitPuzzleResult()
     ↓ auth check at the TOP (before any network calls)
  2. invoke sudoku-save-game (JWT)
     ↓ server-side verifies board_state === solution
     ↓ INSERT sudoku_game_sessions
     ↓ chains internally to:
        sudoku-grant-xp (x-internal-secret)
          → INSERT xp_grants (idempotent via unique(user_id, action_type, ref_id))
          → UPDATE profiles: xp, level, sudoku_puzzles_solved, streaks
          → INSERT user_achievements if unlocked
  3. Response: { session_id, xp_gained, achievements_unlocked[], new_level }
```

**Critical**:
- `sudoku-grant-xp` is INTERNAL ONLY — never called from client, only via `x-internal-secret` header
- Idempotency via `xp_grants.unique(user_id, action_type, ref_id)` — retries are safe
- Client auth check at the top means if user logged out, we save to localStorage instead

### Offline-first pattern
User plays without login → progress in localStorage → on login, one-time sync localStorage → Supabase.

## Edge Functions (8 total)

| Function | Auth | Rate | Purpose |
|---|---|---|---|
| sudoku-save-game | JWT | — | Verify solution + insert session + chain to grant-xp |
| sudoku-validate-game | JWT | — | Stateless solution verification (debug/AI hint) |
| sudoku-grant-xp | x-internal-secret | — | XP/stats/achievements, idempotent |
| sudoku-hint | JWT | 10/min | AI hint coach via `_shared/llm.ts` (Haiku primary) |
| sudoku-daily-cron | x-internal-secret | — | Daily puzzle selection at 00:00 UTC (idempotent) |
| sudoku-daily-submit | JWT | 30/hr | Submit daily puzzle + ranking |
| sudoku-leaderboard | none | 30/min | Public rankings read |
| sudoku-health-check | none | — | Multi-check endpoint for CI + monitoring |

All EFs use `_shared/cors.ts`, `_shared/llm.ts`, `_shared/rateLimit.ts` from chess patterns.

## Database (tables to create in Supabase)

All tables prefixed `sudoku_` to coexist with chess tables in the same project:

- `sudoku_puzzles` — pre-generated puzzles
- `sudoku_game_sessions` — user plays
- `sudoku_daily_challenges` — daily puzzle selection
- `sudoku_daily_completions` — leaderboard entries
- Extension of `profiles` with `sudoku_*` columns
- Extension of `achievements` with `category='sudoku'` seed rows
- Reuse `xp_grants` (existing) with `action_type='sudoku_puzzle_solved'`

See `docs/SCHEMA.md` for the full SQL.

## Secrets required (Supabase Edge Functions)

Most are already configured in chess project. Verify:

- `INTERNAL_SECRET` — inter-function auth (CONFIGURED)
- `ANTHROPIC_API_KEY` — for sudoku-hint (CONFIGURED)
- `GEMINI_API_KEY` — fallback LLM (CONFIGURED)

Nothing new to add. Sudoku reuses chess secrets.

## Design tokens (shared Championship brand)

- **Primary**: Gold `hsl(43 90% 55%)`
- **Background**: Dark `hsl(220 20% 4%)`
- **Dark mode only** — no light mode
- **Fonts**: Playfair Display (serif, headings) + Inter (sans, body)
- **Glass morphism**: `.glass`, `.glass-strong`
- **Mobile-first**: base 360px

## QA Checklist (post-deploy, mandatory — 15 items)

After every deploy to production, manually verify **in the live URL**:

1. [ ] Page loads without errors in console
2. [ ] Sudoku board renders correctly (9x9 grid visible)
3. [ ] Can click a cell and select it (highlight works)
4. [ ] NumPad inserts numbers correctly
5. [ ] Error detection highlights conflicts in red
6. [ ] Undo works
7. [ ] Notes toggle works
8. [ ] Hint button calls `sudoku-hint` successfully (check Network tab)
9. [ ] Completing a puzzle shows win overlay
10. [ ] XP is granted (check profile, requires auth)
11. [ ] Daily puzzle loads today's puzzle
12. [ ] Leaderboard shows at least one entry
13. [ ] Login (Google + email) works without CORS errors
14. [ ] PWA install prompt appears on mobile
15. [ ] No `console.log` or secrets leaked in bundle

**Nothing is "done" until all 15 pass in the live URL at that moment.** (`feedback_live_test_mandatory`, `feedback_skynet_qa_checklist`)

## What's in scope for this project

✅ Classic Sudoku (5 difficulties), Killer Sudoku, daily puzzle, leaderboard, XP shared with chess, AI hint coach, auth (Google + email), PWA offline, streaks, 10 achievements.

## What's NOT in scope (do not build, do not suggest)

❌ Story mode, 1v1 multiplayer, tournaments, weekly leagues, Battle Pass, Stripe/premium, Sentry, PostHog, push notifications, email campaigns, newspaper/content-evolution, agent orchestrator, CEO reports, 20+ crons.

**Proportional to 0 users — ver `feedback_skynet_resource_optimization`.**

## Decision log (append-only)

- **2026-04-12**: Decided same Supabase as chess (`ahsullbcdrekmribkcbm`). Reason: shared profiles/XP, cross-game identity, zero extra cost.
- **2026-04-12**: Decided reimplementation from spec instead of Lovable code import. Reason: eliminates Lovable dependency and AI Gateway, cleaner git history.
- **2026-04-12**: Decided v0.dev + Cursor for frontend design. Reason: Claude Code owns backend, Cursor owns frontend (chess ownership model).
