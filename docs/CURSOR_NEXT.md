# CURSOR — 5 FEATURES ROCKSTAR (NO NEGOCIABLE)

> Backend 100% listo y desplegado. Solo falta frontend.
> Hacé todo en orden. Commit por feature.

---

## 1. COMPARTIR RESULTADO VISUAL (PRIORIDAD MÁXIMA)

Al completar un puzzle, generar una imagen compartible del resultado.

### Componente `src/components/sudoku/ShareImage.tsx`

Usar `<canvas>` para generar la imagen (NO html2canvas — peso innecesario):

```tsx
export function generateShareImage(data: {
  difficulty: string;
  timeFormatted: string;  // "4:23"
  errors: number;
  percentile?: number;
  streak: number;
  variant: string;
}): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  
  // Fondo oscuro
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0, 0, 600, 400);
  
  // Borde dorado
  ctx.strokeStyle = "#d4a843";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 580, 380);
  
  // Título
  ctx.fillStyle = "#d4a843";
  ctx.font = "bold 28px 'Playfair Display', serif";
  ctx.textAlign = "center";
  ctx.fillText("Championship Sudoku", 300, 60);
  
  // Stats
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Inter, sans-serif";
  ctx.fillText(`${data.difficulty} · ${data.variant}`, 300, 110);
  ctx.font = "bold 48px Inter, sans-serif";
  ctx.fillText(data.timeFormatted, 300, 180);
  ctx.font = "18px Inter, sans-serif";
  ctx.fillText(`${data.errors} errores · Racha ${data.streak} días`, 300, 220);
  if (data.percentile) {
    ctx.fillStyle = "#d4a843";
    ctx.fillText(`Más rápido que el ${data.percentile}% de los jugadores`, 300, 260);
  }
  
  // CTA
  ctx.fillStyle = "#666";
  ctx.font = "14px Inter, sans-serif";
  ctx.fillText("championshipsudoku.vercel.app", 300, 360);
  
  return canvas.toDataURL("image/png");
}
```

### En `GameResult.tsx`

Agregar botón "Compartir" debajo del score:

```tsx
const handleShare = async () => {
  const imageUrl = generateShareImage({ difficulty, timeFormatted, errors, percentile, streak, variant });
  const blob = await (await fetch(imageUrl)).blob();
  const file = new File([blob], "sudoku-result.png", { type: "image/png" });
  
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Championship Sudoku",
      text: `Resolví un Sudoku ${difficulty} en ${timeFormatted}`,
      files: [file],
    });
  } else {
    // Fallback: copiar texto al clipboard
    await navigator.clipboard.writeText(
      `Championship Sudoku — ${difficulty} en ${timeFormatted} · ${errors} errores\nchampionshipsudoku.vercel.app`
    );
    toast.success("Copiado al portapapeles");
  }
};
```

Botón: icono `Share2` de Lucide. Texto: "Compartir".

---

## 2. DESAFIAR A UN AMIGO

### Ruta `/challenge/:code`

Nueva página `src/pages/Challenge.tsx`:

```tsx
// 1. Fetch challenge data
const { code } = useParams();
const { data } = await supabase.rpc("get_sudoku_challenge", { p_code: code });
// data: { challenge_id, puzzle, solution, difficulty, variant, creator_time_ms, attempts }

// 2. Parse puzzle
const puzzle = JSON.parse(data.puzzle);
const solution = JSON.parse(data.solution);

// 3. Render:
// - Header: "Te desafiaron a resolver este Sudoku"
// - Badge: dificultad + "Tiempo del creador: 4:23"
// - Tablero jugable (reusá useSudokuGame con seeded puzzle)
// - Al completar: llamar sudoku-submit-challenge
// - Mostrar ranking de todos los intentos (creator + others)
```

### Crear challenge (en GameResult)

Al ganar, botón "Desafiar a un amigo" junto a "Compartir":

```tsx
const handleChallenge = async () => {
  const { data } = await supabase.functions.invoke("sudoku-create-challenge", {
    body: {
      puzzle: JSON.stringify(boardToNumbers(originalPuzzle)),
      solution: JSON.stringify(solution),
      difficulty,
      variant,
      time_ms: timerSeconds * 1000,
      errors,
    },
  });
  if (data?.url) {
    await navigator.clipboard.writeText(data.url);
    toast.success("Link copiado — envialo a tu amigo");
  }
};
```

### Submit attempt (en Challenge.tsx)

```tsx
const handleComplete = async () => {
  const { data } = await supabase.functions.invoke("sudoku-submit-challenge", {
    body: {
      challenge_id: challengeData.challenge_id,
      time_ms: timerSeconds * 1000,
      errors: mistakeCount,
      guest_name: guestName || undefined,
    },
  });
  // Mostrar: "Puesto #2 de 5" + tabla de intentos
};
```

### Ruta en App.tsx

```tsx
<Route path="/challenge/:code" element={<Challenge />} />
```

**Sin login necesario** — el desafiado puede jugar como guest (con nombre opcional).

---

## 3. TUTORIAL INTERACTIVO DE TÉCNICAS

### Datos

