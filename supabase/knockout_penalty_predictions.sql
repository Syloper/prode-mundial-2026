-- ============================================================
-- Predicciones de penales en eliminación directa
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

alter table public.matches
  add column if not exists penalty_winner text;

alter table public.predictions
  add column if not exists penalty_winner text;

alter table public.matches drop constraint if exists matches_penalty_winner_check;
alter table public.predictions drop constraint if exists predictions_penalty_winner_check;
alter table public.matches drop constraint if exists matches_penalty_winner_only_on_tie;
alter table public.predictions drop constraint if exists predictions_penalty_winner_only_on_tie;

alter table public.matches
  add constraint matches_penalty_winner_only_on_tie check (
    penalty_winner is null
    or (
      home_score is not null
      and away_score is not null
      and home_score = away_score
      and penalty_winner in ('home', 'away')
    )
  );

alter table public.predictions
  add constraint predictions_penalty_winner_only_on_tie check (
    penalty_winner is null
    or (home_score = away_score and penalty_winner in ('home', 'away'))
  );

-- Puntos: base (3 exacto / 1 ganador o empate) + bonus penales (+2) en fases eliminatorias excepto Tercer puesto
create or replace function public.calculate_prediction_points(
  p_predicted_home integer,
  p_predicted_away integer,
  p_actual_home integer,
  p_actual_away integer,
  p_predicted_penalty_winner text,
  p_actual_penalty_winner text,
  p_phase text
)
returns integer
language sql
immutable
as $$
  select
    (
      case
        when p_predicted_home = p_actual_home and p_predicted_away = p_actual_away then 3
        when (p_predicted_home > p_predicted_away) = (p_actual_home > p_actual_away)
          and (p_predicted_home = p_predicted_away) = (p_actual_home = p_actual_away) then 1
        else 0
      end
    )
    +
    (
      case
        when p_phase is not null
          and p_phase <> 'Tercer puesto'
          and p_predicted_home = p_predicted_away
          and p_actual_home = p_actual_away
          and p_predicted_penalty_winner is not null
          and p_actual_penalty_winner is not null
          and p_predicted_penalty_winner = p_actual_penalty_winner
        then 2
        else 0
      end
    );
$$;

-- data_entry puede actualizar también penalty_winner en partidos
create or replace function public.guard_matches_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
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
      raise exception 'data_entry solo puede actualizar home_score, away_score, penalty_winner e is_finished';
    end if;
    return new;
  end if;

  raise exception 'Acceso denegado';
end;
$$;

-- Ranking global
create or replace function public.get_rankings()
returns table (
  user_id         uuid,
  user_name       text,
  total_points    bigint,
  exact_scores    bigint,
  correct_winners bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not public.is_active_user() then
    raise exception 'Cuenta desactivada';
  end if;

  return query
  select
    p.user_id,
    pr.name as user_name,
    coalesce(sum(
      public.calculate_prediction_points(
        p.home_score, p.away_score,
        m.home_score, m.away_score,
        p.penalty_winner, m.penalty_winner,
        m.phase
      )
    ), 0)::bigint as total_points,
    count(case when p.home_score = m.home_score and p.away_score = m.away_score then 1 end)::bigint as exact_scores,
    count(case
      when (p.home_score != m.home_score or p.away_score != m.away_score)
        and (p.home_score > p.away_score) = (m.home_score > m.away_score)
        and (p.home_score = p.away_score) = (m.home_score = m.away_score)
      then 1
    end)::bigint as correct_winners
  from public.predictions p
  join public.matches m on p.match_id = m.id
  join public.profiles pr on p.user_id = pr.id
  where m.is_finished = true
  group by p.user_id, pr.name
  order by total_points desc;
end;
$$;

revoke all on function public.get_rankings() from public;
revoke all on function public.get_rankings() from anon;
grant execute on function public.get_rankings() to authenticated;

-- Desglose de puntos por jugador
drop function if exists public.get_user_score_breakdown(uuid);

create or replace function public.get_user_score_breakdown(p_user_id uuid)
returns table (
  match_id                  integer,
  home_team                 text,
  away_team                 text,
  home_team_flag            text,
  away_team_flag            text,
  scheduled_date            timestamptz,
  phase                     text,
  group_name                text,
  predicted_home            integer,
  predicted_away            integer,
  predicted_penalty_winner  text,
  actual_home               integer,
  actual_away               integer,
  actual_penalty_winner     text,
  points                    integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not public.is_active_user() then
    raise exception 'Cuenta desactivada';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Jugador no encontrado';
  end if;

  return query
  select
    m.id::integer,
    m.home_team::text,
    m.away_team::text,
    m.home_team_flag::text,
    m.away_team_flag::text,
    m.scheduled_date,
    m.phase::text,
    m.group_name::text,
    p.home_score::integer,
    p.away_score::integer,
    p.penalty_winner::text,
    m.home_score::integer,
    m.away_score::integer,
    m.penalty_winner::text,
    public.calculate_prediction_points(
      p.home_score, p.away_score,
      m.home_score, m.away_score,
      p.penalty_winner, m.penalty_winner,
      m.phase
    )::integer as points
  from public.predictions p
  join public.matches m on p.match_id = m.id
  where p.user_id = p_user_id
    and m.is_finished = true
    and m.home_score is not null
    and m.away_score is not null
  order by m.scheduled_date desc;
end;
$$;

revoke all on function public.get_user_score_breakdown(uuid) from public;
revoke all on function public.get_user_score_breakdown(uuid) from anon;
grant execute on function public.get_user_score_breakdown(uuid) to authenticated;

-- Predicciones ajenas visibles tras el deadline
drop function if exists public.get_match_predictions(integer);

create or replace function public.get_match_predictions(p_match_id integer)
returns table (
  user_name       text,
  home_score      integer,
  away_score      integer,
  penalty_winner  text
)
language plpgsql security definer stable
set search_path = public
as $$
declare
  v_deadline timestamptz;
  v_finished boolean;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not public.is_active_user() then
    raise exception 'Cuenta desactivada';
  end if;

  select m.result_deadline, m.is_finished
    into v_deadline, v_finished
    from public.matches m
   where m.id = p_match_id;

  if not found then
    raise exception 'Partido no encontrado';
  end if;

  if not v_finished and now() < v_deadline then
    raise exception 'Las predicciones no están disponibles todavía';
  end if;

  return query
    select
      pr.name::text,
      pred.home_score::integer,
      pred.away_score::integer,
      pred.penalty_winner::text
    from public.predictions pred
    join public.profiles pr on pr.id = pred.user_id
    where pred.match_id = p_match_id
      and pred.user_id <> auth.uid()
    order by pr.name;
end;
$$;

grant execute on function public.get_match_predictions(integer) to authenticated;
