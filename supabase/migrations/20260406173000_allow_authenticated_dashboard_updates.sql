drop policy if exists "Authenticated dashboard users can update consultas" on public.consultas;
drop policy if exists "Authenticated dashboard users can update espirometria" on public.espirometria;
drop policy if exists "Authenticated dashboard users can update broncoscopia" on public.broncoscopia;
drop policy if exists "Authenticated dashboard users can update procedimentos" on public.procedimentos_cirurgicos;

create policy "Authenticated dashboard users can update consultas"
  on public.consultas
  for update
  to authenticated
  using ((select public.can_read_dashboard()))
  with check ((select public.can_read_dashboard()));

create policy "Authenticated dashboard users can update espirometria"
  on public.espirometria
  for update
  to authenticated
  using ((select public.can_read_dashboard()))
  with check ((select public.can_read_dashboard()));

create policy "Authenticated dashboard users can update broncoscopia"
  on public.broncoscopia
  for update
  to authenticated
  using ((select public.can_read_dashboard()))
  with check ((select public.can_read_dashboard()));

create policy "Authenticated dashboard users can update procedimentos"
  on public.procedimentos_cirurgicos
  for update
  to authenticated
  using ((select public.can_read_dashboard()))
  with check ((select public.can_read_dashboard()));
