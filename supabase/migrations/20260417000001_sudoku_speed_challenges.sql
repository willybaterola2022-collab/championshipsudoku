-- Championship Sudoku — Migration 005
-- Speed Challenge mode: timed sprints with shareable challenge codes.
-- Addresses audit finding: sudoku-speed-submit EF exists but table was missing → 404.

CREATE TABLE IF NOT EXISTS public.sudoku_speed_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_code TEXT NOT NULL UNIQUE,
  puzzle_id UUID NOT NULL REFERENCES public.sudoku_puzzles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_time_ms INTEGER,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sudoku_speed_code
  ON public.sudoku_speed_challenges(challenge_code);
CREATE INDEX IF NOT EXISTS idx_sudoku_speed_active
  ON public.sudoku_speed_challenges(expires_at) WHERE expires_at > now();

ALTER TABLE public.sudoku_speed_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Speed challenges readable by anyone" ON public.sudoku_speed_challenges;
CREATE POLICY "Speed challenges readable by anyone"
  ON public.sudoku_speed_challenges FOR SELECT USING (expires_at > now());

DROP POLICY IF EXISTS "Authenticated users can create speed challenges" ON public.sudoku_speed_challenges;
CREATE POLICY "Authenticated users can create speed challenges"
  ON public.sudoku_speed_challenges FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.sudoku_speed_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.sudoku_speed_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_ms INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  solved BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sudoku_speed_attempts_rank
  ON public.sudoku_speed_attempts(challenge_id, time_ms ASC, errors ASC)
  WHERE solved = true;
CREATE INDEX IF NOT EXISTS idx_sudoku_speed_attempts_user
  ON public.sudoku_speed_attempts(user_id);

ALTER TABLE public.sudoku_speed_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Speed attempts leaderboard public" ON public.sudoku_speed_attempts;
CREATE POLICY "Speed attempts leaderboard public"
  ON public.sudoku_speed_attempts FOR SELECT USING (true);
-- No INSERT policy — writes happen via sudoku-speed-submit EF with service_role

-- RPC: ranked attempts for a challenge
CREATE OR REPLACE FUNCTION public.get_sudoku_speed_leaderboard(p_challenge_code TEXT, p_limit INT DEFAULT 20)
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
    ROW_NUMBER() OVER (ORDER BY a.time_ms ASC, a.errors ASC, a.completed_at ASC) AS rank,
    a.user_id,
    COALESCE(p.display_name, p.username, 'Anónimo') AS display_name,
    a.time_ms,
    a.errors,
    a.completed_at
  FROM public.sudoku_speed_attempts a
  JOIN public.sudoku_speed_challenges c ON c.id = a.challenge_id
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  WHERE c.challenge_code = p_challenge_code AND a.solved = true
  ORDER BY a.time_ms ASC, a.errors ASC, a.completed_at ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_sudoku_speed_leaderboard(TEXT, INT) TO anon, authenticated, service_role;

-- RPC: generate unique 8-char code for new challenge
CREATE OR REPLACE FUNCTION public.generate_speed_challenge_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  code TEXT;
  exists_count INT;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT COUNT(*) INTO exists_count FROM public.sudoku_speed_challenges WHERE challenge_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_speed_challenge_code() TO authenticated, service_role;
