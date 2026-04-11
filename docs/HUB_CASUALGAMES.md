# Casual Games Hub — Propuesta arquitectónica + 10 juegos MVP

> Este doc vive temporalmente en el repo de Sudoku porque es donde estamos trabajando ahora.
> Cuando se cree el repo del hub (`casualgames-hub`), se mueve tal cual a su `docs/`.

## Visión

Un sitio único (`casualgames.vercel.app` o el dominio que elijas) que funciona como **portal de casual games con IA**. Dos objetivos:

1. **Puerta de entrada** a los juegos ya lanzados (Championship Chess + Championship Sudoku).
2. **Vitrina y waitlist** de los próximos 10 juegos, cada uno con su landing + CTA "avisame".

**Monetización futura**: una membresía anual única que desbloquea premium en todos los juegos (sin ads, temas exclusivos, AI coach ilimitado, daily con stats avanzadas). Ver `MONETIZATION.md` cuando toque Sprint 6.

## Arquitectura

### Repos (multi-repo, no monorepo)

```
willybaterola2022-collab/
├── championshipchess         (ya existe, live)
├── championshipsudoku        (ya existe en repo local, pendiente GitHub)
├── casualgames-hub           (nuevo, Sprint 5)
└── championship-<game>       (uno por juego nuevo cuando arranquen)
```

**Por qué multi-repo**:
- Deploy independiente por juego (un bug en memory no rompe chess)
- Equipos distintos pueden trabajar en paralelo
- Vercel project por repo → URLs limpias y roll-back quirúrgico

**Lo que SÍ se comparte entre todos**:
- Supabase project `ahsullbcdrekmribkcbm` (un perfil, un XP, cross-game identity)
- Tablas `profiles`, `achievements`, `user_achievements`, `xp_grants`, `edge_function_calls` (genéricas)
- `_shared/cors.ts`, `_shared/llm.ts`, `_shared/rateLimit.ts` (se copian, 4 archivos chicos)
- Design tokens (gold, Playfair+Inter, dark always)

**Cada juego tiene su propio namespace**:
- Tablas con prefijo: `chess_*`, `sudoku_*`, `wordle_*`, `minesweeper_*`, etc.
- EFs con prefijo: `chess-*`, `sudoku-*`, `wordle-*`, etc.
- Columnas en `profiles` con prefijo: `chess_elo`, `sudoku_rating`, `wordle_streak`, etc.

### Hub stack (idéntico a chess y sudoku, cero experimentos)
- Vite + React 18 + TS + Tailwind + shadcn/ui
- Sin backend propio — el hub es **puramente informativo/marketing** en Sprint 5
- En Sprint 6 se agrega una tabla `hub_waitlist` + EF `hub-waitlist-subscribe` para capturar emails de los juegos no lanzados

### Hub rutas

| Ruta | Contenido |
|---|---|
| `/` | Hero + los 2 juegos live + 10 coming soon + CTA email |
| `/juegos` | Grid completo de juegos |
| `/membresia` | Landing de membresía (Coming Soon en Sprint 5, real en Sprint 6+) |
| `/sobre` | Qué es Casual Games, equipo SKYNET, roadmap |
| `/waitlist/:gameSlug` | Captura email para un juego específico |

---

## Los 10 juegos MVP (propuesta)

Criterios que apliqué para seleccionar:

1. **Reuso de patrones existentes**: board/cells, daily puzzle, XP idempotente, AI hint coach, leaderboard — todo viene del know-how chess+sudoku
2. **Demanda global real**: juegos que la gente ya busca en Google todos los días
3. **Diferenciables con IA**: cada uno con un coach o feature que Solitaire.com, chess.com, miniclip, etc. no tienen
4. **Escalables con contenido**: generables, no requieren editoriales (excepto crosswords, que tiene ventaja SEO)
5. **Cross-play con sudoku/chess**: mismo perfil, misma XP, mismos logros globales

### Lista con justificación

#### 1. Championship Crosswords (Crucigramas)
- **Por qué**: masivo en EEUU, UK, España. NYT lo monetiza como premium desde 1993.
- **Diferencial**: generación IA en ES/EN con temas (noticias del día, cultura pop, ciencia).
- **Reusa**: pipeline daily, leaderboard por tiempo, AI hints.
- **Tablas**: `crosswords_puzzles`, `crosswords_daily`, `crosswords_completions`.
- **Slug**: `crosswords`

