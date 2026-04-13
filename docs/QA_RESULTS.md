# QA Results — Visual audit (CURSOR_AUDIT.md)

**Fecha:** 2026-04-13  
**Entorno live:** `https://championshipsudoku.vercel.app`  
**Método:** chequeos HTTP automatizados, Lighthouse (CLI), revisión de código; interacción fina en browser **pendiente de confirmación humana** donde se indica.

---

## 1. QA visual (15 ítems)

| # | Estado | Nota |
|---|--------|------|
| 1 | ⚠️ | **Consola sin errores en `/`:** no se abrió Chrome en esta sesión. Recomendado: DevTools → Console en prod tras cada deploy. |
| 2 | ⚠️ | **Tablero 9×9 centrado:** verificado por implementación (`Landing` + `SudokuBoard`). Confirmar visualmente en viewport móvil/desktop. |
| 3 | ⚠️ | **Highlight dorado al clic:** `SudokuCell` con anillo al seleccionar. Verificar interacción en browser. |
| 4 | ⚠️ | **NumPad:** integrado con `useSudokuGame.placeNumber`. Prueba manual. |
| 5 | ⚠️ | **Error en rojo:** `validator` + `SudokuCell` animate-cell-error. Prueba manual. |
| 6 | ⚠️ | **Undo:** `useSudokuGame.undo`. Prueba manual. |
| 7 | ⚠️ | **Notes 3×3:** `SudokuCell` notas. Prueba manual. |
| 8 | ⚠️ | **Hint coach banner:** `HintCoachBanner` + EF `sudoku-hint`. Prueba manual (celda vacía + Hint). |
| 9 | ⚠️ | **GameResult al completar:** `GameResult` montado con `open={isCompleted}`. Prueba manual. |
| 10 | ⚠️ | **Compartir imagen / clipboard:** `ShareImage.tsx` + `shareResultImage`. Prueba manual (Web Share o fallback). |
| 11 | ✅ | **`/daily` responde HTTP 200** y página carga (smoke). Contenido puzzle del día: verificar datos en Supabase si hay dudas. |
| 12 | ⚠️ | **Leaderboard / “Sé el primero”:** componente en ruta daily; verificar copy en UI. |
| 13 | ⚠️ | **Login email:** flujo Supabase; prueba manual con cuenta de test. |
| 14 | ⚠️ | **PWA install:** `manifest` + SW generados en build; probar en Chrome Android / Add to Home. |
| 15 | ✅ | **`/play?mode=zen` HTTP 200**; código oculta timer, barra de progreso, sin `submitPuzzleResult` en zen (`useSudokuGame`). |

---

## 2. Rutas (11) — desktop + mobile (360px)

**HTTP GET** (respuesta SPA; todas devolvieron **200** en el momento del chequeo):

| Ruta | HTTP | Nota |
|------|------|------|
| `/` | 200 | Hero, tablero, streak, XP (viewport móvil: verificar manualmente) |
| `/play` | 200 | HUD completo; mobile: layout `sudoku-play-layout` |
| `/play/mini` | 200 | Grid 6×6 |
| `/play/killer` | 200 | Killer + jaulas |
| `/play?mode=zen` | 200 | Zen: sin timer en UI |
| `/daily` | 200 | Daily + leaderboard |
| `/speed` | 200 | Speed challenge |
| `/tutorial` | 200 | Lista de lecciones |
| `/challenge/:code` | 200 | SPA; código inválido muestra “no encontrado” en app |
| `/login` | 200 | OAuth + email |
| `/profile` | 200 | Requiere auth para datos reales; sin sesión puede redirigir según `Profile.tsx` |

**Mobile 360px:** no emulado en CLI; recomendado Chrome DevTools → iPhone SE / 390px.

---

## 3. Accesibilidad (8 tests)

