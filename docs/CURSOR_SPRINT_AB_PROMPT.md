# Master Prompt Cursor — Sprint A+B (QA + Pulido)

> Barbara: pegá el bloque de abajo en Cursor. Sprint A+B combinados porque son el mismo ciclo: detectar problemas reales y resolverlos.

---

## COPIAR DESDE ACÁ ↓

Estás en **Championship Sudoku**. El producto ya está live en `https://championshipsudoku.vercel.app` con backend funcionando (8 EFs, 250 puzzles, daily activo, auth Google+email). Cerraste Sprint 1+3+4 antes. Ahora tu trabajo es **cerrar calidad y pulido** — hacer que esto se sienta producto terminado, no MVP frío.

### Antes de tocar código

1. Abrí `https://championshipsudoku.vercel.app` en browser (desktop + móvil)
2. Leé `docs/COORDINATION.md` — la última entrada de Claude Code tiene el estado real del backend
3. Leé `CLAUDE.md` sección "QA Checklist" — los 15 ítems obligatorios

### Tu zona (sin cambios)

Podés tocar: `src/pages/**`, `src/components/**`, `src/hooks/**`, `src/App.tsx`, `src/index.css`.
NO toques: `supabase/**`, `scripts/**`, `src/lib/sudokuService.ts`, `src/contexts/AuthContext.tsx`, `src/integrations/supabase/client.ts`, `src/lib/sudoku/**`.

### Sprint A — QA en producción (prioridad 1)

Recorré estos 15 ítems EN LA URL LIVE (no localhost) y arreglá lo que falle:

1. [ ] Página carga sin errores en consola
2. [ ] Tablero 9x9 renderiza correctamente
3. [ ] Click en celda la selecciona (highlight funciona)
4. [ ] NumPad inserta números correctamente
5. [ ] Errores se muestran en rojo
6. [ ] Undo funciona
7. [ ] Notes toggle funciona
8. [ ] Hint llama a `sudoku-hint` (verificar en Network tab — si da error CORS o 401, anotalo en COORDINATION.md para Claude)
9. [ ] Completar puzzle muestra overlay de victoria
10. [ ] XP se otorga (requiere estar logueado — si no hay login, verificar que localStorage funciona)
11. [ ] `/daily` muestra puzzle del día (si no hay puzzle para hoy, puede estar en UTC — verificar)
12. [ ] Leaderboard muestra tabla (vacía está OK si dice "Sé el primero")
13. [ ] Login funciona (probar email/password primero; Google puede necesitar redirect URL — si falla, anotar error exacto en COORDINATION.md)
14. [ ] PWA: en móvil, verificar que aparece prompt de instalar o que funciona como standalone
15. [ ] Sin `console.log` ni secrets en bundle (abrir source en DevTools)

**Para cada ítem que falle**: arreglá el código y committeá con mensaje `fix: <qué arreglaste>`. Si el problema es del backend (CORS, EF error, schema), NO lo arregles — anotalo en `docs/COORDINATION.md` con el error exacto y seguí con el siguiente ítem.

### Sprint B — Pulido UX (prioridad 2, hacelo después de A)

#### B1. Estados vacíos

Revisá cada lugar donde se muestran datos del servidor y asegurate de que haya un estado vacío claro (no pantalla en blanco ni spinner infinito):

- **Leaderboard vacío**: "Sé el primero en completar el puzzle de hoy"
- **Profile sin auth**: redirect a `/login` con mensaje "Iniciá sesión para ver tu progreso"
- **Profile sin partidas**: "Jugá tu primer sudoku para ver estadísticas acá"
- **Daily sin puzzle** (si el cron no corrió): "El puzzle del día se prepara a medianoche UTC. Volvé pronto." (no pantalla rota)
- **Achievements todos locked**: "Completá tu primer sudoku para desbloquear logros"
- **XP bar nivel 1, 0 XP**: estado default limpio, no "NaN" ni barra rota

#### B2. Errores de red

Agregá manejo de error donde haya llamadas a Supabase o EFs:

```tsx
// Patrón: try/catch con toast de error + estado de fallback
try {
  const { data, error } = await supabase.functions.invoke(...);
  if (error) throw error;
  // usar data
} catch {
  toast.error("No pudimos cargar. Intentá de nuevo.");
  // mostrar estado fallback (datos locales o empty state)
}
```

