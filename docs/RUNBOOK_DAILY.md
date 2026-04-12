# Runbook: “el daily no carga”

1. **¿Es medianoche UTC ya?** El cliente usa `challenge_date` en UTC (`useTodayDailyChallenge`). Si el usuario está en UTC−, puede seguir viendo “ayer” hasta el cambio UTC.
2. **Supabase**: tabla `sudoku_daily_challenges` — ¿existe fila para `challenge_date = today (UTC)`?
3. **Cron**: job que inserta el daily (pg_cron / EF) — revisar logs en Supabase.
4. **RLS**: políticas de lectura anónima/autenticada sobre `sudoku_daily_challenges` y `sudoku_puzzles`.
5. **Red**: en DevTools → Network, ver si la query PostgREST devuelve 200 y cuerpo vacío vs error.

**Enlaces útiles**: `docs/ENDPOINTS.md`, `docs/COORDINATION.md` (última entrada Claude).
