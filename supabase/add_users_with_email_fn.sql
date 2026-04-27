-- Función accesible solo para admins que devuelve perfiles con email
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
language sql
security definer
stable
as $$
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
  where public.is_admin()
  order by p.created_at;
$$;
