# Master Prompt Cursor — Sprint C (Hub Casual Games)

> Barbara: este prompt es para DESPUÉS de Sprint A+B. Se trabaja en un REPO NUEVO.
> Cuando Sprint A+B estén cerrados, abrí una nueva sesión de Cursor en la carpeta del hub y pegá esto.

---

## COPIAR DESDE ACÁ ↓

Vas a crear **Casual Games Hub** — el portal central de marca que conecta todos los juegos del ecosistema SKYNET P004. Hoy tiene 2 juegos live (Championship Chess y Championship Sudoku) y 10 juegos anunciados como "Próximamente".

### Setup inicial

```bash
cd "/Users/barbara/Desktop/SKYNET/P004-CASUAL GAMES"
mkdir casualgames-hub && cd casualgames-hub
npm create vite@latest . -- --template react-ts
npm install tailwindcss@3.4 postcss autoprefixer tailwindcss-animate
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
npm install react-router-dom sonner framer-motion
npx tailwindcss init -p
```

Stack: React 18 + Vite + TypeScript + Tailwind + shadcn/ui. **Exactamente igual que Chess y Sudoku.**

### Design system (mismo que los juegos)

- **Dark mode always** — no light mode
- **Primary**: Gold `hsl(43 90% 55%)` sobre fondo `hsl(220 20% 4%)`
- **Fonts**: Playfair Display (títulos) + Inter (body)
- **Glass morphism**: `.glass`, `.glass-strong`
- **Icons**: Lucide React. **Sin emojis.**
- **Mobile-first**: base 360px
- **Español** en toda la UI

### Páginas a crear (3)

#### 1. Home (`/`)

Layout de arriba a abajo:

**Hero** (full viewport):
- Eyebrow: "SKYNET · P004 · CASUAL GAMES"
- H1: "Casual Games" en Playfair Display gold, tamaño grande (text-6xl mobile, text-8xl desktop)
- Subtítulo: "Juegos de lógica y estrategia con IA. Gratis." en Inter muted
- CTA primario: "Explorar juegos" (scroll down smooth)

**Sección "Juega ahora"** (2 cards grandes):

```
┌─────────────────────────┐  ┌─────────────────────────┐
│  ♟ Championship Chess   │  │  # Championship Sudoku  │
│                         │  │                         │
│  Ajedrez con IA,        │  │  Clásico y Killer con   │
│  puzzles diarios,       │  │  pistas de IA, puzzle   │
│  ELO rating, coach.     │  │  diario, XP compartido. │
│                         │  │                         │
│  [Jugar ahora →]        │  │  [Jugar ahora →]        │
└─────────────────────────┘  └─────────────────────────┘
```

Cada card: glass morphism, borde gold, icono Lucide grande (no imagen real), nombre, descripción 2 líneas, botón "Jugar ahora" que abre la URL del juego en nueva pestaña. URLs:
- Chess: `https://championshipchess.vercel.app`
- Sudoku: `https://championshipsudoku.vercel.app`

**Sección "Próximamente"** (10 tiles en grid 2x5 mobile, 5x2 desktop):

Los 10 juegos futuros. Cada tile:
- Icono Lucide representativo (ver lista abajo)
- Nombre del juego
- 1 línea de descripción
- Badge "Próximamente" en gris
- **Sin fechas, sin números inventados, sin waitlist por ahora**

Los 10 juegos (con iconos Lucide sugeridos):

| # | Nombre | Icono Lucide | Descripción corta |
|---|---|---|---|
| 1 | Championship Wordle | `Type` | Adivina la palabra en 6 intentos. Diario en español e inglés. |
| 2 | Championship Minesweeper | `Bomb` | Buscaminas con modos y puzzle diario competitivo. |
| 3 | Championship 2048 | `Layers` | Fusiona números. Modo speed, zen e infinito. |
| 4 | Championship Kakuro | `Hash` | Crucigramas numéricos. El hermano del Sudoku. |
| 5 | Championship Nonograms | `Grid3x3` | Picross: revela imágenes con lógica pura. |
| 6 | Championship Word Search | `Search` | Sopa de letras temática diaria con IA. |
| 7 | Championship Solitaire | `Club` | Klondike, Spider y FreeCell. Sin anuncios. |
| 8 | Championship Memory | `Brain` | Pares y concentración. Entrena tu memoria. |
| 9 | Championship Checkers | `CircleDot` | Damas clásicas e internacionales con IA. |
| 10 | Championship Crosswords | `BookOpen` | Crucigramas diarios generados con IA. |