#### 2. Championship Wordle (5 letras diario)
- **Por qué**: Wordle fue comprado por NYT por millones. Demanda brutal. Fácil de clonar bien.
- **Diferencial**: modo ES + EN + multi-idioma, "AI coach" que explica por qué una palabra es mejor guess, modo infinito.
- **Reusa**: daily puzzle, leaderboard, streaks.
- **Tablas**: `wordle_puzzles`, `wordle_daily`, `wordle_completions`.
- **Slug**: `wordle`

#### 3. Championship Nonograms (Picross)
- **Por qué**: juego de lógica puro, base de fans consolidada en móvil (Picross, Pic-a-Pix tienen millones de descargas).
- **Diferencial**: puzzles IA-generados, modos 5x5 a 25x25, daily con tema visual (reveal image).
- **Reusa**: generator backtracking (análogo a sudoku), validator, hints.
- **Tablas**: `nonograms_puzzles`, `nonograms_daily`, `nonograms_completions`.
- **Slug**: `nonograms`

#### 4. Championship Kakuro (hermano numérico de sudoku)
- **Por qué**: base de fans de sudoku que quieren algo más. Mismo público.
- **Diferencial**: el coach AI explica la técnica Killer-style.
- **Reusa**: **casi todo el código de sudoku** (la lógica es 80% compartida).
- **Tablas**: `kakuro_puzzles`, `kakuro_daily`, `kakuro_completions`.
- **Slug**: `kakuro`

#### 5. Championship Minesweeper
- **Por qué**: icónico, todos lo conocen, fácil viral (tiempos compartibles).
- **Diferencial**: modos custom, daily 3 tamaños, AI "would you click this?" coach.
- **Reusa**: daily puzzle, leaderboard por tiempo, XP idempotente.
- **Tablas**: `minesweeper_daily`, `minesweeper_completions`.
- **Slug**: `minesweeper`

#### 6. Championship Solitaire (Klondike + variantes)
- **Por qué**: el juego casual más jugado del mundo. Billones de partidas en Windows. Zero fricción.
- **Diferencial**: sin ads (diferencial real vs toda la competencia), 5 variantes (Klondike, FreeCell, Spider, Pyramid, Golf), AI "best move" coach.
- **Reusa**: pipeline XP, leaderboard por tiempo.
- **Tablas**: `solitaire_games`, `solitaire_daily`.
- **Slug**: `solitaire`

#### 7. Championship 2048 (con modos)
- **Por qué**: viral todavía, todos lo conocen. Fácil implementación.
- **Diferencial**: daily seed compartido, modo speed 3min, modo zen infinito, AI prediction coach.
- **Reusa**: leaderboard, XP, streak.
- **Tablas**: `game2048_daily`, `game2048_completions`.
- **Slug**: `2048`

#### 8. Championship Checkers (Damas)
- **Por qué**: primo hermano de ajedrez, audiencia distinta (menos técnica, mayor edad promedio, LATAM fuerte).
- **Diferencial**: 3 variantes (inglesa, internacional, brasileña), AI Stockfish-lite, elo rating compartido.
- **Reusa**: **motor de chess adaptado**, matchmaking futuro, coach AI.
- **Tablas**: `checkers_games`, `checkers_daily_puzzles`.
- **Slug**: `checkers`

#### 9. Championship Memory (Pares/Concentración)
- **Por qué**: educativo, atrae segmento "brain games" adulto (Lumosity, Peak). Monetizable premium.
- **Diferencial**: temas visuales cambiantes, modo diario, IA que analiza tu curva de mejora.
- **Reusa**: daily, leaderboard, XP.
- **Tablas**: `memory_sessions`, `memory_daily`.
- **Slug**: `memory`

#### 10. Championship Word Search (Sopa de Letras)
- **Por qué**: masivo en EEUU y UK, búsqueda constante. Sencillo pero adictivo.
- **Diferencial**: temas IA-generados diarios, modo "sin tiempo" zen, modo speed competitivo.
- **Reusa**: daily, leaderboard.
- **Tablas**: `wordsearch_puzzles`, `wordsearch_daily`.
- **Slug**: `wordsearch`

---

## Prioridad sugerida (por costo/beneficio)

| # | Juego | Dificultad técnica | Demanda | Reuso | Priority |
|---|---|---|---|---|---|
| 1 | Wordle | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **ALTA** — primer juego post-sudoku |
| 2 | Minesweeper | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **ALTA** |
| 3 | 2048 | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **ALTA** |
| 4 | Kakuro | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (reusa sudoku) | **ALTA** |
| 5 | Nonograms | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | MEDIA |
| 6 | Word Search | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | MEDIA |
| 7 | Memory | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | MEDIA |
| 8 | Solitaire | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | MEDIA — muy pedido pero más código |
| 9 | Checkers | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ (motor chess) | MEDIA |
| 10 | Crosswords | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | BAJA — mayor reto (grid irregular, clues) |

