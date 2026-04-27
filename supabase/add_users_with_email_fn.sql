drop function if exists public.get_users_with_email();

create or replace function public.get_users_with_email()
returns table (
  id uuid,
  name text,
  dni text,
  role text,
  created_at timestamptz,
  email text,
  is_active boolean
)
language plpgsql
security definer
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;

  return query
    select
      p.id,
      p.name,
      p.dni,
      p.role::text,
      p.created_at,
      u.email,
      p.is_active
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;