**Sección final** (CTA):
- "¿Querés que te avisemos cuando lancemos un juego nuevo?"
- Input de email + botón "Avisame" (por ahora guardar en localStorage con toast "Te avisaremos" — backend en Sprint D)
- Texto legal mínimo: "No spam. Solo avisos de lanzamiento."

**Footer**:
- "Casual Games — SKYNET P004"
- Links: Ajedrez · Sudoku · Sobre nosotros
- "Hecho con IA"

#### 2. Juegos (`/juegos`)

Grid completo de 12 cards (2 live + 10 próximamente). Mismo estilo que la sección de home pero en página dedicada con filtros opcionales (Todos / Disponibles / Próximamente).

#### 3. Sobre (`/sobre`)

Página simple:
- H1 "Sobre Casual Games"
- Párrafos sobre qué es el proyecto: "Suite de juegos de lógica y estrategia potenciados por IA. Cada juego tiene puzzle diario, ranking, XP compartido entre juegos, y un coach IA que te ayuda a mejorar."
- "Construido con amor por SKYNET"
- Link a cada juego live

### Archivos a crear

```
casualgames-hub/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css          (mismos tokens que sudoku/chess)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Games.tsx
│   │   └── About.tsx
│   └── components/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── GameCardLive.tsx
│       ├── GameCardSoon.tsx
│       ├── HeroSection.tsx
│       └── WaitlistForm.tsx
├── public/
│   └── favicon.ico
├── vercel.json             (copiar de sudoku)
├── tailwind.config.ts      (copiar de sudoku)
├── .gitignore              (copiar de sudoku)
├── index.html
└── package.json
```

### Configuración Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### SEO / Meta tags

```html
<title>Casual Games — Juegos de lógica y estrategia con IA</title>
<meta name="description" content="Ajedrez, Sudoku, Wordle y más. Juegos casual gratis con IA, puzzle diario, ranking y XP compartido." />
<meta property="og:title" content="Casual Games" />
<meta property="og:description" content="Suite de juegos casual con IA. Ajedrez y Sudoku disponibles. 10 juegos más próximamente." />
<meta property="og:image" content="/og-image.png" />
```

### Lo que NO hagas

- NO backend (nada de Supabase, EFs, migraciones)
- NO Stripe/pagos
- NO promesas con fechas o números ("¡500 personas esperando!") — todo es "Próximamente" sin más
- NO routing complejo — 3 páginas flat
- NO instalar Framer Motion para animaciones complejas en el hero — transitions CSS simples alcanzan
- NO página de membresía todavía

### Definition of Done

- [ ] URL live del hub (Barbara crea proyecto Vercel + conecta repo)
- [ ] Home con hero + 2 juegos live + 10 próximamente + waitlist stub
- [ ] `/juegos` con grid completo
- [ ] `/sobre` con info básica
- [ ] Responsive en mobile 360px + desktop
- [ ] Dark mode, gold accents, Playfair + Inter
- [ ] Links a Chess y Sudoku funcionan (abren en nueva pestaña)
- [ ] SEO meta tags
- [ ] `npm run typecheck && npm run build` verde
- [ ] Sin emojis, sin console.log, sin texto en inglés

### Cuando termines

1. Commit + push a main
2. Avisá a Barbara para que cree el proyecto Vercel (`casualgames-hub`) y conecte el repo
3. Verificá en URL live que todo se ve bien en móvil y desktop
4. Reportá a Barbara: "Hub listo — <URL> — 12 juegos visibles — Chess y Sudoku linkeados"

## COPIAR HASTA ACÁ ↑
