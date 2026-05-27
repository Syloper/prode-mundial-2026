-- Listado de usuarios con email para el panel admin.
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de schema.sql y add_user_management.sql)

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
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;

  return query
    select
      p.id::uuid,
      p.name::text,
      p.dni::text,
      p.role::text,
      p.created_at::timestamptz,
      u.email::text,
      p.is_active::boolean
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

grant execute on function public.get_users_with_email() to authenticated;
