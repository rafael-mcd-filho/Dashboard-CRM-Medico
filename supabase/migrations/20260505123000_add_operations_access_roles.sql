create table if not exists public.operations_access (
  email text primary key,
  role text not null check (role in ('viewer', 'editor')),
  active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

alter table public.operations_access enable row level security;

grant select on public.operations_access to authenticated;

drop policy if exists "Users can read own operations access" on public.operations_access;
create policy "Users can read own operations access"
  on public.operations_access
  for select
  to authenticated
  using (
    lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create or replace function public.get_operations_access_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select oa.role
  from public.operations_access oa
  where lower(oa.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and oa.active = true
  limit 1;
$$;

create or replace function public.can_read_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_operations_access_role() in ('viewer', 'editor'), false);
$$;

create or replace function public.can_edit_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_operations_access_role() = 'editor', false);
$$;

revoke all on function public.get_operations_access_role() from public;
revoke all on function public.can_read_operations() from public;
revoke all on function public.can_edit_operations() from public;

grant execute on function public.get_operations_access_role() to authenticated;
grant execute on function public.can_read_operations() to authenticated;
grant execute on function public.can_edit_operations() to authenticated;

insert into public.operations_access (email, role, active)
values
  ('admin@v4.com.br', 'editor', true),
  ('micheles@finfitness.com.br', 'viewer', true),
  ('dayanne@finfitness.com.br', 'viewer', true),
  ('renata@finfitness.com.br', 'viewer', true),
  ('fabio@finfitness.com.br', 'viewer', true)
on conflict (email) do update
set role = excluded.role,
    active = excluded.active;

update public.dashboard_access da
set active = false
from auth.users au
where da.auth_user_id = au.id
  and lower(au.email) in (
    'micheles@finfitness.com.br',
    'dayanne@finfitness.com.br',
    'renata@finfitness.com.br',
    'fabio@finfitness.com.br'
  );

drop policy if exists "Operations users can read consultas" on public.consultas;
drop policy if exists "Operations users can read espirometria" on public.espirometria;
drop policy if exists "Operations users can read broncoscopia" on public.broncoscopia;
drop policy if exists "Operations users can read procedimentos" on public.procedimentos_cirurgicos;

create policy "Operations users can read consultas"
  on public.consultas
  for select
  to authenticated
  using ((select public.can_read_operations()));

create policy "Operations users can read espirometria"
  on public.espirometria
  for select
  to authenticated
  using ((select public.can_read_operations()));

create policy "Operations users can read broncoscopia"
  on public.broncoscopia
  for select
  to authenticated
  using ((select public.can_read_operations()));

create policy "Operations users can read procedimentos"
  on public.procedimentos_cirurgicos
  for select
  to authenticated
  using ((select public.can_read_operations()));

drop policy if exists "Authenticated dashboard users can update consultas" on public.consultas;
drop policy if exists "Authenticated dashboard users can update espirometria" on public.espirometria;
drop policy if exists "Authenticated dashboard users can update broncoscopia" on public.broncoscopia;
drop policy if exists "Authenticated dashboard users can update procedimentos" on public.procedimentos_cirurgicos;
drop policy if exists "Operations editors can update consultas" on public.consultas;
drop policy if exists "Operations editors can update espirometria" on public.espirometria;
drop policy if exists "Operations editors can update broncoscopia" on public.broncoscopia;
drop policy if exists "Operations editors can update procedimentos" on public.procedimentos_cirurgicos;

create policy "Operations editors can update consultas"
  on public.consultas
  for update
  to authenticated
  using ((select public.can_edit_operations()))
  with check ((select public.can_edit_operations()));

create policy "Operations editors can update espirometria"
  on public.espirometria
  for update
  to authenticated
  using ((select public.can_edit_operations()))
  with check ((select public.can_edit_operations()));

create policy "Operations editors can update broncoscopia"
  on public.broncoscopia
  for update
  to authenticated
  using ((select public.can_edit_operations()))
  with check ((select public.can_edit_operations()));

create policy "Operations editors can update procedimentos"
  on public.procedimentos_cirurgicos
  for update
  to authenticated
  using ((select public.can_edit_operations()))
  with check ((select public.can_edit_operations()));
