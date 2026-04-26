-- ============================================================
-- PRODE MUNDIAL 2026 - Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  dni         text not null,
  role        text not null default 'user' check (role in ('admin', 'user')),
  company_code text,
  created_at  timestamptz not null default now()
);

-- Partidos del Mundial 2026
create table if not exists public.matches (
  id              integer primary key,
  home_team       text not null,
  away_team       text not null,
  home_team_flag  text not null,
  away_team_flag  text not null,
  group_name      text not null,
  scheduled_date  timestamptz not null,
  result_deadline timestamptz not null,
  home_score      integer check (home_score >= 0),
  away_score      integer check (away_score >= 0),
  is_finished     boolean not null default false,
  phase           text
);

-- Predicciones de usuarios
create table if not exists public.predictions (
  id          uuid default gen_random_uuid() primary key,
  match_id    integer not null references public.matches(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  home_score  integer not null check (home_score >= 0),
  away_score  integer not null check (away_score >= 0),
  created_at  timestamptz not null default now(),
  unique (match_id, user_id)
);

-- Premios
create table if not exists public.prizes (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  description     text not null,
  photo_url       text,
  criteria        text not null check (criteria in ('most_points_date', 'most_points_phase', 'most_points_tournament')),
  assignment_type text not null check (assignment_type in ('automatic', 'manual')),
  tie_resolution  text not null default 'all' check (tie_resolution in ('all', 'draw', 'first')),
  phase           text,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

-- Historial de premios entregados
create table if not exists public.prize_assignments (
  id              uuid default gen_random_uuid() primary key,
  prize_id        uuid not null references public.prizes(id) on delete cascade,
  user_id         uuid not null references auth.users(id),
  user_name       text,
  assignment_date timestamptz not null default now(),
  criteria        text not null,
  phase           text,
  assigned_by     uuid references auth.users(id)
);

-- Configuración de la aplicación (banner, nombre empresa, etc.)
create table if not exists public.app_config (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger: crea perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, dni, role, company_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'dni', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    nullif(new.raw_user_meta_data->>'company_code', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: verifica si el usuario actual es admin
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Función: ranking global (calcula puntos de todos los usuarios)
create or replace function public.get_rankings()
returns table (
  user_id        uuid,
  user_name      text,
  total_points   bigint,
  exact_scores   bigint,
  correct_winners bigint
)
language sql
security definer set search_path = public
as $$
  select
    p.user_id,
    pr.name as user_name,
    coalesce(sum(
      case
        when p.home_score = m.home_score and p.away_score = m.away_score then 3
        when (p.home_score > p.away_score) = (m.home_score > m.away_score)
          and (p.home_score = p.away_score) = (m.home_score = m.away_score) then 1
        else 0
      end
    ), 0) as total_points,
    count(case when p.home_score = m.home_score and p.away_score = m.away_score then 1 end) as exact_scores,
    count(case
      when (p.home_score != m.home_score or p.away_score != m.away_score)
        and (p.home_score > p.away_score) = (m.home_score > m.away_score)
        and (p.home_score = p.away_score) = (m.home_score = m.away_score)
      then 1
    end) as correct_winners
  from public.predictions p
  join public.matches m on p.match_id = m.id
  join public.profiles pr on p.user_id = pr.id
  where m.is_finished = true
  group by p.user_id, pr.name
  order by total_points desc;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.prizes enable row level security;
alter table public.prize_assignments enable row level security;
alter table public.app_config enable row level security;

-- Profiles: cualquier usuario autenticado puede leer; solo propio puede editar
create policy "profiles_select" on public.profiles
  for select using (auth.uid() is not null);

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Matches: lectura pública; solo admins pueden actualizar
create policy "matches_select" on public.matches
  for select using (true);

create policy "matches_update_admin" on public.matches
  for update using (public.is_admin());

create policy "matches_insert_admin" on public.matches
  for insert with check (public.is_admin());

-- Predictions: usuarios autenticados ven todas; solo insertan la propia antes del deadline
create policy "predictions_select" on public.predictions
  for select using (auth.uid() is not null);

create policy "predictions_insert_own" on public.predictions
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.matches
      where id = match_id and result_deadline > now()
    )
  );

-- Prizes: lectura para autenticados; escritura solo admins
create policy "prizes_select" on public.prizes
  for select using (auth.uid() is not null);

create policy "prizes_insert_admin" on public.prizes
  for insert with check (public.is_admin());

create policy "prizes_update_admin" on public.prizes
  for update using (public.is_admin());

-- Prize assignments: lectura para autenticados; solo admins asignan
create policy "prize_assignments_select" on public.prize_assignments
  for select using (auth.uid() is not null);

create policy "prize_assignments_insert_admin" on public.prize_assignments
  for insert with check (public.is_admin());

-- App config: lectura pública; escritura solo admins
create policy "app_config_select" on public.app_config
  for select using (true);

create policy "app_config_upsert_admin" on public.app_config
  for insert with check (public.is_admin());

create policy "app_config_update_admin" on public.app_config
  for update using (public.is_admin());

-- ============================================================
-- DATOS INICIALES: 72 partidos de la fase de grupos
-- Horarios en UTC-3 (Argentina). Ejecutar después del schema.
-- ============================================================

insert into public.matches (id, home_team, away_team, home_team_flag, away_team_flag, group_name, scheduled_date, result_deadline) values
-- GRUPO A: México, Sudáfrica, Corea del Sur, Rep. Checa
(1,  'México',        'Sudáfrica',     '🇲🇽','🇿🇦', 'A', '2026-06-11T21:00:00Z', '2026-06-10T21:00:00Z'),
(2,  'Corea del Sur', 'Rep. Checa',    '🇰🇷','🇨🇿', 'A', '2026-06-11T21:00:00Z', '2026-06-10T21:00:00Z'),
(3,  'México',        'Corea del Sur', '🇲🇽','🇰🇷', 'A', '2026-06-15T21:00:00Z', '2026-06-14T21:00:00Z'),
(4,  'Sudáfrica',     'Rep. Checa',    '🇿🇦','🇨🇿', 'A', '2026-06-15T21:00:00Z', '2026-06-14T21:00:00Z'),
(5,  'México',        'Rep. Checa',    '🇲🇽','🇨🇿', 'A', '2026-06-22T21:00:00Z', '2026-06-21T21:00:00Z'),
(6,  'Sudáfrica',     'Corea del Sur', '🇿🇦','🇰🇷', 'A', '2026-06-22T21:00:00Z', '2026-06-21T21:00:00Z'),
-- GRUPO B: Canadá, Bosnia y Herz., Qatar, Suiza
(7,  'Canadá',        'Bosnia y Herz.','🇨🇦','🇧🇦', 'B', '2026-06-11T23:00:00Z', '2026-06-10T23:00:00Z'),
(8,  'Qatar',         'Suiza',         '🇶🇦','🇨🇭', 'B', '2026-06-11T23:00:00Z', '2026-06-10T23:00:00Z'),
(9,  'Canadá',        'Qatar',         '🇨🇦','🇶🇦', 'B', '2026-06-15T23:00:00Z', '2026-06-14T23:00:00Z'),
(10, 'Bosnia y Herz.','Suiza',         '🇧🇦','🇨🇭', 'B', '2026-06-15T23:00:00Z', '2026-06-14T23:00:00Z'),
(11, 'Canadá',        'Suiza',         '🇨🇦','🇨🇭', 'B', '2026-06-22T23:00:00Z', '2026-06-21T23:00:00Z'),
(12, 'Bosnia y Herz.','Qatar',         '🇧🇦','🇶🇦', 'B', '2026-06-22T23:00:00Z', '2026-06-21T23:00:00Z'),
-- GRUPO C: Brasil, Marruecos, Haití, Escocia
(13, 'Brasil',        'Marruecos',     '🇧🇷','🇲🇦', 'C', '2026-06-12T01:00:00Z', '2026-06-11T01:00:00Z'),
(14, 'Haití',         'Escocia',       '🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', '2026-06-12T01:00:00Z', '2026-06-11T01:00:00Z'),
(15, 'Brasil',        'Haití',         '🇧🇷','🇭🇹', 'C', '2026-06-16T01:00:00Z', '2026-06-15T01:00:00Z'),
(16, 'Marruecos',     'Escocia',       '🇲🇦','🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', '2026-06-16T01:00:00Z', '2026-06-15T01:00:00Z'),
(17, 'Brasil',        'Escocia',       '🇧🇷','🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', '2026-06-23T01:00:00Z', '2026-06-22T01:00:00Z'),
(18, 'Marruecos',     'Haití',         '🇲🇦','🇭🇹', 'C', '2026-06-23T01:00:00Z', '2026-06-22T01:00:00Z'),
-- GRUPO D: Estados Unidos, Paraguay, Australia, Turquía
(19, 'Estados Unidos','Paraguay',      '🇺🇸','🇵🇾', 'D', '2026-06-12T21:00:00Z', '2026-06-11T21:00:00Z'),
(20, 'Australia',     'Turquía',       '🇦🇺','🇹🇷', 'D', '2026-06-12T21:00:00Z', '2026-06-11T21:00:00Z'),
(21, 'Estados Unidos','Australia',     '🇺🇸','🇦🇺', 'D', '2026-06-16T21:00:00Z', '2026-06-15T21:00:00Z'),
(22, 'Paraguay',      'Turquía',       '🇵🇾','🇹🇷', 'D', '2026-06-16T21:00:00Z', '2026-06-15T21:00:00Z'),
(23, 'Estados Unidos','Turquía',       '🇺🇸','🇹🇷', 'D', '2026-06-23T21:00:00Z', '2026-06-22T21:00:00Z'),
(24, 'Paraguay',      'Australia',     '🇵🇾','🇦🇺', 'D', '2026-06-23T21:00:00Z', '2026-06-22T21:00:00Z'),
-- GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
(25, 'Alemania',      'Curazao',       '🇩🇪','🇨🇼', 'E', '2026-06-13T23:00:00Z', '2026-06-12T23:00:00Z'),
(26, 'Costa de Marfil','Ecuador',      '🇨🇮','🇪🇨', 'E', '2026-06-13T23:00:00Z', '2026-06-12T23:00:00Z'),
(27, 'Alemania',      'Costa de Marfil','🇩🇪','🇨🇮','E', '2026-06-17T23:00:00Z', '2026-06-16T23:00:00Z'),
(28, 'Curazao',       'Ecuador',       '🇨🇼','🇪🇨', 'E', '2026-06-17T23:00:00Z', '2026-06-16T23:00:00Z'),
(29, 'Alemania',      'Ecuador',       '🇩🇪','🇪🇨', 'E', '2026-06-24T23:00:00Z', '2026-06-23T23:00:00Z'),
(30, 'Curazao',       'Costa de Marfil','🇨🇼','🇨🇮','E', '2026-06-24T23:00:00Z', '2026-06-23T23:00:00Z'),
-- GRUPO F: Países Bajos, Japón, Suecia, Túnez
(31, 'Países Bajos',  'Japón',         '🇳🇱','🇯🇵', 'F', '2026-06-14T01:00:00Z', '2026-06-13T01:00:00Z'),
(32, 'Suecia',        'Túnez',         '🇸🇪','🇹🇳', 'F', '2026-06-14T01:00:00Z', '2026-06-13T01:00:00Z'),
(33, 'Países Bajos',  'Suecia',        '🇳🇱','🇸🇪', 'F', '2026-06-18T01:00:00Z', '2026-06-17T01:00:00Z'),
(34, 'Japón',         'Túnez',         '🇯🇵','🇹🇳', 'F', '2026-06-18T01:00:00Z', '2026-06-17T01:00:00Z'),
(35, 'Países Bajos',  'Túnez',         '🇳🇱','🇹🇳', 'F', '2026-06-25T01:00:00Z', '2026-06-24T01:00:00Z'),
(36, 'Japón',         'Suecia',        '🇯🇵','🇸🇪', 'F', '2026-06-25T01:00:00Z', '2026-06-24T01:00:00Z'),
-- GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
(37, 'Bélgica',       'Egipto',        '🇧🇪','🇪🇬', 'G', '2026-06-14T21:00:00Z', '2026-06-13T21:00:00Z'),
(38, 'Irán',          'Nueva Zelanda', '🇮🇷','🇳🇿', 'G', '2026-06-14T21:00:00Z', '2026-06-13T21:00:00Z'),
(39, 'Bélgica',       'Irán',          '🇧🇪','🇮🇷', 'G', '2026-06-18T21:00:00Z', '2026-06-17T21:00:00Z'),
(40, 'Egipto',        'Nueva Zelanda', '🇪🇬','🇳🇿', 'G', '2026-06-18T21:00:00Z', '2026-06-17T21:00:00Z'),
(41, 'Bélgica',       'Nueva Zelanda', '🇧🇪','🇳🇿', 'G', '2026-06-25T21:00:00Z', '2026-06-24T21:00:00Z'),
(42, 'Egipto',        'Irán',          '🇪🇬','🇮🇷', 'G', '2026-06-25T21:00:00Z', '2026-06-24T21:00:00Z'),
-- GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
(43, 'España',        'Cabo Verde',    '🇪🇸','🇨🇻', 'H', '2026-06-14T23:00:00Z', '2026-06-13T23:00:00Z'),
(44, 'Arabia Saudita','Uruguay',       '🇸🇦','🇺🇾', 'H', '2026-06-14T23:00:00Z', '2026-06-13T23:00:00Z'),
(45, 'España',        'Arabia Saudita','🇪🇸','🇸🇦', 'H', '2026-06-18T23:00:00Z', '2026-06-17T23:00:00Z'),
(46, 'Cabo Verde',    'Uruguay',       '🇨🇻','🇺🇾', 'H', '2026-06-18T23:00:00Z', '2026-06-17T23:00:00Z'),
(47, 'España',        'Uruguay',       '🇪🇸','🇺🇾', 'H', '2026-06-25T23:00:00Z', '2026-06-24T23:00:00Z'),
(48, 'Cabo Verde',    'Arabia Saudita','🇨🇻','🇸🇦', 'H', '2026-06-25T23:00:00Z', '2026-06-24T23:00:00Z'),
-- GRUPO I: Francia, Senegal, Irak, Noruega
(49, 'Francia',       'Senegal',       '🇫🇷','🇸🇳', 'I', '2026-06-16T01:00:00Z', '2026-06-15T01:00:00Z'),
(50, 'Irak',          'Noruega',       '🇮🇶','🇳🇴', 'I', '2026-06-16T01:00:00Z', '2026-06-15T01:00:00Z'),
(51, 'Francia',       'Irak',          '🇫🇷','🇮🇶', 'I', '2026-06-20T01:00:00Z', '2026-06-19T01:00:00Z'),
(52, 'Senegal',       'Noruega',       '🇸🇳','🇳🇴', 'I', '2026-06-20T01:00:00Z', '2026-06-19T01:00:00Z'),
(53, 'Francia',       'Noruega',       '🇫🇷','🇳🇴', 'I', '2026-06-27T01:00:00Z', '2026-06-26T01:00:00Z'),
(54, 'Senegal',       'Irak',          '🇸🇳','🇮🇶', 'I', '2026-06-27T01:00:00Z', '2026-06-26T01:00:00Z'),
-- GRUPO J: Argentina, Argelia, Austria, Jordania
(55, 'Argentina',     'Argelia',       '🇦🇷','🇩🇿', 'J', '2026-06-15T21:00:00Z', '2026-06-14T21:00:00Z'),
(56, 'Austria',       'Jordania',      '🇦🇹','🇯🇴', 'J', '2026-06-15T21:00:00Z', '2026-06-14T21:00:00Z'),
(57, 'Argentina',     'Austria',       '🇦🇷','🇦🇹', 'J', '2026-06-19T21:00:00Z', '2026-06-18T21:00:00Z'),
(58, 'Argelia',       'Jordania',      '🇩🇿','🇯🇴', 'J', '2026-06-19T21:00:00Z', '2026-06-18T21:00:00Z'),
(59, 'Argentina',     'Jordania',      '🇦🇷','🇯🇴', 'J', '2026-06-26T21:00:00Z', '2026-06-25T21:00:00Z'),
(60, 'Argelia',       'Austria',       '🇩🇿','🇦🇹', 'J', '2026-06-26T21:00:00Z', '2026-06-25T21:00:00Z'),
-- GRUPO K: Portugal, RD Congo, Uzbekistán, Colombia
(61, 'Portugal',      'RD Congo',      '🇵🇹','🇨🇩', 'K', '2026-06-16T23:00:00Z', '2026-06-15T23:00:00Z'),
(62, 'Uzbekistán',    'Colombia',      '🇺🇿','🇨🇴', 'K', '2026-06-16T23:00:00Z', '2026-06-15T23:00:00Z'),
(63, 'Portugal',      'Uzbekistán',    '🇵🇹','🇺🇿', 'K', '2026-06-20T23:00:00Z', '2026-06-19T23:00:00Z'),
(64, 'RD Congo',      'Colombia',      '🇨🇩','🇨🇴', 'K', '2026-06-20T23:00:00Z', '2026-06-19T23:00:00Z'),
(65, 'Portugal',      'Colombia',      '🇵🇹','🇨🇴', 'K', '2026-06-27T23:00:00Z', '2026-06-26T23:00:00Z'),
(66, 'RD Congo',      'Uzbekistán',    '🇨🇩','🇺🇿', 'K', '2026-06-27T23:00:00Z', '2026-06-26T23:00:00Z'),
-- GRUPO L: Inglaterra, Croacia, Ghana, Panamá
(67, 'Inglaterra',    'Croacia',       '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷', 'L', '2026-06-17T01:00:00Z', '2026-06-16T01:00:00Z'),
(68, 'Ghana',         'Panamá',        '🇬🇭','🇵🇦', 'L', '2026-06-17T01:00:00Z', '2026-06-16T01:00:00Z'),
(69, 'Inglaterra',    'Ghana',         '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭', 'L', '2026-06-21T01:00:00Z', '2026-06-20T01:00:00Z'),
(70, 'Croacia',       'Panamá',        '🇭🇷','🇵🇦', 'L', '2026-06-21T01:00:00Z', '2026-06-20T01:00:00Z'),
(71, 'Inglaterra',    'Panamá',        '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇦', 'L', '2026-06-28T01:00:00Z', '2026-06-27T01:00:00Z'),
(72, 'Croacia',       'Ghana',         '🇭🇷','🇬🇭', 'L', '2026-06-28T01:00:00Z', '2026-06-27T01:00:00Z')
on conflict (id) do nothing;

-- Config inicial
insert into public.app_config (key, value) values
  ('company_name', null),
  ('banner_url', null)
on conflict (key) do nothing;

-- ============================================================
-- CREAR ADMIN INICIAL
-- Reemplaza 'admin@tuempresa.com' y 'PASSWORD_SEGURO' con tus datos.
-- Ejecutar DESPUÉS de registrar el usuario por primera vez via la app,
-- o crear directamente en Supabase Auth → Users → Add user.
-- Luego ejecutar para promoverlo a admin:
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@tuempresa.com'
-- );

-- ============================================================
-- Auto-confirmar emails @syloper.com sin verificación
-- ============================================================
create or replace function public.auto_confirm_syloper_email()
returns trigger
language plpgsql
security definer set search_path = auth
as $$
begin
  if new.email ilike '%@syloper.com' then
    new.email_confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_syloper_email_auto_confirm on auth.users;
create trigger on_syloper_email_auto_confirm
  before insert on auth.users
  for each row execute procedure public.auto_confirm_syloper_email();
