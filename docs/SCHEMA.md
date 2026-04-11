# Championship Sudoku — Database Schema

> **Proyecto Supabase**: `ahsullbcdrekmribkcbm` (compartido con Championship Chess)
> **Estrategia de coexistencia**: prefijo `sudoku_` en todas las tablas nuevas. Extensión de `profiles` con columnas `sudoku_*`. Reuso de `achievements`, `user_achievements`, `xp_grants` existentes.

## Migraciones (4 archivos)

Aplicar en este orden:

1. `001_sudoku_profiles_extension.sql`
2. `002_sudoku_core_tables.sql`
3. `003_sudoku_daily_tables.sql`
4. `004_sudoku_achievements_seed.sql`

## 1. Extensión de `profiles`

```sql
-- 001_sudoku_profiles_extension.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sudoku_rating INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS sudoku_games_played INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_puzzles_solved INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_best_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_last_played_date DATE,
  ADD COLUMN IF NOT EXISTS sudoku_best_times JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Extender el trigger existente `protect_profile_critical_fields()` para proteger columnas sudoku
-- Requiere recrear la función. Se hace server-side, sin romper chess.
CREATE OR REPLACE FUNCTION public.protect_profile_critical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
     OR current_setting('role', true) IN ('postgres', 'authenticator', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Chess-protected fields (original)
  IF NEW.elo_rating IS DISTINCT FROM OLD.elo_rating OR
     NEW.xp IS DISTINCT FROM OLD.xp OR
     NEW.level IS DISTINCT FROM OLD.level OR
     NEW.games_played IS DISTINCT FROM OLD.games_played OR
     NEW.current_streak IS DISTINCT FROM OLD.current_streak OR
     NEW.best_streak IS DISTINCT FROM OLD.best_streak THEN
    RAISE EXCEPTION 'Cannot update critical profile fields from client';
  END IF;

  -- Sudoku-protected fields (added)
  IF NEW.sudoku_rating IS DISTINCT FROM OLD.sudoku_rating OR
     NEW.sudoku_games_played IS DISTINCT FROM OLD.sudoku_games_played OR
     NEW.sudoku_puzzles_solved IS DISTINCT FROM OLD.sudoku_puzzles_solved OR
     NEW.sudoku_current_streak IS DISTINCT FROM OLD.sudoku_current_streak OR
     NEW.sudoku_best_streak IS DISTINCT FROM OLD.sudoku_best_streak THEN
    RAISE EXCEPTION 'Cannot update critical sudoku profile fields from client';
  END IF;

  RETURN NEW;
END;
$$;
```

## 2. Tablas core de Sudoku

```sql
-- 002_sudoku_core_tables.sql

-- 2.1 Puzzles pre-generados (y los creados al vuelo si así lo elegimos)
CREATE TABLE IF NOT EXISTS public.sudoku_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle TEXT NOT NULL,               -- JSON-serialized 9x9 board
  solution TEXT NOT NULL,             -- JSON-serialized 9x9 solution
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert','fiendish')),
  variant TEXT NOT NULL DEFAULT 'classic' CHECK (variant IN ('classic','killer')),
  cages JSONB,                         -- NULL salvo variant=killer
  rating INTEGER NOT NULL DEFAULT 1000,
  times_played INTEGER NOT NULL DEFAULT 0,
  times_solved INTEGER NOT NULL DEFAULT 0,
  avg_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_difficulty ON public.sudoku_puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_variant ON public.sudoku_puzzles(variant);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_rating ON public.sudoku_puzzles(rating);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_created ON public.sudoku_puzzles(created_at DESC);

ALTER TABLE public.sudoku_puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sudoku puzzles viewable by everyone"
  ON public.sudoku_puzzles FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE solo service_role (no policy = denegado para anon/authenticated)

-- 2.2 Sesiones de juego (partidas completadas)
CREATE TABLE IF NOT EXISTS public.sudoku_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES public.sudoku_puzzles(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'classic',
  time_ms INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  perfect BOOLEAN NOT NULL DEFAULT false,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  board_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_user ON public.sudoku_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_user_date ON public.sudoku_game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_difficulty ON public.sudoku_game_sessions(difficulty);

ALTER TABLE public.sudoku_game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sudoku sessions"
  ON public.sudoku_game_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT solo service_role (ningún policy = denegado)
```

## 3. Daily challenges + leaderboard

