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

Ejecutá el script en el SQL Editor de Supabase:

```
supabase/schema.sql          ← schema completo + 72 partidos de grupos
supabase/seed_knockout.sql   ← 32 partidos de eliminación directa (16avos a final)
```

Luego registrate en la app y promovete a admin:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');
```

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