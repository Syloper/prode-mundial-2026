-- ============================================================
-- Ranking autenticado + DNI único
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. get_rankings: solo usuarios autenticados y activos
-- ------------------------------------------------------------
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
      case
        when p.home_score = m.home_score and p.away_score = m.away_score then 3
        when (p.home_score > p.away_score) = (m.home_score > m.away_score)
          and (p.home_score = p.away_score) = (m.home_score = m.away_score) then 1
        else 0
      end
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

-- ------------------------------------------------------------
-- 4. DNI único (7–9 dígitos; legacy con DNI vacío/inválido no bloquea)
-- ------------------------------------------------------------

-- Revisar duplicados antes de aplicar (ejecutar manualmente si falla el índice):
-- select dni, count(*) as n from public.profiles
-- where dni ~ '^\d{7,9}$' group by dni having count(*) > 1;

update public.profiles set dni = trim(dni) where dni <> trim(dni);

create unique index if not exists profiles_dni_unique
  on public.profiles (dni)
  where dni ~ '^\d{7,9}$';