**Recomendación**: después de cerrar Sudoku, el siguiente juego es **Wordle** (1 sprint, viral-ready, bajísimo costo). Luego **Kakuro** (reutiliza 80% de sudoku). Luego **2048** y **Minesweeper** en paralelo.

---

## Hub — Sprints

### Sprint H1 — Hub estático con 2 juegos live + 10 tiles (2-3 sesiones)
**Owner**: Cursor (nuevo repo `casualgames-hub`)

- Nuevo repo Vite + React + TS + Tailwind + shadcn (idéntico stack)
- Home con:
  - Hero: logo + tagline + CTA "Jugar ahora"
  - Sección "Disponibles": 2 cards grandes (Chess + Sudoku) con screenshots y CTA → open live URL
  - Sección "Próximamente": 10 cards con icono Lucide, nombre, descripción breve, tag "Próximamente"
  - CTA final "Avisame cuando lancen" con email capture (temporalmente guarda en localStorage, backend en Sprint H2)
- Página `/juegos` — grid completo
- Página `/sobre` — SKYNET + roadmap
- SEO + OG images + favicon (generados con IA o Canva)
- Dark mode, gold brand consistente
- Deploy en Vercel como `casualgames.vercel.app`

**DoD**: URL live, 12 juegos visibles, CTA funcional (aunque el backend del email capture sea stub).

### Sprint H2 — Backend waitlist + analytics (1 sesión)
**Owner**: Claude Code

- Migración en `ahsullbcdrekmribkcbm`: tabla `hub_waitlist(email, game_slug, source, created_at)`
- EF `hub-waitlist-subscribe` con rate limit 5/min/IP y validación Zod del email
- EF `hub-waitlist-count` público: devuelve `{ total: 1523, per_game: { wordle: 450, ... } }` para mostrar "453 personas esperando Wordle" como social proof
- Actualizar hub para llamar las EFs reales

### Sprint H3 — Membresía preview (1 sesión)
**Owner**: Cursor (marketing) + Claude (backend opcional)

- Página `/membresia` con 3 tiers propuestos (Free / Plus / Founder anual)
- **Status**: "Coming Soon — entrá a la waitlist"
- NO implementar Stripe todavía — esto es Sprint 6+ del plan global cuando haya tracción real

---

## Calendario realista

| Semana | Sudoku | Hub | Nuevo juego |
|---|---|---|---|
| Esta | Sprint 1 cierre + Sprint 2 backend | — | — |
| +1 | Sprint 3 auth + sync | Sprint H1 hub estático | — |
| +2 | Sprint 4 daily + leaderboard | Sprint H2 waitlist backend | **Wordle Sprint 1** |
| +3 | QA + promoción cruzada | Sprint H3 membresía preview | Wordle Sprint 2 |
| +4 | — | — | Wordle live + **Kakuro Sprint 1** |

Objetivo razonable: **hub + sudoku en producción + wordle en beta en 4 semanas**.

---

## Qué NO es el hub

- ❌ No es una app nativa. Es web PWA.
- ❌ No es un editor de juegos. No tiene "crea tu propio sudoku".
- ❌ No es red social. No hay feed, comentarios, chat.
- ❌ No es gratis-para-siempre con ads. El modelo es freemium con membresía anual.
- ❌ No reemplaza los repos de cada juego. Es un **portal**, no un monolito.

## Preguntas que quedan abiertas (para vos)

Estas no son bloqueantes para Sprint H1 pero las tenés que contestar antes del Sprint H3:

1. **Dominio**: `casualgames.app` / `playcasualgames.com` / `skynetgames.com` / seguir con `.vercel.app`?
2. **Brand**: ¿"Championship" es el paraguas (Championship Chess, Championship Sudoku, Championship Wordle) o hay un nombre genérico para el hub distinto a los juegos?
3. **Precio membresía**: anual único (mi recomendación: USD 29/año o 39) o mensual también? Lifetime?
4. **Tiers**: Free (con ads) + Plus (sin ads) + Founder (lifetime para los primeros 500)?
5. **Los 10 que propuse**: ¿te cierran los 10 o querés cambiar alguno? Si cambias, decime cuál sale y cuál entra.