`src/lib/sudoku/tutorials.ts` ya existe con 10 lecciones. Cada una tiene:
- `key`, `title`, `technique`, `description`, `explanation`
- `targetCell: { row, col, value }` — la celda que el alumno debe resolver
- `hint` — pista antes de revelar
- `puzzle` y `solution` — tablero diseñado para esa técnica

### Página `/tutorial`

Nueva `src/pages/Tutorial.tsx`:

- Lista de 10 lecciones en cards verticales
- Cada card: número, título, técnica, descripción corta
- Completadas: check verde + "Completada"
- Bloqueadas: candado (se desbloquean en orden)

Click en lección → expande:
1. Explicación de la técnica (2-3 párrafos del `description` + `explanation`)
2. Tablero miniatura con la `targetCell` resaltada en dorado pulsante
3. El alumno debe clickear la celda correcta e ingresar el número correcto
4. Si acierta: confetti + "Técnica dominada" + marca completada
5. Si falla: muestra `hint` y deja reintentar

### Hook `src/hooks/useTutorialProgress.ts`

```tsx
// Si hay auth: guardar progreso en sudoku_tutorial_progress
// Si no: guardar en localStorage "sudoku-tutorial-progress"
// Exponer: { lessons, currentLesson, completedCount, markComplete }
```

### Progreso + XP

Al completar cada lección: +30 XP (via localStorage o sudokuService si auth).
Al completar las 10: achievement "Estudiante" (agregar al seed si no existe).

### Ruta + Navbar

```tsx
<Route path="/tutorial" element={<Tutorial />} />
```

Navbar: agregar link "Aprender" entre "Diario" y "Speed".

---

## 4. RACHA CON RECOMPENSAS ESCALADAS

### Datos

Tabla `sudoku_streak_rewards` ya existe con 6 recompensas:

| Días | Recompensa | Descripción |
|---|---|---|
| 3 | +50 XP | "Jugaste 3 días seguidos" |
| 7 | Tema exclusivo | "Tema Racha desbloqueado" |
| 14 | Badge | "Constante" |
| 30 | Badge dorado | "Dedicación dorada" |
| 60 | Título especial | "Maestro de la constancia" |
| 100 | Título legendario | "Centurión" |

### RPC

```tsx
const { data: rewards } = await supabase.rpc("get_sudoku_streak_rewards");
```

### Componente `src/components/sudoku/StreakRewards.tsx`

Timeline vertical (o horizontal en desktop):
- Cada milestone: círculo con número de días
- Si alcanzado: dorado + check + nombre de recompensa
- Si no: gris + "Faltan N días"
- El próximo milestone tiene glow pulsante

Mostrar en:
- Landing (debajo del StreakCounter existente)
- Profile (sección "Tu racha")

### Integración con StreakCounter existente

El `StreakCounter.tsx` actual muestra solo el número. Mejorar:
- Mostrar "Racha: 12 días — Próximo: Badge a los 14"
- Click → expande StreakRewards
- Si hoy ya jugó: check verde. Si no: "Jugá hoy para no perder tu racha"

---

## 5. MODO ZEN

### Concepto

Sin timer, sin límite de errores, sin límite de hints. Solo el puzzle y la calma. Pantalla limpia: tablero + numpad + notas. Sin XP, sin presión.

### Implementación

En `/play` agregar query param `?mode=zen`:

```tsx
const mode = searchParams.get("mode"); // "zen" | null
const isZen = mode === "zen";
```

Si `isZen`:
- Ocultar Timer
- Ocultar error counter ("X/3")
- Ocultar ProgressBar (opcional: mostrar pero sin %)
- Hints ilimitados (no decrementar `hintsRemaining`)
- No llamar `sudokuService.submitPuzzleResult()` al completar
- GameResult simplificado: solo "Completado" + botón "Otro puzzle" (sin stats, sin share, sin XP)
- Fondo: agregar una clase `.zen-mode` con opacidad reducida en bordes y sin glow

### Acceso

- Botón en Landing: icono `Leaf` de Lucide + "Modo Zen"
- Link en Navbar (opcional): "Zen"
- En selector de dificultad: si modo zen, NO mostrar "Experto bloqueado" (todo abierto)

### CSS `.zen-mode`

```css
.zen-mode .glow-gold { box-shadow: none; }
.zen-mode { --sudoku-border-thick: 220 12% 25%; }
```

---

## ORDEN DE EJECUCIÓN

1. **Share visual** (GameResult + ShareImage) — 1 commit
2. **Desafiar amigo** (Challenge.tsx + GameResult botón + ruta) — 1 commit
3. **Tutorial** (Tutorial.tsx + useTutorialProgress + ruta + navbar) — 1 commit
4. **Racha recompensas** (StreakRewards + integración StreakCounter) — 1 commit
5. **Modo Zen** (query param + CSS + GameResult simplificado) — 1 commit

## LO QUE NO TOCAR

- `supabase/**`, `sudokuService.ts`, `AuthContext.tsx`
- `src/lib/sudoku/tutorials.ts` (ya tiene las 10 lecciones, solo importalo)
- `src/lib/sudoku/generator.ts`, `validator.ts`, `solver.ts`

## DESPUÉS DE CADA FEATURE

1. `npm run typecheck` verde
2. `npm run build` verde
3. Commit: `feat: <feature name>`
4. Push a main
5. Verificar en https://championshipsudoku.vercel.app
