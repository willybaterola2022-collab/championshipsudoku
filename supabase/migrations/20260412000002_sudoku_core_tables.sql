-- Championship Sudoku — Migration 002
-- Core tables: sudoku_puzzles, sudoku_game_sessions.

CREATE TABLE IF NOT EXISTS public.sudoku_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle TEXT NOT NULL,
  solution TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert','fiendish')),
  variant TEXT NOT NULL DEFAULT 'classic' CHECK (variant IN ('classic','killer')),
  cages JSONB,
  rating INTEGER NOT NULL DEFAULT 1000,
  times_played INTEGER NOT NULL DEFAULT 0,
  times_solved INTEGER NOT NULL DEFAULT 0,
  avg_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_difficulty ON public.sudoku_puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_variant ON public.sudoku_puzzles(variant);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_rating ON public.sudoku_puzzles(rating);
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_diff_variant_tp
  ON public.sudoku_puzzles(difficulty, variant, times_played);

ALTER TABLE public.sudoku_puzzles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sudoku puzzles viewable by everyone" ON public.sudoku_puzzles;
CREATE POLICY "Sudoku puzzles viewable by everyone"
  ON public.sudoku_puzzles FOR SELECT USING (true);

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

CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_user
  ON public.sudoku_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_user_date
  ON public.sudoku_game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sudoku_sessions_difficulty
  ON public.sudoku_game_sessions(difficulty);

ALTER TABLE public.sudoku_game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sudoku sessions" ON public.sudoku_game_sessions;
CREATE POLICY "Users view own sudoku sessions"
  ON public.sudoku_game_sessions FOR SELECT
  USING (auth.uid() = user_id);
-- No INSERT policy — service_role only
