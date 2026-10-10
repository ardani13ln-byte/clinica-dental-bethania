# Respaldos — Clínica Dental Bethania

Supabase (plan actual) **no incluye respaldos automáticos**. Esta es la estrategia oficial.

## Qué se respalda

| Qué | Cómo | Incluye |
|---|---|---|
| Base de datos (tablas + usuarios auth) | `pg_dump` formato custom | Todo `public.*` + `auth.users` (los logins se conservan) |
| Fotos (`expedientes`) | Descarga de objetos Storage | **No** van en el pg_dump, solo su metadata |

Tamaño típico actual: ~360 KB el dump completo.

## Respaldo manual

```bash
export PGPASSWORD='<postgres pooler>'
pg_dump "host=aws-0-us-east-1.pooler.supabase.com port=6543 dbname=postgres \
  user=postgres.ldogupfwtljdslgrxapq sslmode=require" \
  --format=custom --compress=9 --no-owner --no-privileges \
  --file="respaldo-$(date +%Y%m%d-%H%M%S).dump"
```

Verificar integridad:

```bash
pg_restore --list respaldo-*.dump | grep -c "TABLE DATA"   # ~58
pg_restore --list respaldo-*.dump | grep "TABLE DATA public"
```

## Restauración (desastre total)

```bash
pg_restore --clean --if-exists -d "<nueva BD>" respaldo-YYYYMMDD-HHMMSS.dump
```

Luego actualiza `VITE_SUPABASE_URL` / keys en Vercel si cambió el proyecto.
Las fotos se restauran subiendo de nuevo los archivos al bucket `expedientes`
con las mismas rutas (`pacientes/<id>/...`) registradas en `fotos_tratamiento`.

## Automatización

`.github/workflows/respaldo.yml` corre `pg_dump` cada domingo 03:00 (America/Guatemala)
y guarda el artefacto 90 días. Requiere el secreto `DATABASE_URL` en el repo
(Settings → Secrets → Actions) con la URL del pooler incluyendo la contraseña.

## Frecuencia recomendada

- Automático semanal (GitHub Action) + manual antes de cualquier migración.
- Probar restauración 1 vez por trimestre en un proyecto Supabase de prueba.
