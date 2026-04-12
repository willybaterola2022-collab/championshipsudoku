# Backlog negociable — Sudoku + Hub (reemplazo de la «lista de 50»)

## Qué pasó con la lista de 50 recomendaciones

En una sesión anterior se entregó una **tabla textual de mejoras** (orden ~50 ítems) como **recomendaciones de producto y calidad**, no como contrato cerrado ni como issue tracker en GitHub.

- **No estaba versionada** en el repo como checklist único → no hay un archivo histórico que diga «ídem 50/50» sin reconstruirlo.
- **Negociar no es un castigo**: en cualquier proyecto, un backlog grande se **prioriza** (alcance, presupuesto, calendario, dependencias). Sin eso, no hay forma realista de comprometer fechas ni coste.
- Este documento **consolida** lo que ya existe en `docs/PLAN.md`, prompts de sprint (`CURSOR_SPRINT_*`), `COORDINATION.md`, `SPRINTS_HANDOFF.md` y el QA de `CLAUDE.md` / `QA_LIVE_CHECKLIST.md`, en **una sola tabla** para que puedas llevarla a una reunión.

**Cómo usarlo en una negociación**

1. **Fase 1 — Cierre producto mínimo viable estable**: filtrar filas con estado 🟢 o 🟡 que bloqueen experiencia (auth Google, seed, cron, QA manual 15/15).
2. **Fase 2 — Pulido y crecimiento**: ítems 🟠 y backlog «nice to have» (E2E, analytics, Wordle).
3. **Owner**: **C** = Cursor/frontend, **B** = Barbara/ops, **CC** = Claude Code/backend, **H** = hub repo aparte.

---

## Tabla maestra (≈52 filas — mismo orden de magnitud que la lista original)

