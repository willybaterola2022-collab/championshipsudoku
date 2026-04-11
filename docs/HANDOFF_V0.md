# HANDOFF — v0.dev (Design Exploration)

> Usá este doc como prompt base cuando le pidas componentes a v0.dev.
> Después, el código generado se integra manualmente en el repo vía Cursor.

## Contexto del producto

Championship Sudoku es un juego web de Sudoku (clásico y Killer) parte del ecosistema Championship Chess. Dark mode, gold accents, glassmorphism, mobile-first. Tono: elegante, competitivo, no infantil.

## Stack objetivo (lo que v0 debe generar)

- React 18 + TypeScript
- Tailwind CSS (no vanilla CSS)
- shadcn/ui primitives (`@/components/ui/button`, `@/components/ui/dialog`, etc.)
- Lucide React para iconos (nunca emojis)
- Responsive mobile-first (base 360px)
- Accesibilidad: labels, aria, keyboard navigation

## Design tokens

**Colores** (CSS custom properties, ya definidos):
```css
--background: 220 20% 4%;      /* Negro azulado profundo */
--foreground: 43 20% 92%;       /* Blanco cálido */
--primary: 43 90% 55%;          /* Gold */
--primary-foreground: 220 20% 4%;
--muted: 220 15% 12%;
--muted-foreground: 220 10% 60%;
--border: 220 15% 18%;
--accent: 43 60% 45%;
```

**Fuentes**:
- `font-serif`: Playfair Display (títulos, números del tablero)
- `font-sans`: Inter (body, botones, UI general)

**Espaciado**: Tailwind default (4px base).

**Bordes**: `rounded-lg` default, `rounded-xl` para cards, `rounded-full` para botones circulares.

**Sombras / glow**:
```css
.glass { @apply bg-background/60 backdrop-blur-xl border border-border/50; }
.glass-strong { @apply bg-background/80 backdrop-blur-2xl border border-border; }
.glow-gold { box-shadow: 0 0 40px hsla(43, 90%, 55%, 0.2); }
```

## Prompts maestros para v0

### Prompt 1: Sudoku Board Hero (Landing)

```
Create a React + TypeScript + Tailwind + shadcn/ui hero section for a Sudoku website called "Championship Sudoku".

Layout:
- Full viewport height, dark background (hsl(220 20% 4%))
- Centered content, mobile-first base 360px width
- Top: eyebrow text "P004 · CASUAL GAMES" in small muted text
- H1: "Championship Sudoku" in Playfair Display serif, gold color (hsl(43 90% 55%)), 4xl mobile / 6xl desktop
- Subtitle: "Clásico y Killer. Con IA. Gratis." in Inter sans, muted-foreground
- Interactive 9x9 Sudoku board preview (just visual, no logic needed) — 320px square mobile, 480px desktop, with glass morphism background, gold border glow, bold borders every 3 cells
- Below the board: 3 horizontal stat chips: "Clásico", "Killer", "Diario"
- CTA button: "Jugar ahora" with gold background, large, pill shape, subtle glow pulse animation
- Bottom: secondary text "Sin registro. Juega y mejora."

Style: Elegant, minimalist, dark, luxurious. Glass morphism. Gold accents. No emojis. Use Lucide icons only.

Use @/components/ui/button from shadcn. Spanish language only.
```

### Prompt 2: Game Screen (Play)

```
Create a React + TypeScript + Tailwind + shadcn/ui full-screen Sudoku game page.

Top bar (h-14 sticky):
- Left: back arrow (Lucide ArrowLeft) + difficulty badge ("Medio")
- Center: Timer "02:47" in Playfair serif, pausable (play/pause icon)
- Right: Error counter "2/3" with red highlight

Sub-bar:
- Left: board theme dropdown (4 options: Clásico, Mínimo, Contraste, Neón)
- Right: progress bar showing % completion

Main:
- 9x9 Sudoku board centered, 90vw max 450px, with selected cell highlighted in gold
- Cells show notes as 3x3 grid of small numbers when in notes mode
- Error cells in red

Below board:
- Game controls: 4 circular buttons (72px) in a row: Undo (Undo2 icon), Erase (Eraser icon), Notes (Pencil icon, with toggle state), Hint (Lightbulb icon with badge "3")
- NumPad: 3x3 grid of numeric buttons (1-9), glass morphism, max-w-80, tap highlight

Dark background, gold primary, glass elements, mobile-first. Spanish only. Lucide icons only.

Use @/components/ui/button and @/components/ui/progress from shadcn.
```

