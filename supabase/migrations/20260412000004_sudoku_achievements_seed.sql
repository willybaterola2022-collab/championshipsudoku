-- Championship Sudoku — Migration 004
-- Add `category` column to achievements (chess may not have it yet) + seed sudoku achievements.

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'chess';

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

INSERT INTO public.achievements (key, title, description, xp_reward, condition_type, category) VALUES
  ('sudoku_first_puzzle', 'Primer Paso',    'Completa tu primer sudoku',                 20, 'sudoku_puzzles_1',  'sudoku'),
  ('sudoku_streak_3',    'En Racha',        'Racha de 3 días seguidos',                  30, 'sudoku_streak_3',   'sudoku'),
  ('sudoku_streak_7',    'Imparable',       'Racha de 7 días seguidos',                  50, 'sudoku_streak_7',   'sudoku'),
  ('sudoku_perfect',     'Perfeccionista',  'Completa un sudoku sin errores',            30, 'sudoku_perfect',    'sudoku'),
  ('sudoku_speed',       'Rayo',            'Sudoku fácil en menos de 5 minutos',        40, 'sudoku_speed_easy', 'sudoku'),
  ('sudoku_10_puzzles',  'Dedicado',        'Completa 10 sudokus',                       50, 'sudoku_puzzles_10', 'sudoku'),
  ('sudoku_50_puzzles',  'Veterano',        'Completa 50 sudokus',                      100, 'sudoku_puzzles_50', 'sudoku'),
  ('sudoku_hard',        'Sin Miedo',       'Completa un sudoku difícil',                60, 'sudoku_hard_any',   'sudoku'),
  ('sudoku_expert',      'Élite',           'Completa un sudoku experto',                80, 'sudoku_expert_any', 'sudoku'),
  ('sudoku_killer',      'Asesino',         'Completa un sudoku Killer',                 80, 'sudoku_killer_any', 'sudoku')
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;
