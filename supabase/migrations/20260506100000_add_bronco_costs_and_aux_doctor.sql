alter table public.broncoscopia
  add column if not exists custos_exame text,
  add column if not exists comissoes text,
  add column if not exists impostos text;

alter table public.procedimentos_cirurgicos
  add column if not exists medico_auxiliar text;
