-- Columna para desactivar usuarios
alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Función para eliminar un usuario (requiere ser admin)
-- security definer corre como superuser y puede borrar de auth.users
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;
  if target_id = auth.uid() then
    raise exception 'No podés eliminarte a vos mismo';
  end if;
  if exists (select 1 from public.profiles where id = target_id and role = 'admin') then
    raise exception 'No podés eliminar a otro administrador';
  end if;
  delete from auth.users where id = target_id;
end;
$$;
