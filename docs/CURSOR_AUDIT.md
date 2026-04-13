# CURSOR — AUDITORÍA VISUAL + UX + PERFORMANCE

> Claude Code ya ejecutó auditoría backend (E2E funcional, seguridad, datos, código).
> Resultado: 43/46 tests pasados. Informe completo en `docs/AUDIT_REPORT.md`.
> Ahora te toca a vos la parte que solo se puede hacer con browser + ojos humanos.

---

## PARTE 1 — QA VISUAL (15 ítems, en URL live)

Abrí `https://championshipsudoku.vercel.app` en Chrome con DevTools abierto (Console + Network).
Repetí en móvil (360px) o Chrome DevTools mobile simulation.

| # | Ítem | Cómo verificar | Si falla |
|---|---|---|---|
| 1 | Sin errores en consola al cargar `/` | Console tab, filtrar Errors | Fix JS error |
| 2 | Tablero 9x9 visible y centrado | Visual | Fix CSS |
| 3 | Click en celda → highlight dorado | Click una celda vacía | Fix SudokuCell |
| 4 | NumPad inserta número correcto | Click celda + click número | Fix NumPad/useSudokuGame |
| 5 | Error se pinta en rojo al poner número incorrecto | Poner número equivocado | Fix validator/SudokuCell |
| 6 | Undo revierte el último movimiento | Click Undo después de poner número | Fix useSudokuGame.undo |
| 7 | Notes toggle muestra candidatos en grid 3x3 | Click Notes + click número | Fix SudokuCell notes rendering |
| 8 | Hint coach: level 1 muestra banner zona | Click Hint en celda vacía | Fix HintCoachBanner / useSudokuGame |
| 9 | Completar puzzle muestra GameResult overlay | Completar un puzzle easy (o usar hints) | Fix GameResult |
| 10 | Share genera imagen y abre share/clipboard | Click "Compartir" en GameResult | Fix ShareImage / Web Share API |
| 11 | `/daily` muestra puzzle del día + día + dificultad | Navegar a /daily | Fix useTodayDailyChallenge |
| 12 | Leaderboard muestra tabla o "Sé el primero" | En /daily, ver debajo del tablero | Fix Leaderboard |
| 13 | Login email funciona | Ir a /login, crear cuenta con email test | Fix Login / Supabase auth |
| 14 | PWA install prompt en móvil | Abrir en Chrome Android/iOS | Fix manifest / sw.js |
| 15 | `/play?mode=zen` sin timer, sin errores, sin presión | Navegar con ?mode=zen | Fix Play.tsx zen mode |

**Formato de reporte**: por cada ítem, escribí en `docs/QA_RESULTS.md`:
```
| # | ✅/❌ | Nota |
```

---

## PARTE 2 — AUDITORÍA VISUAL POR RUTA (11 rutas)

Para cada ruta, verificar en desktop + mobile (360px):

| Ruta | Qué verificar |
|---|---|
| `/` | Hero con tablero jugable, featured puzzles section, weekly missions (si auth), streak, XP bar, variant tabs |
| `/play` | Tablero completo, difficulty selector con técnicas + bloqueo por nivel, theme selector, hint coach banner, auto-notes (Wand2), variant selector (classic/diagonal) |
| `/play/mini` | Tablero 6x6 con cajas 2x3, NumPad 1-6, funcional end-to-end |
| `/play/killer` | Cage overlay visible, sumas correctas, sin hints (por diseño) |
| `/play?mode=zen` | Sin timer, sin error counter, sin progress bar, hints ilimitados, sin XP al ganar |
| `/daily` | Día de la semana + dificultad + bonus XP, puzzle jugable, leaderboard debajo |
| `/speed` | Challenge activo con countdown, puzzle fijo, ranking post-completion |
| `/tutorial` | 10 lecciones listadas, click expande, celda target pulsa en dorado, hint on error, XP on complete |
| `/challenge/:code` | Carga puzzle, jugable como guest, muestra ranking de intentos, tiempo del creador |
| `/login` | Google OAuth + email/password, tabs Entrar/Crear cuenta, redirect a /profile |
| `/profile` | XP, nivel, rango, stats por dificultad, achievements grid, activity calendar, Recharts chart, unlock progress, weekly missions, streak rewards |

