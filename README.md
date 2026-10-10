# Clínica Dental Bethania

Sistema de gestión para clínicas dentales (español, moneda Q): agenda por
consultorio, expedientes con odontograma FDI, planes y ficha de tratamiento,
notas clínicas, facturación, laboratorio, recordatorios por WhatsApp,
dashboard con KPIs, tutoriales guiados y administración con roles.

Demo en producción: https://clinica-dental-bethania.vercel.app

## Stack

- **Cliente:** React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + `react-odontogram`
- **Backend:** Supabase (Postgres + Auth + Storage) directo desde el cliente,
  más funciones serverless en `api/` (Vercel) para auth con cookies HttpOnly,
  Turnstile y el cron de recordatorios
- **Deploy:** Vercel (`vercel.json`), `dist/` como salida

## Desarrollo local

Requiere Node 22 y pnpm 10+.

```bash
cp .env.example .env   # o pide las claves del proyecto Supabase
pnpm install
pnpm dev               # Vite en http://localhost:5173
```

La API de desarrollo (`/api/auth/*`) la sirve `vite-auth-plugin.ts`; en
producción la sirven las funciones de `api/`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` / `pnpm dev:lan` | Servidor Vite local |
| `pnpm build` | Genera `openapi.json` (prebuild) y compila a `dist/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm openapi` | Regenera `public/openapi.json` desde los schemas Zod |

## Base de datos (Supabase)

Orden de aplicación para una BD desde cero:

1. `supabase-schema.sql` — tablas clínicas + RLS base
2. `supabase-admin.sql` — módulos, perfiles, bitácora, funciones `is_superadmin`,
   `is_active_staff`, `get_user_modules` (extraído de producción)
3. `supabase-rls-fix.sql` — políticas auth-only + triggers de columnas
4. `supabase-rls-roles.sql` — RLS por personal activo + bitácora restringida
5. `supabase-contabilidad.sql` — facturas solo anulables, nunca borrables
6. `supabase-fotos.sql` — tabla + bucket privado `expedientes`
7. `supabase-ficha.sql` — columna `ficha_observaciones`

Ver `docs/RESPALDOS.md` para el procedimiento de respaldos y restauración.

## Seguridad

- RLS en todas las tablas: solo personal activo (`is_active_staff()`); RPC
  `get_user_modules` exige sesión; Turnstile + rate limiting server-side en login;
  revocación de refresh token en logout. Detalle de decisiones en el historial
  de commits `fix(security)`.
