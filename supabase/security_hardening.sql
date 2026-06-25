-- ============================================================
-- Endurecimiento de seguridad (items 1–5)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Asegurar columna is_active (por si no se ejecutó add_user_management.sql)
alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- ------------------------------------------------------------
-- 1. Registro: rol y company_code fijos, ignorar metadata
-- ------------------------------------------------------------
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
    'user',
    null
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Helpers con chequeo de cuenta activa
-- ------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.can_load_results()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'data_entry')
      and is_active = true
  );
$$;

-- ------------------------------------------------------------
-- 2. Impedir auto-elevación de rol / is_active en profiles
-- ------------------------------------------------------------
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- SQL Editor / service role (sin JWT)
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.is_active := old.is_active;
  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_columns on public.profiles;
create trigger profiles_guard_sensitive_columns
  before update on public.profiles
  for each row execute procedure public.guard_profiles_update();

-- ------------------------------------------------------------
-- 5. data_entry solo puede cambiar columnas de resultado
-- ------------------------------------------------------------
create or replace function public.guard_matches_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- SQL Editor / service role (sin JWT)
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'data_entry' and is_active = true
  ) then
    if new.id is distinct from old.id
       or new.home_team is distinct from old.home_team
       or new.away_team is distinct from old.away_team
       or new.home_team_flag is distinct from old.home_team_flag
       or new.away_team_flag is distinct from old.away_team_flag
       or new.group_name is distinct from old.group_name
       or new.scheduled_date is distinct from old.scheduled_date
       or new.result_deadline is distinct from old.result_deadline
       or new.phase is distinct from old.phase
    then
      raise exception 'data_entry solo puede actualizar home_score, away_score e is_finished';
    end if;
    return new;
  end if;

  raise exception 'Acceso denegado';
end;
$$;

drop trigger if exists matches_guard_update on public.matches;
create trigger matches_guard_update
  before update on public.matches
  for each row execute procedure public.guard_matches_update();

-- ------------------------------------------------------------
-- 3 y 4. Políticas RLS actualizadas
-- ------------------------------------------------------------

-- Profiles
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() and public.is_active_user());

-- Predictions
drop policy if exists "predictions_select" on public.predictions;
create policy "predictions_select" on public.predictions
  for select using (
    public.is_active_user()
    and (
      user_id = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.matches m
        where m.id = match_id
          and (m.is_finished = true or m.result_deadline <= now())
      )
    )
  );

drop policy if exists "predictions_insert_own" on public.predictions;
create policy "predictions_insert_own" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and public.is_active_user()
    and exists (
      select 1 from public.matches
      where id = match_id and result_deadline > now()
    )
  );

drop policy if exists "predictions_insert_admin" on public.predictions;
create policy "predictions_insert_admin" on public.predictions
  for insert with check (public.is_admin());

drop policy if exists "predictions_delete_own" on public.predictions;
create policy "predictions_delete_own" on public.predictions
  for delete using (
    auth.uid() = user_id
    and public.is_active_user()
    and exists (
      select 1 from public.matches
      where id = match_id
        and is_finished = false
        and scheduled_date > now() + interval '3 days'
    )
  );

-- Prizes y asignaciones
drop policy if exists "prizes_select" on public.prizes;
create policy "prizes_select" on public.prizes
  for select using (auth.uid() is not null and public.is_active_user());

drop policy if exists "prize_assignments_select" on public.prize_assignments;
create policy "prize_assignments_select" on public.prize_assignments
  for select using (auth.uid() is not null and public.is_active_user());

-- get_match_predictions y get_user_score_breakdown: ver
-- supabase/knockout_penalty_predictions.sql (o los *_fn.sql individuales).
-- No redefinir aquí: una copia antigua sin penalty_winner sobrescribía la firma correcta.