---

## PARTE 3 — ACCESIBILIDAD

| # | Test | Cómo |
|---|---|---|
| A1 | Focus visible en celdas del tablero | Tab por el tablero — debe haber outline visible |
| A2 | Keyboard: 1-9 inserta, Backspace borra, Ctrl+Z undo, N notes | Jugar sin mouse |
| A3 | `aria-label` en botones GameControls | Inspeccionar con DevTools |
| A4 | Contraste de texto en tema Classic | Verificar con Lighthouse o ojo |
| A5 | Contraste de texto en tema Neon | El más arriesgado — verificar números sobre fondo verde |
| A6 | `prefers-reduced-motion` desactiva animaciones | En DevTools → Rendering → Emulate prefers-reduced-motion |
| A7 | Skip-to-content link | Tab al cargar página — debe aparecer "Ir al contenido" |
| A8 | Screen reader anuncia celda seleccionada | VoiceOver (Mac) o NVDA |

---

## PARTE 4 — PERFORMANCE

| # | Test | Target | Cómo |
|---|---|---|---|
| P1 | Lighthouse mobile Performance | > 70 | Chrome DevTools → Lighthouse → Mobile |
| P2 | Lighthouse mobile Accessibility | > 85 | Idem |
| P3 | Lighthouse mobile Best Practices | > 85 | Idem |
| P4 | Time to Interactive (3G) | < 5s | Network throttling → Slow 3G |
| P5 | Bundle Profile.js | < 200KB | Actualmente 358KB — Recharts es el culpable |
| P6 | Generador client-side en móvil gama baja | < 3s | Probar generar puzzle "fiendish" en dispositivo lento |

### Fixes de performance si P5 falla

**Recharts tree-shaking** — en `ProfileSessionChart.tsx`, verificar que importa solo lo necesario:
```ts
// BIEN:
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// MAL (importa todo):
import * as Recharts from "recharts";
```

Si aun así es > 200KB, considerar reemplazar Recharts por `chart.js` (más liviano) o una solución CSS-only para gráficos simples.

---

## PARTE 5 — FIXES RECOMENDADOS POR AUDITORÍA BACKEND

Claude Code detectó estos issues que necesitan fix de Cursor:

### FIX 1: Tutorial XP persistente

`grantTutorialXp(30)` guarda en localStorage pero no persiste en Supabase cuando hay auth. El fix:

```ts
// En el handler de lección completada:
if (user) {
  await sudokuService.submitPuzzleResult({
    puzzleId: null,
    difficulty: "easy",
    variant: "classic",
    timeMs: 0,
    errors: 0,
    hintsUsed: 0,
    boardState: lesson.solution,
    solution: lesson.solution,
  });
  // O crear una EF específica para tutorial XP si submitPuzzleResult no aplica
}
```

Alternativa: crear un localStorage flag `sudoku-tutorial-xp-pending` que se sincroniza al login (patrón `syncPending`).

### FIX 2: Challenge idempotencia

Agregar UNIQUE constraint en frontend para evitar doble submission:
```ts
// Antes de submit:
const alreadySubmitted = localStorage.getItem(`challenge-${challengeId}-submitted`);
if (alreadySubmitted) return toast.message("Ya enviaste tu resultado");
// Después de submit exitoso:
localStorage.setItem(`challenge-${challengeId}-submitted`, "true");
```

### FIX 3: og:image PNG

El `og:image` actual es SVG. Twitter/Facebook no renderizan SVG en cards. Crear un PNG estático (1200x630) con el logo y ponerlo en `public/og-image.png`. Actualizar `index.html`:
```html
<meta property="og:image" content="/og-image.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

## ENTREGA

Al terminar, crear `docs/QA_RESULTS.md` con:
1. Tabla 15/15 del QA visual
2. Resultado por ruta (11 rutas)
3. Resultado accesibilidad (8 ítems)
4. Lighthouse scores
5. Fixes aplicados con commit hashes
6. Issues que necesitan backend (anotar en COORDINATION.md)

Commit: `audit: visual QA + accessibility + performance`
Push a main.
