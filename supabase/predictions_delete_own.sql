-- Permite a usuarios cancelar su propia predicción si faltan más de 3 días para el partido
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
