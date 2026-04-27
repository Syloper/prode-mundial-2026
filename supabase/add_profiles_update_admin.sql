-- Allow admins to update any user's profile (e.g. change role)
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());