### Prompt 3: Daily Puzzle + Leaderboard

```
Create a React + TypeScript + Tailwind + shadcn/ui page for "Puzzle del día" with leaderboard.

Layout:
- Top: H1 "Puzzle del día" serif gold + date "12 de Abril, 2026"
- Countdown: "Próximo en 08:34:12" in muted color
- Bonus badge: "+50 XP" gold pill

Main card (glass morphism):
- "Dificultad: Medio" badge
- 9x9 preview board (smaller, 280px)
- CTA button "Jugar el puzzle del día" (gold, large)
- Stats row: "145 completados hoy" + "Tu mejor: 04:23"

Leaderboard section:
- H2 "Ranking de hoy"
- Table with columns: Rank | Jugador | Tiempo | Errores
- Top 3 with gold/silver/bronze medals (Lucide Award icon)
- Sticky row showing current user's position if not in top 20

Dark, mobile-first, elegant. No emojis. Use shadcn Card, Badge, Table.
```

### Prompt 4: Profile

```
Create a React + TypeScript + Tailwind + shadcn/ui user profile page for a Sudoku game.

Header:
- Avatar (Lucide User fallback) + display name + @username + "Nivel 12 · Estratega"

Stats grid (4 cards):
- "XP total" with gold number 1,340 + XP bar to next level
- "Sudokus resueltos" with count by difficulty breakdown
- "Racha actual" with streak days + flame icon + best streak
- "Mejor tiempo" by difficulty (table)

Achievements section:
- Grid of 10 circular badges (6x mobile, 10x desktop)
- Unlocked in gold, locked in grey with lock icon
- Each shows title + description on hover

Activity heatmap:
- Last 7 days as row of circles (filled = played that day)

Dark mode, glass cards, gold accents, Spanish. Lucide icons only. Use shadcn Card, Badge, Tooltip.
```

### Prompt 5: Login

```
Create a React + TypeScript + Tailwind + shadcn/ui login page for a Sudoku game.

Layout:
- Centered card (max-w-md), glass morphism
- Logo "Championship Sudoku" in serif gold at top
- "Continúa tu progreso" subtitle
- Big "Continuar con Google" button (white bg, Google icon, dark text)
- Divider "o"
- Email field + password field (shadcn Input)
- "Iniciar sesión" button (gold primary)
- Link "Crear cuenta" below
- Small disclaimer: "Al continuar aceptas nuestros términos"

Dark background, gold accents, elegant. Spanish. No emojis. Use shadcn Input, Button, Card.
```

## Lo que NO pedirle a v0

- Lógica de juego completa (la tiene Cursor en los hooks)
- Integración con Supabase (Cursor lo hace)
- Routing (Cursor lo hace en App.tsx)
- AuthContext (ya está)
- sudokuService (ya está)

## Cómo integrar el output de v0

1. Copiar el `.tsx` que v0 genera
2. Pegarlo en `src/components/sudoku/` o `src/pages/` según corresponda
3. Cursor reemplaza datos hardcoded con props reales
4. Cursor conecta hooks (`useSudokuGame`, `useAuth`, etc.)
5. Cursor agrega la ruta en `App.tsx`
6. Verificar que no rompa typecheck: `npm run typecheck`
7. Verificar en browser: `npm run dev`

**No dejar que v0 sea el editor principal**. v0 es una fuente de inspiración de UI, no el IDE del proyecto.
