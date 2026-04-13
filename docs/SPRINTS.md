# Roadmap por sprints — Championship Sudoku

> Plan derivado de `QA_RESULTS.md`, `CURSOR_AUDIT.md` y mejoras de código. Los sprints son **orientativos** (1–2 semanas cada uno según disponibilidad).

---

## Estado actual (post-mejoras)

| Área | Qué quedó hecho |
|------|-----------------|
| **Bundle Perfil** | `ProfileSessionChart` en **lazy** + `manualChunks: { recharts }` → chunk Perfil ~13 KB gzip; Recharts ~494 KB solo al cargar el gráfico. |
| **PWA** | `og-image.png` en precache (`vite.config.ts`). |
| **E2E** | Smoke ampliado: `/daily`, `/play/killer`, `/challenge` inválido (12 tests). |

---

## Sprint A — QA manual + accesibilidad (frontend)

**Objetivo:** Cerrar ítems ⚠️ de `docs/QA_RESULTS.md` sin automatizar.

| Tarea | Criterio de hecho |
|-------|-------------------|
| A1 | Checklist Chrome: consola sin errores en `/`, `/play`, `/daily` tras deploy. |
| A2 | Probar 15 ítems de juego (celda, error rojo, undo, notes, hint, GameResult, share, zen). |
| A3 | A11y: Tab en tablero, teclado 1–9 sin mouse, `prefers-reduced-motion`, contraste tema Neon. |
| A4 | PWA: “Instalar app” en Chrome Android o Add to Home en iOS. |
| A5 | Actualizar `QA_RESULTS.md` con ✅/❌ reales y fecha. |

**Roles:** 1 persona + Chrome DevTools (no requiere código salvo bugs encontrados).

---

## Sprint B — Backend: XP tutorial + sync

**Objetivo:** Persistir XP de lecciones para usuarios autenticados.

| Tarea | Notas |
|-------|--------|
| B1 | Edge Function o RPC `grant_tutorial_xp` que sume XP al perfil (idempotente por `lesson_key`). |
| B2 | Tras éxito, limpiar `sudoku-tutorial-xp-pending` en cliente y refrescar perfil. |
| B3 | Documentar contrato en `docs/COORDINATION.md`. |

**Dependencia:** equipo backend / Supabase (no solo frontend).

---

## Sprint C — Performance móvil (Lighthouse > 70)

**Objetivo:** Subir Performance mobile sin romper UX.

| Tarea | Idea |
|-------|------|
| C1 | Auditar **LCP**: imagen hero si existe; fuentes ya con `preconnect`. |
| C2 | `font-display: swap` ya en link Google; valorar subset de fuentes. |
| C3 | Code-split de rutas pesadas adicionales (p. ej. `Tutorial` ya usa framer-motion). |
| C4 | Medir de nuevo con Lighthouse mobile tras cada cambio. |

**Meta:** Performance ≥ 70 en mobile (hoy ~63 en CLI).

---

## Sprint D — Gráfico Perfil más liviano (opcional)

**Objetivo:** Reducir chunk `recharts` (~150 KB gzip) si hace falta.

| Opción | Esfuerzo |
|--------|----------|
| D1 | SVG/CSS puro para líneas simples (sin librería). |
| D2 | Lightweight chart (`uplot`, `@observablehq/plot`) si aceptás nueva dependencia. |
| D3 | Mantener Recharts: ya está aislado en chunk async; solo optimizar si métricas lo exigen. |

---

## Sprint E — CI y calidad

| Tarea | |
|-------|---|
| E1 | `playwright test` en GitHub Actions en PRs a `main`. |
| E2 | Umbral mínimo Lighthouse (opcional, frágil en CI). |
| E3 | `npm run typecheck` + `npm run build` ya como gate; añadir `test:e2e` si hay runner con browser. |

---

## Priorización sugerida

1. **Sprint A** — validación real del producto.  
2. **Sprint B** — si los usuarios logueados deben ver XP tutorial en servidor.  
3. **Sprint C** — si el negocio prioriza SEO / Core Web Vitals.  
4. **Sprint D** — solo si C no alcanza o el chunk de Recharts sigue siendo problema.  
5. **Sprint E** — cuando el equipo quiera cerrar el ciclo con CI.

---

## Cómo usar este doc

- **Cursor / dev:** implementar tareas por sprint.  
- **Backend:** Sprint B.  
- **QA / producto:** Sprint A + actualizar `QA_RESULTS.md`.