| ID | Entrega | Owner | Estado | Notas para negociación |
|----|---------|-------|--------|-------------------------|
| S01 | Scaffold + lógica pura + CI | CC | 🟢 | Base cerrada |
| S02 | 8 Edge Functions + migraciones aplicadas | CC | 🟢 | Live según COORDINATION |
| S03 | Frontend Sprint 1: hooks + tablero + rutas base | C | 🟢 | |
| S04 | Deploy Vercel + env Supabase | B | 🟢 | |
| S05 | Auth: Login + Profile + sync híbrido | C + CC | 🟡 | Google OAuth pendiente config dashboard |
| S06 | Daily + Leaderboard UI + hooks | C | 🟢 | |
| S07 | Seed **500+** puzzles (plan original 100/dif.) | CC | 🟠 | ~250 hechos; escalar acordado en PLAN |
| S08 | Cron daily + sin errores 403 en EF cron | CC | 🟠 | Revisar secret/403 documentado |
| S09 | `submitPuzzleResult`: await + XP servidor visible en UI | C | 🟡 | Mejora continua; local vs server |
| S10 | QA checklist **15/15 en URL live** | B | 🟠 | Manual; ver `QA_LIVE_CHECKLIST.md` |
| S11 | Sprint A+B: hints, Daily retry, Leaderboard retry, Profile vacíos | C | 🟢 | Entrada COORDINATION 2026-04-12 |
| S12 | Lazy routes + Suspense | C | 🟢 | |
| S13 | Skip link + `#main-content` | C | 🟢 | Hub + Sudoku |
| S14 | GameResult Dialog + UTM Hub/Chess + onboarding + offline banner | C | 🟢 | Commit reciente en main |
| S15 | Dificultad: hints en selector | C | 🟢 | |
| S16 | ErrorBoundary + OfflineBanner | C | 🟢 | |
| S17 | `refreshProfile` tras sync offline | C | 🟢 | |
| S18 | Logros: etiquetas legibles (title/sr-only) | C | 🟢 | |
| S19 | `prefers-reduced-motion` animaciones tablero | C | 🟢 | |
| S20 | Tests Vitest (UTM u otros) | C | 🟡 | UTM sí; ampliar si se exige cobertura |
| S21 | OAuth Google: redirect URLs en Supabase | B + CC | 🔴 | Bloqueante solo para login Google |
| S22 | Rate limit EFs waitlist / hints | CC | 🟠 | Seguridad/costes |
| S23 | Health check periódico + alerta (opcional) | CC | ⚪ | PLAN Sprint 4 opcional |
| S24 | Alineación fecha Daily cliente UTC vs local | C | 🟡 | Nota en COORDINATION |
| S25 | Hub H1: sitio estático + 12 tiles + deploy | H/C | 🟢 | `casualgames-hub` live |
| S26 | Hub H2: waitlist real Supabase | CC + H | 🟢 | EFs conectados según COORDINATION |
| S27 | Hub H3: página membresía preview (sin Stripe) | H | 🟠 | PLAN: cuando se priorice |
| S28 | Hub: SEO robots/sitemap/páginas internas | H | 🟢 | Entrada 2026-04-13 |
| S29 | Enlace cruzado Sudoku ↔ Hub ↔ Chess + UTM | C | 🟡 | Sudoku listo; falta `VITE_HUB_URL` en Vercel si aplica |
| S30 | PWA: prompt instalar verificado en dispositivo real | B | 🟠 | Checklist QA manual |
| S31 | Bundle / Lighthouse bajo umbral si negocio exige score | C | ⚪ | Sprint AB: optimizar solo si Lighthouse móvil cae mucho |
| S32 | Achievement unlock: toasts animados uno a uno | C | 🟠 | Prompt Sprint 3+4; verificar implementación |
| S33 | `og:image` y meta social sin 404 | C | 🟠 | Recomendación QA |
| S34 | E2E Playwright o similar | C | ⚪ | No en scope actual |
| S35 | Stripe / pagos | — | ⛔ | PLAN explícito: no hasta fase posterior |
| S36 | Wordle Championship (W1) | CC + C | ⚪ | Tras Sudoku estable |
| S37 | Migraciones sin conflicto con Chess | CC | 🟢 | Mitigado según PLAN |
| S38 | Documentación handoff (`COORDINATION`, `SPRINTS_HANDOFF`) | C + CC | 🟢 | |
| S39 | GitHub ↔ Vercel auto-deploy | B | 🟠 | Opcional en COORDINATION |
| S40 | Perfil: historial últimas N sesiones desde BD | C | 🟠 | Mención en prompts; ver código actual |
| S41 | Killer: pistas IA | C + CC | ⛔ | Copy dice no en esta versión |
| S42 | Modo torneo / speed run | — | ⛔ | Fuera de scope Sprint AB |
| S43 | Analytics / métricas producto | — | ⚪ | No pedido en sprints cerrados |
| S44 | Notificaciones push | — | ⛔ | Sprint AB explícito |
| S45 | Doble pipeline XP resuelto (fuente única verdad) | C + CC | 🟡 | Riesgo abierto en PLAN |
| S46 | `sudoku-daily-cron` 403 resuelto en prod | CC | 🟠 | Handoff |
| S47 | Generador lento en móvil → más puzzles server-side | CC | 🟠 | PLAN riesgo |
| S48 | Hub: sin fake social proof | H | 🟢 | Reglas honestas |
| S49 | Accesibilidad: focus tablero, labels login, contraste 4 temas | C | 🟡 | Mayoría hecha; contraste neon revisar manual |
| S50 | Multi-idioma | — | ⚪ | No en scope |
| S51 | Documento único negociación (este archivo) | C | 🟢 | Para reuniones |
| S52 | Post-despliegue: curl ruta nueva 200 tras cada push | B/C | 🟡 | Protocolo equipo |

**Leyenda:** 🟢 hecho / 🟡 parcial o depende de config / 🟠 pendiente planificado / 🔴 bloqueante explícito / ⚪ no iniciado u opcional / ⛔ explícitamente fuera de scope.

---

## Respuesta corta a «¿por qué tengo que negociarlos?»

Porque **ninguna lista de 50 mejoras es un alcance cerrado** hasta que alguien (vos, el cliente o el equipo) **elige** qué entra en la **versión 1.0**, qué va a la **versión 1.1**, y qué queda en **backlog**. Negociar es **convertir recomendaciones en compromisos** (fecha, coste, owner). Este archivo te da **una base única** para esa conversación; si querés, el siguiente paso es bajar esto a **issues numerados en GitHub** con etiquetas `phase-1` / `phase-2`.

---

*Última actualización: 2026-04-12. Mantener alineado con `docs/COORDINATION.md` (append-only).*