Lugares a revisar:
- `useHint()` en `useSudokuGame` — ¿qué pasa si la EF está caída? (debe mostrar error, no crashear)
- `useTodayDailyChallenge` — ¿qué pasa si no hay daily para hoy?
- `Leaderboard.tsx` — ¿qué pasa si `sudoku-leaderboard` devuelve 429 (rate limit)?
- `usePlayerProgress` rama server — ¿qué pasa si `profiles` query falla?

#### B3. Accesibilidad básica

- Focus visible en celdas del tablero (borde o outline al navegar con Tab)
- Labels en inputs del login (no solo placeholder)
- Contraste de texto sobre fondo oscuro en los 4 temas de tablero (el neon puede tener bajo contraste)
- `aria-label` en botones de GameControls (Undo, Erase, Notes, Hint)

#### B4. Performance (solo si el bundle > 500KB te preocupa)

El build reportó 601KB de JS. Si querés optimizar:

```tsx
// Code-split de rutas pesadas
const Daily = lazy(() => import("@/pages/Daily"));
const Profile = lazy(() => import("@/pages/Profile"));
const Login = lazy(() => import("@/pages/Login"));
const PlayKiller = lazy(() => import("@/pages/PlayKiller"));

// En App.tsx:
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/play" element={<Play />} />
    <Route path="/play/killer" element={<PlayKiller />} />
    <Route path="/daily" element={<Daily />} />
    <Route path="/login" element={<Login />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Suspense>
```

Solo hacelo si Lighthouse mobile está por debajo de 70. Si está arriba de 80, dejalo.

#### B5. Micro-copy en español

Revisá que TODO el texto visible al usuario esté en español. Buscar strings en inglés que se hayan colado:
- Toasts ("Error", "Success" → "Ese número no va ahí", "Logro desbloqueado")
- Botones ("Submit" → "Enviar", "Share" → "Compartir")
- Placeholders de input
- Alt/aria-label de iconos

#### B6. Navbar links cruzados

Agregá en el Navbar (o footer) un link a Championship Chess si la env var `VITE_CHESS_APP_URL` está definida:

```tsx
const chessUrl = import.meta.env.VITE_CHESS_APP_URL;
// Si existe, mostrar link "Ajedrez" en el nav
```

Y viceversa — cuando tengamos el hub, ambos juegos linkearan al hub.

### Definition of Done Sprint A+B

- [ ] Los 15 ítems del QA Checklist verificados en URL live
- [ ] Estados vacíos cubiertos (no pantallas rotas)
- [ ] Errores de red manejados (toast + fallback)
- [ ] Todo el texto en español
- [ ] `npm run typecheck` verde
- [ ] `npm run build` verde
- [ ] Commits pusheados a main (auto-deploy a Vercel)
- [ ] Verificar deploy nuevo en URL live
- [ ] Entrada en `docs/COORDINATION.md`:
  ```
  ## 2026-04-XX — Cursor — Sprint A+B: QA + Pulido cerrado
  **15/15 QA**: [listar cuáles pasaron y cuáles necesitan backend]
  **Fixes**: [listar cada fix con commit hash]
  **Pendientes backend**: [si algún QA item falló por EF/schema, listar acá]
  ```

### Lo que NO hagas

- NO agregar features nuevas (speed mode, tournaments, etc.)
- NO refactorizar hooks que funcionan
- NO tocar sudokuService.ts, AuthContext, ni lógica pura de sudoku
- NO instalar dependencias pesadas
- NO crear páginas nuevas (el scope es cerrar las 6 que existen)
- NO Stripe, analytics, push notifications

### Si te trabás

- Error CORS → anotalo en COORDINATION.md con URL exacta + error de consola
- Error RLS / permission denied → idem
- Login Google falla → anotar el error; email/password debería funcionar
- Daily no carga → puede ser timezone (UTC vs local); verificar en Network tab qué devuelve la query

### Empezá ahora

1. `git pull origin main` (trae último commit con ci.yml)
2. `npm install` (por si hay deps nuevas)
3. Abrí https://championshipsudoku.vercel.app en el browser
4. Recorré los 15 ítems del QA con DevTools abierto
5. Fix → commit → push → verify en URL live → siguiente ítem
6. Después de QA, pasá a Sprint B (estados vacíos, errores, accesibilidad, copy)
7. Al final, entrada en COORDINATION.md

## COPIAR HASTA ACÁ ↑