```sql
-- 003_sudoku_daily_tables.sql

-- 3.1 Puzzle del día (un registro por fecha)
CREATE TABLE IF NOT EXISTS public.sudoku_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES public.sudoku_puzzles(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  bonus_xp INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_daily_date ON public.sudoku_daily_challenges(challenge_date DESC);

ALTER TABLE public.sudoku_daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges viewable by everyone"
  ON public.sudoku_daily_challenges FOR SELECT USING (true);

-- 3.2 Completions diarias (un registro por usuario por día)
CREATE TABLE IF NOT EXISTS public.sudoku_daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.sudoku_daily_challenges(id) ON DELETE CASCADE,
  time_ms INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  solved BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_sudoku_daily_comp_challenge_time
  ON public.sudoku_daily_completions(challenge_id, time_ms ASC);
CREATE INDEX IF NOT EXISTS idx_sudoku_daily_comp_user
  ON public.sudoku_daily_completions(user_id);

ALTER TABLE public.sudoku_daily_completions ENABLE ROW LEVEL SECURITY;

-- Leaderboard es público (cualquiera puede ver el ranking)
CREATE POLICY "Daily completions leaderboard public"
  ON public.sudoku_daily_completions FOR SELECT USING (true);

-- INSERT solo service_role

-- 3.3 RPC para leaderboard diario optimizado
CREATE OR REPLACE FUNCTION public.get_sudoku_daily_leaderboard(p_limit INT DEFAULT 20)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  time_ms INTEGER,
  errors INTEGER,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.time_ms ASC, c.errors ASC, c.completed_at ASC) AS rank,
    c.user_id,
    COALESCE(p.display_name, p.username, 'Anonymous') AS display_name,
    c.time_ms,
    c.errors,
    c.completed_at
  FROM sudoku_daily_completions c
  JOIN sudoku_daily_challenges d ON c.challenge_id = d.id
  LEFT JOIN profiles p ON p.user_id = c.user_id
  WHERE d.challenge_date = CURRENT_DATE AND c.solved = true
  ORDER BY c.time_ms ASC, c.errors ASC, c.completed_at ASC
  LIMIT p_limit;
$$;
```

## 4. Achievements seed

Asume que la tabla `achievements` ya existe (creada por chess). Si no tiene la columna `category`, la agregamos.

```sql
-- 004_sudoku_achievements_seed.sql

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'chess';

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

INSERT INTO public.achievements (key, title, description, xp_reward, condition_type, category) VALUES
  ('sudoku_first_puzzle',    'Primer Paso',     'Completa tu primer sudoku',                20, 'sudoku_puzzles_1',   'sudoku'),
  ('sudoku_streak_3',        'En Racha',        'Racha de 3 días seguidos',                 30, 'sudoku_streak_3',    'sudoku'),
  ('sudoku_streak_7',        'Imparable',       'Racha de 7 días seguidos',                 50, 'sudoku_streak_7',    'sudoku'),
  ('sudoku_perfect',         'Perfeccionista',  'Completa un sudoku sin errores',           30, 'sudoku_perfect',     'sudoku'),
  ('sudoku_speed',           'Rayo',            'Completa un sudoku fácil en menos de 5 min', 40, 'sudoku_speed_easy',  'sudoku'),
  ('sudoku_10_puzzles',      'Dedicado',        'Completa 10 sudokus',                      50, 'sudoku_puzzles_10',  'sudoku'),
  ('sudoku_50_puzzles',      'Veterano',        'Completa 50 sudokus',                     100, 'sudoku_puzzles_50',  'sudoku'),
  ('sudoku_hard',            'Sin Miedo',       'Completa un sudoku difícil',               60, 'sudoku_hard_any',    'sudoku'),
  ('sudoku_expert',          'Élite',           'Completa un sudoku experto',               80, 'sudoku_expert_any',  'sudoku'),
  ('sudoku_killer',          'Asesino',         'Completa un sudoku Killer',                80, 'sudoku_killer_any',  'sudoku')
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;
```

## Reuso de tablas existentes

| Tabla | Uso en sudoku |
|---|---|
| `profiles` | Extendida con columnas `sudoku_*` (migración 001) |
| `xp_grants` | `action_type = 'sudoku_puzzle_solved'`, `ref_id = session_id`, unique constraint garantiza idempotencia |
| `achievements` | Columna `category='sudoku'` agregada, 10 logros insertados como seed |
| `user_achievements` | Sin cambios, genérica (user_id, achievement_id) |
| `edge_function_calls` | Rate limiting compartido (patrón `_shared/rateLimit.ts`) |
| `ai_usage_log` | Tracking de llamadas LLM del `sudoku-hint` |

## Consideraciones de RLS

- **Public SELECT**: `sudoku_puzzles`, `sudoku_daily_challenges`, `sudoku_daily_completions` (leaderboard), `achievements`
- **Owner SELECT**: `sudoku_game_sessions` (solo propias)
- **Service role only INSERT/UPDATE/DELETE**: todas las tablas anteriores (el cliente nunca escribe directo)
- **Trigger protection**: columnas `sudoku_*` de `profiles` protegidas igual que las de chess

## Migración: cómo aplicar

```bash
# Desde championshipsudoku/ con supabase CLI linkeado al proyecto
supabase link --project-ref ahsullbcdrekmribkcbm
supabase db push
# O manualmente migración por migración:
supabase db execute --file supabase/migrations/001_sudoku_profiles_extension.sql
```

Si `supabase db push` falla por dependencias: ejecutar SQL directo vía service_role key + REST API, luego `supabase migration repair --status applied <timestamp> --linked` (patrón chess).
