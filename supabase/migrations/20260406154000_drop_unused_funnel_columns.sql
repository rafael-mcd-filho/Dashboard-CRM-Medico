alter table public.consultas
  drop column if exists origem;

alter table public.espirometria
  drop column if exists origem,
  drop column if exists vinculo;

alter table public.broncoscopia
  drop column if exists origem,
  drop column if exists vinculo;

alter table public.procedimentos_cirurgicos
  drop column if exists origem,
  drop column if exists vinculo;
