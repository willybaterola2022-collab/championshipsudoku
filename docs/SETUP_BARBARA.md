# Setup — Barbara (pasos locales)

> Los pasos que yo no puedo ejecutar por vos. Hacelos en este orden.
> Todo lo que requiere permisos de tu cuenta (GitHub, Vercel) o es interactivo está acá.

## 1. Primera verificación local (5 min)

```bash
cd "/Users/barbara/Desktop/SKYNET/P004-CASUAL GAMES/Sodoku/championshipsudoku"

# Instalar deps
npm install

# Copiar env y pegarle el anon key real de Supabase chess
cp .env.example .env.local
# Editá .env.local y pegá el valor real de VITE_SUPABASE_ANON_KEY
# (lo encontrás en tu dashboard de Supabase proyecto ahsullbcdrekmribkcbm → Settings → API → anon/public)

# Verificar que arranca
npm run dev
# → abrir http://localhost:8080
# Deberías ver la página "Championship Sudoku — scaffold inicial"
```

Si algo falla acá, avisame y lo arreglo antes de seguir.

## 2. Crear el repo de GitHub (2 min)

```bash
cd "/Users/barbara/Desktop/SKYNET/P004-CASUAL GAMES/Sodoku/championshipsudoku"

git init
git add .
git commit -m "feat: Sprint 0 foundation — scaffold, docs, backend stubs

Full backend + infrastructure scaffold for Championship Sudoku.
Includes 8 edge functions, 4 SQL migrations, quality gates, CI,
and master prompts for Cursor + v0.dev coordination.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

# Crear repo remoto con gh CLI
gh repo create willybaterola2022-collab/championshipsudoku \
  --private \
  --source=. \
  --remote=origin \
  --push
```

Si no tenés `gh` instalado:
```bash
# 1. Creás el repo a mano en github.com/new con nombre "championshipsudoku"
# 2. Después:
git remote add origin https://github.com/willybaterola2022-collab/championshipsudoku.git
git branch -M main
git push -u origin main
```

## 3. Conectar Vercel (5 min)

### Opción A — Dashboard (recomendado para primera vez)

1. Andá a https://vercel.com/new
2. Elegí el team **Skynetmethod**
3. Import Git Repository → seleccioná `championshipsudoku`
4. Framework Preset: **Vite** (se detecta solo)
5. Root Directory: dejalo en `./`
6. En **Environment Variables** agregá:
   - `VITE_SUPABASE_URL` = `https://ahsullbcdrekmribkcbm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (el mismo valor que pusiste en `.env.local`)
7. Click **Deploy**

Verificá que el deploy salió verde. La URL será algo como `championshipsudoku-xxxx.vercel.app`. Podés renombrarla a `championshipsudoku.vercel.app` en Settings → Domains.

### Opción B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add VITE_SUPABASE_URL production
# pegar: https://ahsullbcdrekmribkcbm.supabase.co
vercel env add VITE_SUPABASE_ANON_KEY production
# pegar: el anon key real
vercel --prod
```

**Importante**: usá el CLI si vas a pegar un JWT largo — el dashboard de Vercel tiene un bug histórico que trunca JWTs cuando los pegás (lección aprendida de chess, `feedback_vercel_env_key`).

## 4. Aplicar las 4 migraciones SQL (próxima sesión con Claude)

Yo esto lo hago en la siguiente sesión cuando tenga acceso a Supabase CLI linkeado al proyecto. No lo hagas vos a mano — son 4 archivos en `supabase/migrations/` que se aplican con:

```bash
supabase link --project-ref ahsullbcdrekmribkcbm
supabase db push
```

Te aviso cuando lo haga.

## 5. Desplegar Edge Functions (próxima sesión con Claude)

Idem. Yo las despliego con:

```bash
supabase functions deploy sudoku-save-game
supabase functions deploy sudoku-validate-game
# ... (las 8)
```

Las EFs existen en `supabase/functions/` como código, solo falta desplegarlas a Supabase.

## 6. Pasarle el master prompt a Cursor

1. Abrí Cursor en `/Users/barbara/Desktop/SKYNET/P004-CASUAL GAMES/Sodoku/championshipsudoku/`
2. Abrí el archivo `docs/MASTER_PROMPT_CURSOR.md`
3. Copiá el bloque entre `## COPIAR DESDE ACÁ ↓` y `## COPIAR HASTA ACÁ ↑`
4. Pegalo como **primer mensaje** a Cursor
5. Cursor leerá los docs y arrancará Sprint 1

## 7. Al final del Sprint 1 (cuando Cursor termine)

Verificá tú con tus ojos, en la URL de Vercel (no localhost), los 15 items del QA Checklist en `CLAUDE.md`. Si alguno falla, no está listo — decile a Cursor qué ítem falló.

## Resumen de lo que falta

| Paso | Responsable | Cuándo |
|---|---|---|
| 1. `npm install` + `npm run dev` local | Barbara | Ahora |
| 2. Git init + push a GitHub | Barbara | Ahora |
| 3. Conectar Vercel + env vars | Barbara | Ahora |
| 4. Aplicar migraciones SQL | Claude (próxima sesión) | Cuando Barbara diga |
| 5. Desplegar 8 Edge Functions | Claude (próxima sesión) | Cuando Barbara diga |
| 6. Sprint 1 frontend | Cursor | Cuando Barbara le dé master prompt |
| 7. QA 15/15 en URL live | Barbara | Cuando Cursor diga "listo" |

## Si algo explota

- Error `Cannot find module`: no corriste `npm install` o te falta una dep
- Error CORS al llamar EFs: las EFs no están desplegadas todavía (paso 5)
- Error "profiles table not found": las migraciones no se aplicaron todavía (paso 4)
- Error `VITE_SUPABASE_URL is not defined`: falta el `.env.local` o la env var en Vercel
- Build falla en Vercel: revisá `npm run build` local primero; si local pasa y Vercel no, suele ser env var faltante
