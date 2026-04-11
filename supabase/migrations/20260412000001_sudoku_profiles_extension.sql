-- Championship Sudoku — Migration 001
-- Extend profiles with sudoku_* columns and update trigger to protect them.
-- Idempotent via IF NOT EXISTS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sudoku_rating INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS sudoku_games_played INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_puzzles_solved INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_best_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sudoku_last_played_date DATE,
  ADD COLUMN IF NOT EXISTS sudoku_best_times JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Recreate the existing trigger function to also protect sudoku_* columns.
-- Chess protections remain intact.
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

  -- Chess-protected fields (existing)
  IF NEW.elo_rating IS DISTINCT FROM OLD.elo_rating OR
     NEW.xp IS DISTINCT FROM OLD.xp OR
     NEW.level IS DISTINCT FROM OLD.level OR
     NEW.games_played IS DISTINCT FROM OLD.games_played OR
     NEW.current_streak IS DISTINCT FROM OLD.current_streak OR
     NEW.best_streak IS DISTINCT FROM OLD.best_streak THEN
    RAISE EXCEPTION 'Cannot update critical profile fields from client';
  END IF;

  -- Sudoku-protected fields (new)
  IF NEW.sudoku_rating IS DISTINCT FROM OLD.sudoku_rating OR
     NEW.sudoku_games_played IS DISTINCT FROM OLD.sudoku_games_played OR
     NEW.sudoku_puzzles_solved IS DISTINCT FROM OLD.sudoku_puzzles_solved OR
     NEW.sudoku_current_streak IS DISTINCT FROM OLD.sudoku_current_streak OR
     NEW.sudoku_best_streak IS DISTINCT FROM OLD.sudoku_best_streak OR
     NEW.sudoku_last_played_date IS DISTINCT FROM OLD.sudoku_last_played_date THEN
    RAISE EXCEPTION 'Cannot update critical sudoku profile fields from client';
  END IF;

  RETURN NEW;
END;
$$;
