alter table public.consultas
  add column if not exists tag_names_card text;

alter table public.espirometria
  add column if not exists tag_names_card text;

alter table public.broncoscopia
  add column if not exists tag_names_card text;

alter table public.procedimentos_cirurgicos
  add column if not exists tag_names_card text;
