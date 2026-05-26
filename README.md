# Prode Mundial 2026

Aplicación web para gestionar pronósticos del Mundial 2026. Los usuarios predicen resultados de partidos y acumulan puntos. El admin gestiona resultados, premios y el bracket de eliminación directa.

Desarrollado con React + TypeScript + Supabase. Marca [Syloper](https://syloper.com).

---

## Requisitos

- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com)

## Instalación

```bash
npm install
```

Copiá `.env.example` a `.env` y completá con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Encontrás estas credenciales en **Supabase → Settings → API**.

## Base de datos

Ejecutá los scripts **en este orden** en el SQL Editor de Supabase (Dashboard → SQL Editor):

1. `supabase/schema.sql` — tablas, RLS, trigger de perfiles y 72 partidos de grupos
2. `supabase/seed_knockout.sql` — 32 partidos de eliminación directa (16avos a final)

**Importante:** corré ambos scripts **antes** de registrarte en la app. El registro crea el usuario en Auth y, si el trigger está activo, una fila en `profiles` automáticamente.

Luego registrate en la app y promovete a admin (reemplazá el UUID por el de **Authentication → Users → User UID**):

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = 'TU_USER_UID_AQUI';
```

### Login exitoso pero no entra a la app

**Síntoma:** el login responde OK y el token queda guardado en `localStorage` (`prode-auth`), pero la app vuelve a `/login`. En la consola o Network aparece:

```json
{ "code": "PGRST116", "message": "Cannot coerce the result to a single JSON object" }
```

**Causa:** Supabase Auth tiene tu usuario, pero **no hay fila en `public.profiles`**. Suele pasar si te registraste antes de ejecutar `schema.sql`, o si el trigger `on_auth_user_created` no quedó instalado.

**Solución (manual):**

1. Supabase → **Authentication → Users** → abrí tu usuario y copiá el **User UID**.
2. SQL Editor → ejecutá (completá con tus datos):



```sql
INSERT INTO public.profiles (id, name, dni, role)
VALUES (
  'TU_USER_UID_AQUI',
  'Tu Nombre',
  '12345678',
  'user'
);
```

3. Recargá la app (`F5`). No hace falta volver a loguearte si el token sigue en el navegador.

**Prevención:** verificá que el trigger exista después de correr `schema.sql`:

```sql
SELECT tgname
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND tgname = 'on_auth_user_created';
```

Si no devuelve filas, volvé a ejecutar en SQL Editor el bloque de `handle_new_user` y `on_auth_user_created` de `schema.sql` (aprox. líneas 88–110).

> **Nota:** un `INSERT ... SELECT` desde `auth.users` puede fallar con `permission denied` según el rol del editor. No des permisos `SELECT` sobre `auth.users` a `anon`. Usá el UID del panel como arriba.

## Desarrollo

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

---

## Sistema de puntos

| Acierto | Puntos |
|---|---|
| Resultado exacto (ej: predijiste 2-1 y fue 2-1) | **+3** |
| Ganador correcto o empate acertado | **+1** |
| Predicción incorrecta | 0 |

El límite para cargar predicciones cierra **24 horas antes** de cada partido.

---

## Funcionalidades

### Usuarios
- Registro y login con email (emails `@syloper.com` no requieren confirmación)
- Predicción de resultados partido a partido
- Ranking general con podio top 3
- Historial de premios recibidos

### Admin (`/admin`)
- **Usuarios** — listado y búsqueda de todos los registrados
- **Resultados** — cargar y editar resultados de partidos; actualizar cruces de 16avos automáticamente desde posiciones de grupos
- **Nuevo partido** — agregar partidos de eliminación directa con autocompletado de equipos y banderas
- **Crear premio** — premios automáticos (por puntos de fecha/fase/torneo) o manuales; configuración de desempate
- **Entregar premio** — asignación manual de premios a usuarios
- **Historial** — registro completo de premios entregados
- **Configuración** — nombre de la empresa visible en la app
- **Zona peligrosa** — reiniciar resultados de todos los partidos; vaciar predicciones de un usuario

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Material UI v5, Inter font |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Routing | React Router v6 |

---

## Estructura

```
src/
├── components/
│   ├── admin/        # Formularios y tablas del panel admin
│   ├── auth/         # Login, registro, rutas protegidas
│   └── common/       # Navbar, formulario de predicción, error boundary
├── contexts/         # Auth, predicciones, premios, empresa, notificaciones
├── hooks/            # useMatches, usePrediction, usePrize, useAuth...
├── pages/            # GroupsPage, PodiumPage, AdminDashboard, Login, Register
├── utils/            # Helpers de scoring, posiciones de grupos, banderas, validadores
├── lib/              # Cliente Supabase + tipos de base de datos
└── theme.ts          # Tema Syloper (verde #00B96B, gris #2A3235)

supabase/
├── schema.sql           # Tablas, RLS, triggers, función get_rankings()
└── seed_knockout.sql    # Partidos de eliminación directa
```

Server en railway: prode-mundial-2026-syloper.up.railway.app

