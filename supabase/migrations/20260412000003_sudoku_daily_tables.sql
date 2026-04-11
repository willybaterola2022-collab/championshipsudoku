-- Championship Sudoku — Migration 003
-- Daily challenges, completions, and RPC for leaderboard.

CREATE TABLE IF NOT EXISTS public.sudoku_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES public.sudoku_puzzles(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  bonus_xp INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_daily_date
  ON public.sudoku_daily_challenges(challenge_date DESC);

ALTER TABLE public.sudoku_daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily challenges viewable by everyone" ON public.sudoku_daily_challenges;
CREATE POLICY "Daily challenges viewable by everyone"
  ON public.sudoku_daily_challenges FOR SELECT USING (true);

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
  ON public.sudoku_daily_completions(challenge_id, time_ms ASC, errors ASC);
CREATE INDEX IF NOT EXISTS idx_sudoku_daily_comp_user
  ON public.sudoku_daily_completions(user_id);

ALTER TABLE public.sudoku_daily_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily completions leaderboard public" ON public.sudoku_daily_completions;
CREATE POLICY "Daily completions leaderboard public"
  ON public.sudoku_daily_completions FOR SELECT USING (true);
-- No INSERT policy — service_role only

-- RPC: optimized today's leaderboard
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.time_ms ASC, c.errors ASC, c.completed_at ASC) AS rank,
    c.user_id,
    COALESCE(p.display_name, p.username, 'Anónimo') AS display_name,
    c.time_ms,
    c.errors,
    c.completed_at
  FROM public.sudoku_daily_completions c
  JOIN public.sudoku_daily_challenges d ON c.challenge_id = d.id
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  WHERE d.challenge_date = CURRENT_DATE AND c.solved = true
  ORDER BY c.time_ms ASC, c.errors ASC, c.completed_at ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_sudoku_daily_leaderboard(INT) TO anon, authenticated, service_role;
