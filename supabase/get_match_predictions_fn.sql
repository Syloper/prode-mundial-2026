-- Devuelve las predicciones de un partido con el nombre del usuario.
-- Solo accesible si el deadline ya pasó o el partido finalizó.
-- security definer: bypasses RLS para leer profiles ajenos.

drop function if exists public.get_match_predictions(integer);

create or replace function public.get_match_predictions(p_match_id integer)
returns table (user_name text, home_score integer, away_score integer)
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
      pred.away_score::integer
    from public.predictions pred
    join public.profiles pr on pr.id = pred.user_id
    where pred.match_id = p_match_id
      and pred.user_id <> auth.uid()
    order by pr.name;
end;
$$;

grant execute on function public.get_match_predictions(integer) to authenticated;