| # | Estado | Nota |
|---|--------|------|
| A1 | ⚠️ | Focus visible en celdas: `focus-visible:ring` en `SudokuCell` — revisar Tab por tablero. |
| A2 | ⚠️ | Teclado 1–9, undo, notes: `useSudokuKeyboard` — prueba sin mouse. |
| A3 | ⚠️ | `aria-label` en controles: inspeccionar `GameControls` / botones. |
| A4 | ⚠️ | Contraste tema Classic: revisión visual / Lighthouse contrast. |
| A5 | ⚠️ | Contraste tema Neon: el más crítico — revisar números sobre verde. |
| A6 | ⚠️ | `prefers-reduced-motion`: `index.css` desactiva animaciones — emular en Rendering. |
| A7 | ✅ | Skip link: `SkipToContent` + clase `.skip-link` en `App.tsx`. |
| A8 | ⚠️ | VoiceOver/NVDA: prueba manual. |

**Lighthouse Accessibility (ejecución CLI, URL home, configuración por defecto del runner):** **96/100** (ver sección 4).

---

## 4. Performance (Lighthouse + bundle)

| # | Métrica | Resultado | Target (audit) |
|---|---------|-----------|----------------|
| P1 | Performance (mobile, Lighthouse CLI) | **63** | > 70 |
| P2 | Accessibility | **96** | > 85 ✅ |
| P3 | Best Practices | **100** | > 85 ✅ |
| P4 | TTI Slow 3G | No medido en CI | < 5s manual |
| P5 | Chunk `Profile-*.js` | **~366 KB** (~110 KB gzip) | < 200 KB ❌ (Recharts principalmente) |
| P6 | Generador fiendish en móvil | No medido | < 3s manual |

**Notas**

- **Desktop** (Lighthouse `--preset=desktop`, misma URL): **Performance ~98** — el cuello de botella es principalmente **mobile CPU/throttling**.
- `ProfileSessionChart.tsx` importa **solo** componentes nombrados de `recharts` (tree-shaking correcto); el tamaño sigue alto por la librería completa.
- Tras deploy, **`/og-image.png`** debe servirse con **200** (PNG 1200×630 en `public/`).

---

## 5. Fixes aplicados (esta sesión)

| Fix | Descripción | Archivos |
|-----|-------------|----------|
| **Tutorial XP persistente (cliente)** | Con sesión, el XP de tutorial se acumula en `localStorage` (`sudoku-tutorial-xp-pending`) y se muestra en `XPBar` como “pendiente sync”. Invitados siguen sumando XP en progreso local. | `usePlayerProgress.ts`, `XPBar.tsx`, `Landing.tsx`, `Profile.tsx` |
| **Challenge idempotencia** | Antes de `sudoku-submit-challenge`, se evita doble envío con `localStorage` `challenge-{id}-submitted` + toast si ya se envió. | `useSudokuGame.ts` (`finalizeWin` + `challengeMeta`) |
| **og:image PNG** | `public/og-image.png` (1200×630), `index.html` meta `og:image` / Twitter / dimensiones. | `index.html`, `public/og-image.png` |

**Regresión corregida:** el flujo `challengeMeta` + early return `zen` en `finalizeWin` había quedado sin el bloque RPC; se restauró junto con la idempotencia.

**Commit:** `42ccb7e` — `audit: visual QA + accessibility + performance`

---

## 6. Issues para backend / coordinación

- **Tutorial XP servidor:** aplicar XP pendiente a `profiles` o EF dedicada (`sudoku-tutorial-xp` o similar); hasta entonces el cliente solo muestra XP tutorial como **pendiente**.
- **Performance Profile:** valorar gráfico más liviano (CSS-only, u otro chart) si hace falta bajar el chunk < 200 KB.
- Ver `docs/COORDINATION.md` entrada nueva 2026-04-13.

---

## 7. Comandos útiles (reproducir)

```bash
# Rutas (HTTP)
for p in "" "/play" "/play/mini" "/play/killer" "/play?mode=zen" "/daily" "/speed" "/tutorial" "/login" "/profile"; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://championshipsudoku.vercel.app$p"
done

# Lighthouse (ejemplo)
npx lighthouse@11.7.1 "https://championshipsudoku.vercel.app/" \
  --only-categories=performance,accessibility,best-practices \
  --chrome-flags="--headless" --output=json --output-path=./lh.json
```
