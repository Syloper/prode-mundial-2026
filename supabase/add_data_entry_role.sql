-- ============================================================
-- Agregar rol "data_entry" al sistema
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Ampliar el check constraint de profiles
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'user', 'data_entry'));

-- 2. Helper: verifica si el usuario puede cargar resultados (admin o data_entry)
create or replace function public.can_load_results()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'data_entry')
  );
$$;

-- 3. Actualizar la política de UPDATE en matches para incluir data_entry
drop policy if exists "matches_update_admin" on public.matches;
create policy "matches_update_results"
  on public.matches
  for update using (public.can_load_results());

-- 4. Para promover un usuario a data_entry:
-- UPDATE public.profiles SET role = 'data_entry'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'operador@syloper.com');
