# QA en producción — Championship Sudoku

**URL:** https://championshipsudoku.vercel.app  

Fuente: `CLAUDE.md` (15 ítems obligatorios). Completar **manualmente** en navegador tras cada deploy relevante.

| # | Ítem | Código / notas | Manual (✓/✗) | Si falla → owner |
|---|------|----------------|----------------|------------------|
| 1 | Sin errores en consola al cargar | — | | Cursor (front) / assets |
| 2 | Tablero 9×9 visible | — | | Cursor |
| 3 | Click en celda + highlight | `SudokuCell` focus-visible | | Cursor |
| 4 | NumPad inserta números | — | | Cursor |
| 5 | Errores en rojo | — | | Cursor |
| 6 | Undo | — | | Cursor |
| 7 | Notes toggle | — | | Cursor |
| 8 | Hint llama `sudoku-hint` (Network) | EF + CORS | | Claude si CORS/EF |
| 9 | Overlay de victoria al completar | — | | Cursor |
| 10 | XP (logueado) / local si no | `submitFeedback` + perfil | | Claude si RLS/EF |
| 11 | `/daily` puzzle del día (UTC) | `useTodayDailyChallenge` UTC | | Claude si cron/datos |
| 12 | Leaderboard: tabla o vacío con copy | Vacío OK: “Sé el primero…” | | Claude si EF |
| 13 | Login email + Google sin CORS | Supabase redirect URLs | | Barbara + Claude OAuth |
| 14 | PWA install en móvil | — | | Cursor / manifest |
| 15 | Sin `console.log` ni secrets en bundle | `grep`/build | | Cursor |

**Nada se considera “cerrado” hasta que los 15 estén ✓ en la URL live del momento.**
