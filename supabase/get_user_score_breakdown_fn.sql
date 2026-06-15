-- Desglose de puntos por partido para un jugador (solo partidos finalizados)
drop function if exists public.get_user_score_breakdown(uuid);

create or replace function public.get_user_score_breakdown(p_user_id uuid)
returns table (
  match_id          integer,
  home_team         text,
  away_team         text,
  home_team_flag    text,
  away_team_flag    text,
  scheduled_date    timestamptz,
  phase             text,
  group_name        text,
  predicted_home    integer,
  predicted_away    integer,
  actual_home       integer,
  actual_away       integer,
  points            integer
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
    m.home_score::integer,
    m.away_score::integer,
    (
      case
        when p.home_score = m.home_score and p.away_score = m.away_score then 3
        when (p.home_score > p.away_score) = (m.home_score > m.away_score)
          and (p.home_score = p.away_score) = (m.home_score = m.away_score) then 1
        else 0
      end
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
